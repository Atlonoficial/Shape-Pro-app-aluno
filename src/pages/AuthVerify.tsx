import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectPath } from "@/utils/authRedirectUtils";
import { CheckCircle, Mail, RefreshCw, Loader2 } from "lucide-react";

export const AuthVerify = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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


  // Função para verificar manualmente quando o usuário clica no botão
  const handleCheckVerification = async () => {
    setChecking(true);
    setErrorMessage(""); // Limpar erro anterior
    
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
        setErrorMessage("⚠️ Confirme seu email antes de continuar");
      }
    } catch (error) {
      setErrorMessage("Erro ao verificar. Tente novamente.");
    } finally {
      setChecking(false);
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
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
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
                  <CheckCircle className="mr-2 h-4 w-4" />
                  ✅ Já confirmei meu email
                </>
              )}
            </Button>
            
            {errorMessage && (
              <p className="text-sm text-destructive text-center -mt-1">
                {errorMessage}
              </p>
            )}
            
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
                  <RefreshCw className="mr-2 h-4 w-4" />
                  🔄 Reenviar email de confirmação
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerify;
