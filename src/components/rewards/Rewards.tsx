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
    <div className="px-3 sm:px-6 py-4 pb-24 min-h-screen w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Loja de Recompensas</h1>
        <div className="flex items-center gap-2 bg-warning/10 px-3 py-2 rounded-full border border-warning/20">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
          <span className="font-semibold text-sm sm:text-base text-warning">{points.toLocaleString("pt-BR")} pts</span>
        </div>
      </div>

      {loading ? (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/30 shadow-sm">
          <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
            <div className="animate-pulse">Carregando recompensas...</div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/30 shadow-sm">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nenhuma recompensa disponível</h3>
            <p className="text-sm text-muted-foreground">Seu professor ainda não adicionou recompensas à loja.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-card/50 backdrop-blur-sm border border-border/30 shadow-sm hover:shadow-md hover:bg-card/70 transition-all duration-200">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-full border border-warning/20 shrink-0">
                    <Trophy className="w-3 h-3 text-warning" />
                    <span className="text-xs font-medium text-warning">{item.points_cost}</span>
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">{item.description}</p>
                )}
                <Button
                  size="sm"
                  className="mt-auto w-full text-xs sm:text-sm"
                  disabled={redeeming === item.id || points < item.points_cost}
                  onClick={() => redeem(item.id)}
                >
                  {points < item.points_cost ? "Pontos insuficientes" : redeeming === item.id ? "Resgatando..." : "Resgatar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
