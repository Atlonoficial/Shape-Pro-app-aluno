import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectPath } from "@/utils/authRedirectUtils";
import { CheckCircle, Mail, Clock, RefreshCw } from "lucide-react";

export const AuthVerify = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const email = useMemo(() => emailParam, [emailParam]);

  useEffect(() => {
    document.title = "Confirme seu email | Shape Pro";
  }, []);

  // Verificar status de confirmação do email
  const checkEmailVerification = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao verificar usuário:', error);
        return false;
      }

      if (user?.email_confirmed_at) {
        console.log('Email confirmado:', user.email_confirmed_at);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro na verificação:', error);
      return false;
    }
  }, []);

  // Polling automático para verificar confirmação
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (!isVerified) {
        const confirmed = await checkEmailVerification();
        if (confirmed) {
          setIsVerified(true);
          clearInterval(intervalId);
          
          toast({
            title: "Email confirmado!",
            description: "Redirecionando você para o aplicativo...",
          });

          // Redirecionar após pequeno delay
          setTimeout(async () => {
            const redirectPath = await getRedirectPath();
            navigate(redirectPath);
          }, 2000);
        }
      }
    }, 10000); // Verifica a cada 10 segundos

    return () => clearInterval(intervalId);
  }, [isVerified, checkEmailVerification, navigate, toast]);

  // Função para verificar manualmente quando o usuário clica no botão
  const handleCheckVerification = async () => {
    setChecking(true);
    
    try {
      const confirmed = await checkEmailVerification();
      
      if (confirmed) {
        setIsVerified(true);
        
        toast({
          title: "Email confirmado com sucesso!",
          description: "Redirecionando você para o aplicativo...",
        });

        setTimeout(async () => {
          const redirectPath = await getRedirectPath();
          navigate(redirectPath);
        }, 2000);
      } else {
        toast({
          title: "Email ainda não confirmado",
          description: "Verifique sua caixa de entrada e clique no link de confirmação. Pode levar alguns minutos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao verificar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Informe um email válido",
        description: "Volte e preencha o email para reenviar a confirmação.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);
    if (error) {
      toast({
        title: "Erro ao reenviar",
        description: error.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Email reenviado",
      description: "Verifique sua caixa de entrada e spam.",
    });
  };

  if (isVerified) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
            </div>
            <CardTitle className="text-green-600">Email Confirmado!</CardTitle>
            <CardDescription>
              Sua conta foi verificada com sucesso. Redirecionando você...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <CardTitle>Confirme seu email</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para <strong>{email || "seu email"}</strong>. 
            Clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Verificando automaticamente a cada 10 segundos...
            </span>
          </div>

          <Button 
            className="w-full" 
            onClick={handleCheckVerification} 
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Já confirmei meu email
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResend} 
            disabled={sending}
          >
            {sending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Reenviar email de confirmação
              </>
            )}
          </Button>
          
          <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>
            Voltar para a Home
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerify;
