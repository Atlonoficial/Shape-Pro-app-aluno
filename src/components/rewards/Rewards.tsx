import { Trophy, Star, Gift, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Recompensas</h1>
        <p className="text-muted-foreground">Troque seus pontos por prêmios incríveis</p>
      </div>

      {/* Points Display */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="text-3xl font-bold text-primary">2.340</span>
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
        {rewards.map((reward) => (
          <Card 
            key={reward.id} 
            className={`overflow-hidden card-gradient transition-all duration-300 ${
              reward.unlocked 
                ? "hover:scale-105" 
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
                  {!reward.unlocked && (
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
                    
                    <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reward.unlocked 
                          ? "bg-primary/20 hover:bg-primary/30 text-primary" 
                          : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                      }`}
                      disabled={!reward.unlocked}
                    >
                      {reward.unlocked ? "Resgatar" : "Bloqueado"}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};