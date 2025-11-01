import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Bell, User, Shield, LogOut, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { signOutUser } from "@/lib/supabase";
import { enablePush, disablePush, clearExternalUserId } from "@/lib/push";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";

const Configuracoes = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [notificacoes, setNotificacoes] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    // Load push notification preference from profile
    const loadNotificationPreference = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('push_enabled')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setNotificacoes(data.push_enabled ?? true);
      }
    };

    loadNotificationPreference();
  }, [user?.id]);

  const handleNotificationsToggle = async (checked: boolean) => {
    if (!user?.id || loadingNotifications) return;
    
    setLoadingNotifications(true);
    try {
      if (checked) {
        await enablePush();
      } else {
        await disablePush();
      }
      
      // Save preference to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ push_enabled: checked })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setNotificacoes(checked);
      toast({
        title: checked ? "🔥 Notificações ativadas!" : "Notificações desativadas",
        description: checked 
          ? "Você receberá lembretes de treinos e dicas personalizadas"
          : "Você não receberá mais notificações push",
      });
    } catch (error) {
      console.error("Erro ao alterar notificações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar as notificações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSair = async () => {
    try {
      // Clear OneSignal external user ID
      await clearExternalUserId();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Sign out from Supabase
      await signOutUser();
      
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso.",
      });
      // Navigation will be automatic via AuthProvider
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handlePlanosClick = () => {
    navigate("/assinaturas-planos");
  };

  const configItems = [
    {
      icon: Bell,
      title: "Notificações",
      description: "Receber alertas e lembretes",
      action: (
        <Switch 
          checked={notificacoes}
          onCheckedChange={handleNotificationsToggle}
          disabled={loadingNotifications}
        />
      )
    },
    {
      icon: Crown,
      title: "Planos e Assinaturas",
      description: "Gerencie seu plano atual",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: handlePlanosClick
    },
    {
      icon: Lock,
      title: "Conta e Segurança",
      description: "Email, senha e configurações de segurança",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => navigate("/conta-seguranca")
    },
    {
      icon: Shield,
      title: "Política de Privacidade",
      description: "Termos e condições de uso",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => navigate("/politica-privacidade")
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Configuration Items */}
        <div className="space-y-2">
          {configItems.map((item, index) => (
            <Card 
              key={index} 
              className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
              onClick={item.onClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {item.action}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="p-4 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer">
          <Button
            variant="ghost"
            onClick={handleSair}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-transparent p-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Sair</h3>
                <p className="text-sm text-destructive/70">Desconectar da conta</p>
              </div>
            </div>
          </Button>
        </Card>

        {/* Footer Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
          <p className="text-primary text-sm font-medium">
            Alterações serão aplicadas ao seu app e notificadas ao seu professor, quando relevante.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;