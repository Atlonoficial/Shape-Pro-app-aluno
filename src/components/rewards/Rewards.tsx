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
    if (user?.id) fetchAll();
  }, [user?.id]);

  const redeem = async (id: string) => {
    if (!user?.id) return;
    setRedeeming(id);
    try {
      const { error } = await supabase.rpc("redeem_reward", { _reward_id: id });
      if (error) throw error;
      toast.success("Resgate solicitado com sucesso!");
      // Refresh points and items
      const [{ data: pointsData }, { data: itemsData }] = await Promise.all([
        supabase.from("user_points").select("total_points").eq("user_id", user.id).maybeSingle(),
        supabase.from("rewards_items").select("id,title,description,points_cost,image_url").eq("is_active", true)
      ]);
      setPoints(pointsData?.total_points ?? 0);
      setItems(itemsData || []);
    } catch (e: any) {
      const msg = e?.message || "Erro ao resgatar";
      toast.error(msg);
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="p-4 pt-8 pb-24 min-h-[60vh] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Loja de Recompensas</h1>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          <span className="font-semibold">{points.toLocaleString("pt-BR")} pts</span>
        </div>
      </div>

      {loading ? (
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Nenhum item disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-card/60 border-border/50">
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <span className="text-sm text-warning font-medium">{item.points_cost} pts</span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <Button
                  className="mt-2"
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
