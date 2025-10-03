import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectPath } from "@/utils/authRedirectUtils";
import { CheckCircle, Mail, Clock, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

export const AuthVerify = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const email = useMemo(() => emailParam, [emailParam]);

  useEffect(() => {
    document.title = "Verificar Email | Shape Pro";
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

  // Polling automático inteligente para verificar confirmação
  useEffect(() => {
    const checkVerification = async () => {
      if (!isVerified) {
        setChecking(true);
        const confirmed = await checkEmailVerification();
        setChecking(false);
        setPollCount(prev => prev + 1);
        
        if (confirmed) {
          console.log('✅ Email confirmado com sucesso, iniciando redirecionamento');
          setIsVerified(true);
          
          toast({
            title: "✅ Email confirmado!",
            description: "Redirecionando para o app...",
          });

          setTimeout(async () => {
            const redirectPath = await getRedirectPath();
            console.log('🔄 Redirecionando para:', redirectPath);
            navigate(redirectPath, { replace: true });
          }, 1500);
        }
      }
    };

    // Verificar imediatamente
    checkVerification();

    // Polling inteligente: mais frequente nos primeiros 30s (15 verificações)
    const interval = pollCount < 15 ? 2000 : 5000;
    const intervalId = setInterval(checkVerification, interval);

    return () => clearInterval(intervalId);
  }, [isVerified, checkEmailVerification, navigate, toast, pollCount]);

  // Função para verificar manualmente quando o usuário clica no botão
  const handleCheckVerification = async () => {
    setChecking(true);
    
    try {
      const confirmed = await checkEmailVerification();
      
      if (confirmed) {
        console.log('✅ Verificação manual: Email confirmado');
        setIsVerified(true);
        
        toast({
          title: "✅ Email verificado!",
          description: "Bem-vindo ao Shape Pro!",
        });

        setTimeout(async () => {
          const redirectPath = await getRedirectPath();
          console.log('🔄 Redirecionando para:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 1500);
      } else {
        console.log('⏳ Verificação manual: Ainda não confirmado');
        toast({
          title: "⏳ Aguarde...",
          description: "Ainda não detectamos a confirmação. Clique no link do email.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao verificar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setChecking(false), 1000);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Email não informado",
        description: "Não foi possível reenviar o email de confirmação.",
        variant: "destructive",
      });
      return;
    }
    
    setSending(true);
    
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      
      if (error) throw error;

      toast({
        title: "📧 Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: "Erro ao reenviar",
        description: error.message || "Aguarde alguns minutos antes de tentar novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (isVerified) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in-50" />
            </div>
            <CardTitle>✅ Email Verificado!</CardTitle>
            <CardDescription>
              Sua conta foi confirmada com sucesso. Redirecionando...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Carregando app...</span>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {email && (
          <Alert className="m-6 mb-0 bg-primary/10 border-primary/20">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <span className="font-semibold">✉️ Email enviado para:</span>
              <br />
              <span className="text-primary font-mono">{email}</span>
            </AlertDescription>
          </Alert>
        )}
        
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {checking ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <Mail className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">📧 Confirme seu Email</CardTitle>
          <CardDescription className="text-base">
            Enviamos um link de confirmação. Clique nele para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-2">
              <p className="font-medium">Como confirmar seu email:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Abra seu aplicativo de email</li>
                <li>Procure um email do <strong>Shape Pro</strong></li>
                <li>Clique no botão <strong>"Confirmar Email"</strong></li>
                <li>Aguarde o redirecionamento automático</li>
              </ol>
              <p className="text-xs pt-2 text-amber-600 dark:text-amber-500">
                💡 Não encontrou? Verifique a pasta de spam
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-xs text-muted-foreground">
              {checking ? "Verificando..." : "Verificação automática ativa"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              className="w-full" 
              onClick={handleCheckVerification} 
              disabled={checking}
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Já confirmei meu email
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleResend} 
              disabled={sending || !email}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar email de confirmação
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full mt-2" 
              onClick={() => navigate("/", { replace: true })}
            >
              Voltar para o início
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerify;
