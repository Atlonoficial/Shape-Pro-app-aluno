import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="px-4 sm:px-6 py-6 pb-24 min-h-screen w-full max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Loja de Recompensas
          </h1>
          <p className="text-muted-foreground text-sm">Troque seus pontos por recompensas incríveis</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-warning/10 to-primary/10 px-4 py-3 rounded-xl border border-warning/30 shadow-sm">
          <Trophy className="w-5 h-5 text-warning" />
          <span className="font-bold text-lg text-warning">{points.toLocaleString("pt-BR")}</span>
          <span className="text-sm text-muted-foreground">pontos</span>
        </div>
      </div>

      {loading ? (
        <Card className="shape-card-modern">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-muted-foreground">Carregando recompensas...</p>
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="shape-card-modern">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Nenhuma recompensa disponível</h3>
                <p className="text-sm text-muted-foreground">Seu professor ainda não adicionou recompensas à loja. Continue acumulando pontos!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <Card key={item.id} className="shape-card-modern group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Header com título e preço */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-foreground text-base leading-tight flex-1 min-w-0 break-words">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-warning/20 to-primary/20 px-3 py-1.5 rounded-full border border-warning/30 shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-warning" />
                    <span className="text-sm font-bold text-warning whitespace-nowrap">
                      {item.points_cost.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Descrição */}
                {item.description && (
                  <div className="flex-1 mb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">
                      {item.description.length > 80 
                        ? `${item.description.substring(0, 80)}...` 
                        : item.description
                      }
                    </p>
                  </div>
                )}

                {/* Botão de ação */}
                <div className="mt-auto pt-2">
                  <Button
                    className="w-full text-sm font-medium min-h-[40px] transition-all duration-200"
                    variant={points < item.points_cost ? "outline" : "default"}
                    disabled={redeeming === item.id || points < item.points_cost}
                    onClick={() => redeem(item.id)}
                  >
                    {redeeming === item.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Resgatando...</span>
                      </div>
                    ) : points < item.points_cost ? (
                      <span>Pontos insuficientes</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        <span>Resgatar</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
