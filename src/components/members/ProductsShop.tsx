import { useState, useEffect } from "react";
import { Gift, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const ProductsShop = () => {
  const { user, userProfile } = useAuth();
  const { rewards, loading } = useRewards();
  const [points, setPoints] = useState<number>(0);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const navigate = useNavigate();

  const isTeacher = userProfile?.user_type === 'teacher';

  // Get user points
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();
        
      if (!error && data) {
        setPoints(data.total_points || 0);
      }
    };
    
    fetchPoints();
  }, [user?.id]);

  const redeem = async (id: string) => {
    if (!user?.id) return;
    setRedeeming(id);
    try {
      const { error } = await supabase.rpc("redeem_reward", { _reward_id: id });
      if (error) throw error;
      toast.success("Resgate solicitado com sucesso!");
      
      // Update points after redemption
      const { data } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setPoints(data.total_points || 0);
      }
    } catch (e: any) {
      const msg = e?.message || "Erro ao resgatar";
      toast.error(msg);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isTeacher ? 'Meus Produtos' : 'Loja de Recompensas'}
      </h3>

      {!isTeacher && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">Seus Pontos</h4>
              <p className="text-sm text-muted-foreground">Disponíveis para troca</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{points}</span>
            </div>
          </div>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isTeacher 
              ? 'Você ainda não criou nenhum produto. Acesse o Dashboard Professor para criar.' 
              : 'Nenhum produto disponível no momento'
            }
          </p>
          {isTeacher && (
            <Button 
              onClick={() => navigate('/dashboard-professor')} 
              className="mt-4"
              variant="outline"
            >
              Ir para Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((reward) => {
            const canAfford = !isTeacher && points >= reward.points_cost;
            const isRedeeming = redeeming === reward.id;
            
            return (
              <div
                key={reward.id}
                className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3 transition-all duration-300"
              >
                {/* Reward Image */}
                {reward.image_url && (
                  <div className="mb-3 rounded-xl overflow-hidden bg-muted/30 aspect-square">
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {/* Reward Content */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">
                    {reward.title}
                  </h4>
                  
                  {reward.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {reward.description}
                    </p>
                  )}
                  
                  {/* Price and Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-primary">
                      {reward.points_cost} pts
                    </span>
                    
                    {!isTeacher && (
                      <Button
                        onClick={() => redeem(reward.id)}
                        disabled={!canAfford || isRedeeming}
                        variant={canAfford ? "default" : "outline"}
                        size="sm"
                        className="text-xs px-2 py-1 h-auto"
                      >
                        {isRedeeming ? (
                          <>
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                            Resgatando...
                          </>
                        ) : !canAfford ? (
                          'Insuficiente'
                        ) : (
                          <>
                            <Gift className="w-3 h-3 mr-1" />
                            Resgatar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};