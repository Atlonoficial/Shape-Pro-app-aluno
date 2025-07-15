import { useState } from "react";
import { Trophy, Star, Gift, Lock, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const rewards = [
  {
    id: 1,
    title: "Garrafa Shape Pro",
    description: "Garrafa térmica exclusiva com logo",
    points: 500,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=300",
    unlocked: true,
    category: "Acessórios"
  },
  {
    id: 2,
    title: "Camiseta Premium",
    description: "Camiseta dri-fit com tecnologia",
    points: 800,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=300",
    unlocked: true,
    category: "Roupas"
  },
  {
    id: 3,
    title: "Consultoria Nutricional",
    description: "1 sessão com nutricionista",
    points: 1200,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=300",
    unlocked: true,
    category: "Serviços"
  },
  {
    id: 4,
    title: "Kit Suplementos",
    description: "Whey + Creatina + BCAA",
    points: 2000,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=300",
    unlocked: true,
    category: "Suplementos"
  },
  {
    id: 5,
    title: "Personal Trainer VIP",
    description: "3 sessões particulares",
    points: 3000,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=300",
    unlocked: false,
    category: "Serviços"
  },
  {
    id: 6,
    title: "Smartwatch Fitness",
    description: "Monitor cardíaco avançado",
    points: 4500,
    currentPoints: 2340,
    image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&q=80&w=300",
    unlocked: false,
    category: "Eletrônicos"
  }
];

const categories = ["Todos", "Acessórios", "Roupas", "Serviços", "Suplementos", "Eletrônicos"];

export const Rewards = () => {
  const [userPoints, setUserPoints] = useState(2340);
  const [showStore, setShowStore] = useState(false);

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (userPoints >= reward.points) {
      setUserPoints(prev => prev - reward.points);
      toast({
        title: "🎉 Resgate realizado!",
        description: `Você resgatou: ${reward.title}. Pontos restantes: ${userPoints - reward.points}`,
      });
    } else {
      toast({
        title: "❌ Pontos insuficientes",
        description: `Você precisa de ${reward.points - userPoints} pontos a mais.`,
        variant: "destructive"
      });
    }
  };

  if (!showStore) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-[60vh]">
        {/* Store Access Card */}
        <Card className="w-full max-w-md bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 border-primary/30 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Loja de Recompensas</h1>
              <p className="text-muted-foreground">Troque seus pontos por prêmios</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{userPoints}</span>
                <span className="text-muted-foreground">pontos</span>
              </div>
            </div>

            <Button 
              onClick={() => setShowStore(true)}
              className="w-full bg-primary hover:bg-primary/90 text-background font-medium py-3 text-lg"
            >
              Acessar Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowStore(false)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Loja de Recompensas</h1>
        </div>
        <p className="text-muted-foreground">Troque seus pontos por prêmios incríveis</p>
      </div>

      {/* Points Display */}
      <Card className="mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="text-3xl font-bold text-primary">{userPoints}</span>
          </div>
          <p className="text-muted-foreground">pontos disponíveis</p>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === "Todos" 
                  ? "btn-primary" 
                  : "btn-secondary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {rewards.map((reward) => {
          const canAfford = userPoints >= reward.points;
          return (
            <Card 
              key={reward.id} 
              className={`overflow-hidden bg-card/50 border-border/50 transition-all duration-300 ${
                canAfford 
                  ? "hover:bg-card/70 hover:border-primary/50" 
                  : "opacity-60"
              }`}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img 
                      src={reward.image} 
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                    {!canAfford && (
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{reward.title}</h3>
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                        {reward.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{reward.points} pontos</span>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford}
                        className={`${
                          canAfford 
                            ? "bg-primary/20 hover:bg-primary/30 text-primary" 
                            : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                        }`}
                        variant="ghost"
                      >
                        {canAfford ? "Resgatar" : "Pontos insuficientes"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};