
import { User, Trophy, Settings, FileText, Camera, Activity, Calendar, Shield, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const profileStats = [
  { label: "Treinos Concluídos", value: "47", icon: Activity },
  { label: "Pontos Totais", value: "2.340", icon: Trophy },
  { label: "Dias Ativos", value: "23", icon: Calendar },
];

const menuItems = [
  { icon: CreditCard, title: "Assinaturas & Planos", subtitle: "Gerencie sua assinatura", badge: "Premium", path: "/assinaturas-planos" },
  { icon: FileText, title: "Cadastro Completo", subtitle: "Informações pessoais", badge: "90%", path: "/cadastro-completo" },
  { icon: Activity, title: "Exames Médicos", subtitle: "Últimos resultados", badge: "2", path: "/exames-medicos" },
  { icon: Camera, title: "Fotos de Progresso", subtitle: "Evolução visual", badge: "8", path: "/fotos-progresso" },
  { icon: FileText, title: "Avaliações Físicas", subtitle: "Medidas e composição", badge: "3", path: "/avaliacoes-fisicas" },
  { icon: User, title: "Anamnese", subtitle: "Histórico de saúde", badge: null, path: "/anamnese" },
  { icon: Settings, title: "Configurações", subtitle: "Preferências do app", badge: null, path: "/configuracoes" },
];

export const Profile = () => {
  const navigate = useNavigate();
  
  const handleRewardsClick = () => {
    navigate('/?tab=rewards');
  };

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="relative inline-block mb-4">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
            alt="Perfil"
            className="w-24 h-24 rounded-full border-4 border-primary/20"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Camera className="w-4 h-4 text-background" />
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-foreground">Carlos Silva</h1>
        <p className="text-muted-foreground">Membro desde Janeiro 2024</p>
        
        <div className="flex items-center justify-center gap-2 mt-3">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold text-primary">2.340 pontos</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {profileStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-gradient">
              <CardContent className="p-3 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rewards Button */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground mb-1">Loja de Recompensas</h3>
          <p className="text-sm text-muted-foreground mb-3">Troque seus pontos por prêmios</p>
          <button 
            className="btn-primary"
            onClick={handleRewardsClick}
          >
            Acessar Loja
          </button>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground mb-4">Dados e Configurações</h3>
        
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className="card-gradient hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                
                {item.badge && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                    {item.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logout */}
      <Card className="mt-6 bg-destructive/10 border-destructive/20">
        <CardContent className="p-4 text-center">
          <button className="text-destructive font-medium">Sair da Conta</button>
        </CardContent>
      </Card>
    </div>
  );
};
