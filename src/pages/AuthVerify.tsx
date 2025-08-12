import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AuthVerify = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const email = useMemo(() => emailParam, [emailParam]);

  useEffect(() => {
    document.title = "Confirme seu email | Shape Pro";
  }, []);

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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirme seu email</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para {email || "seu email"}. Após confirmar, volte e continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleResend} disabled={sending}>
            {sending ? "Reenviando..." : "Reenviar email de confirmação"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>Voltar para a Home</Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerify;
