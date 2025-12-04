import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Gift, CheckCircle, Clock, Package, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRealtimeManager } from "@/hooks/useRealtimeManager";
import { RedemptionConfirmDialog } from "./RedemptionConfirmDialog";
import { useRedemptionStatus } from "@/hooks/useRedemptionStatus";

interface RewardItem {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  image_url?: string;
}

interface RedeemedReward {
  id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  created_at: string;
  reward: {
    title: string;
    description?: string;
    image_url?: string;
  };
}

export const Rewards = () => {
  const { user } = useAuthContext();
  const [items, setItems] = useState<RewardItem[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastRedeemedReward, setLastRedeemedReward] = useState<{ title: string; points: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');

  // Listen for redemption status updates (approved/rejected)
  useRedemptionStatus();

  // Centralized realtime subscriptions
  useRealtimeManager({
    subscriptions: user?.id ? [
      {
        table: 'user_points',
        event: '*',
        filter: `user_id=eq.${user.id}`,
        callback: (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'total_points' in payload.new) {
            setPoints(payload.new.total_points);
          }
        },
      },
      {
        table: 'rewards_items',
        event: '*',
        callback: async () => {
          // Refetch rewards when they change
          try {
            const { data: itemsData, error: itemsErr } = await supabase
              .from("rewards_items")
              .select("id,title,description,points_cost,image_url")
              .eq("is_active", true)
              .order("created_at", { ascending: false });

            if (itemsErr) throw itemsErr;
            setItems(itemsData || []);
          } catch (e) {
            console.error('Error refreshing rewards:', e);
          }
        },
      },
      {
        table: 'reward_redemptions',
        event: '*',
        filter: `user_id=eq.${user.id}`,
        callback: () => {
          // Refetch redeemed rewards when they change
          fetchRedeemedRewards();
        },
      },
    ] : [],
    enabled: !!user?.id,
    channelName: 'rewards-realtime',
    debounceMs: 1000,
  });

  const fetchRedeemedRewards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select(`
          id,
          reward_id,
          points_spent,
          status,
          created_at,
          reward:rewards_items(title, description, image_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRedeemedRewards((data as RedeemedReward[]) || []);
    } catch (e) {
      console.error('Error fetching redeemed rewards:', e);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [{ data: itemsData, error: itemsErr }, { data: pointsData, error: pointsErr }] = await Promise.all([
          supabase.from("rewards_items").select("id,title,description,points_cost,image_url").eq("is_active", true).order("created_at", { ascending: false }),
          supabase.from("user_points").select("total_points").eq("user_id", user?.id ?? "").maybeSingle()
        ]);
        if (itemsErr) throw itemsErr;
        if (pointsErr) throw pointsErr;
        setItems(itemsData || []);
        setPoints(pointsData?.total_points ?? 0);

        // Also fetch redeemed rewards
        await fetchRedeemedRewards();
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar loja de recompensas");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAll();
    }
  }, [user?.id]);

  const redeem = async (id: string) => {
    if (!user?.id) return;
    setRedeeming(id);

    const reward = items.find(item => item.id === id);
    if (!reward) return;

    try {
      const { error } = await supabase.rpc("redeem_reward", { _reward_id: id });
      if (error) throw error;

      setLastRedeemedReward({
        title: reward.title,
        points: reward.points_cost,
      });
      setShowConfirmDialog(true);

      // Refresh points and redeemed rewards
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pointsData) {
        setPoints(pointsData.total_points);
      }

      await fetchRedeemedRewards();
    } catch (e: any) {
      const msg = e?.message || "Erro ao resgatar";
      toast.error(msg);
    } finally {
      setRedeeming(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-medium">
            <Clock size={12} />
            Aguardando
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium">
            <CheckCircle size={12} />
            Aprovado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
            <Package size={12} />
            Entregue
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
            Recusado
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <RedemptionConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        rewardTitle={lastRedeemedReward?.title || ''}
        pointsSpent={lastRedeemedReward?.points || 0}
      />

      <div className="p-4 pt-8 pb-safe">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Recompensas</h1>
          <p className="text-muted-foreground">Troque seus pontos por prêmios incríveis</p>
        </div>

        {/* Points Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Seus Pontos</h3>
              <p className="text-sm text-muted-foreground">Disponíveis para troca</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{points}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'available'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
          >
            <Gift size={18} />
            Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('redeemed')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'redeemed'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
          >
            <History size={18} />
            Meus Resgates
            {redeemedRewards.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {redeemedRewards.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-muted-foreground">Carregando recompensas...</p>
            </div>
          </div>
        ) : activeTab === 'available' ? (
          // Available Rewards Tab
          items.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Nenhuma recompensa disponível</h3>
                  <p className="text-sm text-muted-foreground">Continue acumulando pontos! Novas recompensas em breve.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Recompensas Disponíveis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const canAfford = points >= item.points_cost;
                  const isRedeeming = redeeming === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
                    >
                      {item.image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden bg-muted/30 aspect-video">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground text-base leading-tight break-words">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed break-words">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-primary">
                            {item.points_cost} pts
                          </span>

                          <Button
                            onClick={() => redeem(item.id)}
                            disabled={!canAfford || isRedeeming}
                            variant={canAfford ? "default" : "outline"}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            {isRedeeming ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Resgatando...
                              </>
                            ) : !canAfford ? (
                              'Insuficiente'
                            ) : (
                              <>
                                <Gift className="w-4 h-4" />
                                Resgatar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          // Redeemed Rewards Tab
          redeemedRewards.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <History className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Nenhum resgate ainda</h3>
                  <p className="text-sm text-muted-foreground">Resgate prêmios e veja seu histórico aqui!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Histórico de Resgates</h3>
              <div className="space-y-3">
                {redeemedRewards.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      {redemption.reward?.image_url ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                          <img
                            src={redemption.reward.image_url}
                            alt={redemption.reward?.title || 'Recompensa'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {redemption.reward?.title || 'Recompensa'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDate(redemption.created_at)} • {redemption.points_spent} pts
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(redemption.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
};
