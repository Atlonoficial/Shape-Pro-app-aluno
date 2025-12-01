import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Crown, Check, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { getUserProfile } from "@/lib/supabase";

const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  const { student } = useStudentProfile();
  const { subscription } = useActiveSubscription();
  const [teacherPhone, setTeacherPhone] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (student?.teacher_id) {
        const profile = await getUserProfile(student.teacher_id);
        if (profile?.phone) {
          // Remove non-numeric characters for the link
          const cleanPhone = profile.phone.replace(/\D/g, '');
          setTeacherPhone(cleanPhone);
        }
      }
    };
    fetchTeacher();
  }, [student?.teacher_id]);

  const handleContactTeacher = () => {
    if (teacherPhone) {
      // Neutral message for support only
      const message = encodeURIComponent("Olá, preciso de suporte com minha conta no app.");
      window.open(`https://wa.me/${teacherPhone}?text=${message}`, '_blank');
    } else {
      // Fallback to internal chat if no phone available
      navigate('/chat');
    }
  };

  // Estrutura de benefícios para exibição neutra
  const recursosLiberados = useMemo(() => {
    // Se tiver assinatura ativa com features
    if (subscription?.plan_features && subscription.plan_features.length > 0) {
      return subscription.plan_features;
    }

    // Se for plano gratuito ou sem features definidas, mostrar recursos básicos
    return [
      "Acesso ao aplicativo",
      "Comunicação com o treinador",
      "Visualização de conteúdos liberados"
    ];
  }, [subscription]);

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Meu Acesso</h1>
          </div>
          <ConnectionStatus />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Card Informativo Neutro */}
        <Card className="p-6 bg-muted/30 border-border/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Acesso Atual</h2>
              <p className="text-sm text-muted-foreground">
                Configurado pelo seu treinador
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Recursos liberados nesta conta
              </h3>
              <div className="space-y-3">
                {recursosLiberados.map((recurso, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success/10 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      {recurso}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alguns recursos podem estar bloqueados dependendo da configuração feita pelo seu treinador.
              </p>
            </div>
          </div>
        </Card>

        {/* Card de Suporte Neutro */}
        <Card className="p-6 border-border/30">
          <h3 className="font-medium text-foreground mb-2">Precisa de ajuda?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para suporte técnico ou dúvidas sobre sua conta, fale com seu treinador.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleContactTeacher}
          >
            Suporte Técnico
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AssinaturasPlanos;