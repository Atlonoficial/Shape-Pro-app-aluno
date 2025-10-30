import { useState, useEffect } from "react";
import { ArrowLeft, User, Lock, Mail, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ContaSeguranca = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Carrega dados reais do usuário
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user?.email]);

  const handleEmailChange = async () => {
    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um email válido.",
        variant: "destructive"
      });
      return;
    }

    if (formData.email === user?.email) {
      toast({
        title: "Informação",
        description: "Este já é o seu email atual.",
      });
      return;
    }

    setLoadingEmail(true);
    
    try {
      // Atualizar email no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (authError) {
        throw authError;
      }

      // Atualizar também na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: formData.email })
        .eq('id', user?.id);

      if (profileError) {
        console.warn('Erro ao atualizar perfil:', profileError);
      }

      toast({
        title: "Email atualizado!",
        description: "Verifique sua caixa de entrada para confirmar o novo email.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o email.",
        variant: "destructive"
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoadingPassword(true);

    try {
      // Supabase não requer senha atual para alteração por design de segurança
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive"
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/configuracoes")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Conta e Segurança</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Informações da Conta */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Informações da Conta</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1"
                />
                <Button 
                  onClick={handleEmailChange} 
                  disabled={loadingEmail || !formData.email.trim() || formData.email === user?.email}
                >
                  {loadingEmail ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {loadingEmail ? "Alterando..." : "Alterar"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Segurança da Conta */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Digite sua nova senha"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePasswordChange}
              className="w-full"
              disabled={loadingPassword || !formData.newPassword || !formData.confirmPassword}
            >
              {loadingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              {loadingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </div>
        </Card>

        {/* Dicas de Segurança */}
        <Card className="p-4 bg-primary/10 border-primary/20">
          <h3 className="font-medium text-primary mb-2">Dicas de Segurança</h3>
          <ul className="text-sm text-primary/80 space-y-1">
            <li>• Use uma senha forte com pelo menos 8 caracteres</li>
            <li>• Inclua letras maiúsculas, minúsculas, números e símbolos</li>
            <li>• Não compartilhe sua senha com ninguém</li>
            <li>• Altere sua senha regularmente</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default ContaSeguranca;