import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RewardItem {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  image_url?: string;
}

export const Rewards = () => {
  const { user } = useAuthContext();
  const [items, setItems] = useState<RewardItem[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // RLS policy now automatically filters rewards by teacher
        const [{ data: itemsData, error: itemsErr }, { data: pointsData, error: pointsErr }] = await Promise.all([
          supabase.from("rewards_items").select("id,title,description,points_cost,image_url").eq("is_active", true).order("created_at", { ascending: false }),
          supabase.from("user_points").select("total_points").eq("user_id", user?.id ?? "").maybeSingle()
        ]);
        if (itemsErr) throw itemsErr;
        if (pointsErr) throw pointsErr;
        setItems(itemsData || []);
        setPoints(pointsData?.total_points ?? 0);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar loja de recompensas");
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscriptions = () => {
      if (!user?.id) return;

      // Subscribe to real-time updates for user points
      const pointsChannel = supabase
        .channel('user_points_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'user_points', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.new && typeof payload.new === 'object' && 'total_points' in payload.new) {
              setPoints(payload.new.total_points);
            }
          }
        )
        .subscribe();

      // Subscribe to real-time updates for rewards items
      const rewardsChannel = supabase
        .channel('rewards_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'rewards_items' },
          () => {
            // Refetch rewards when they change
            fetchAll();
          }
        )
        .subscribe();

      return () => {
        pointsChannel.unsubscribe();
        rewardsChannel.unsubscribe();
      };
    };

    if (user?.id) {
      fetchAll();
      const unsubscribe = setupRealtimeSubscriptions();
      return unsubscribe;
    }
  }, [user?.id]);

  const redeem = async (id: string) => {
    if (!user?.id) return;
    setRedeeming(id);
    try {
      const { error } = await supabase.rpc("redeem_reward", { _reward_id: id });
      if (error) throw error;
      toast.success("Resgate solicitado com sucesso!");
      // Points and items will be updated automatically via real-time subscriptions
      // No need to manually refresh here
    } catch (e: any) {
      const msg = e?.message || "Erro ao resgatar";
      toast.error(msg);
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="p-4 pt-8 pb-24">
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

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Carregando recompensas...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
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
                  {/* Reward Image */}
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
                  
                  {/* Reward Content */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground text-base leading-tight break-words">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed break-words">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Price and Button */}
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
      )}
    </div>
  );
};
