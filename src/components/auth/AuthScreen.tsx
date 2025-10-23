import { useState, useEffect } from 'react';
import { signInUser, signUpUser, resetPasswordForEmail } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceContext } from '@/hooks/useDeviceContext';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [emailExistsStatus, setEmailExistsStatus] = useState<'checking' | 'exists' | 'available' | null>(null);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isNative } = useDeviceContext();

  // Gerenciar cooldown
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ BUILD 25: Verificar boot completo antes de tentar login
    if (isNative) {
      const { bootManager } = await import('@/lib/bootManager');
      
      if (!bootManager.isBootComplete()) {
        console.warn('[AuthScreen] ⏳ Boot not complete yet!');
        toast({
          title: "⏳ Aguarde...",
          description: "Inicializando aplicativo...",
        });
        
        // Aguardar até 3 segundos pelo boot
        try {
          await bootManager.waitForBoot(3000);
        } catch (error) {
          toast({
            title: "❌ Erro de inicialização",
            description: "Recarregue o app e tente novamente.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    setLoading(true);

    try {
      await signInUser(email, password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Shape Pro.",
      });
    } catch (error: any) {
      // 🎯 FASE 4: Detectar erro de email não confirmado
      if (error.message.includes('não confirmado')) {
        toast({
          title: "⚠️ Email não confirmado",
          description: "Verifique sua caixa de entrada antes de fazer login.",
          variant: "destructive",
        });
        
        // ✅ Oferecer dica para reenviar email de confirmação
        setTimeout(() => {
          toast({
            title: "💡 Dica",
            description: "Não recebeu o email? Clique em 'Criar Conta' novamente para reenviar.",
          });
        }, 2000);
        
        return;
      }
      
      // Erro genérico
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar aceitação dos termos
    if (!termsAccepted) {
      toast({
        title: "⚠️ Termos não aceitos",
        description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // FASE 1: Validação proativa - verificar se email já existe
      console.log('[AuthScreen] 🔍 Verificando email antes do signup...');
      const { exists, confirmed } = await checkEmailExistsFull(email);

      if (exists) {
        if (confirmed) {
          // Email existe e está confirmado → redirecionar para login
          console.log('[AuthScreen] ⚠️ Email já cadastrado e confirmado');
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Faça login.",
            variant: "destructive",
          });
          setActiveTab('signin');
          setLoading(false);
          return;
        } else {
          // Email existe mas não está confirmado → reenviar email
          console.log('[AuthScreen] 📧 Email já cadastrado mas não confirmado, reenviando...');
          
          const { detectOrigin, calculateRedirectUrl } = await import('@/utils/domainDetector');
          const meta = detectOrigin('student');
          const redirectUrl = calculateRedirectUrl(meta);
          
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: redirectUrl
            }
          });

          if (error) {
            console.error('[AuthScreen] Erro ao reenviar email:', error);
            toast({
              title: "Email já cadastrado",
              description: "Complete a confirmação do email. Verifique sua caixa de entrada.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Email de confirmação reenviado",
              description: "Verifique sua caixa de entrada e spam.",
            });
          }

          navigate(`/auth/verify?email=${encodeURIComponent(email)}`);
          setLoading(false);
          return;
        }
      }

      // Email não existe → continuar com signup normal
      const result = await signUpUser(email, password, name, 'student', isNative);

      if (result?.session) {
        console.log('✅ Cadastro: Sessão criada imediatamente (email confirmation disabled)');
        toast({
          title: "✅ Conta criada!",
          description: "Bem-vindo ao Shape Pro!",
        });
        navigate('/', { replace: true });
      } else {
        console.log('📧 Cadastro: Sessão não criada, email confirmation necessária');
        toast({
          title: "📧 Email de confirmação enviado!",
          description: `Verifique sua caixa de entrada em ${email}`,
        });
        navigate(`/auth/verify?email=${encodeURIComponent(email)}`, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailExists(null);
      return;
    }

    try {
      const { getSupabase } = await import('@/integrations/supabase/client');
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', emailToCheck.toLowerCase().trim())
        .single();

      setEmailExists(!!data && !error);
    } catch (error) {
      setEmailExists(false);
    }
  };

  // Verificar se email existe e se está confirmado (para Fase 1)
  const checkEmailExistsFull = async (email: string): Promise<{ exists: boolean; confirmed: boolean }> => {
    try {
      const { getSupabase } = await import('@/integrations/supabase/client');
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error || !data) {
        return { exists: false, confirmed: false };
      }

      // Tentar verificar se o usuário está confirmado
      // Como não temos acesso direto ao auth.users, vamos tentar fazer login sem senha
      // para verificar se o email está confirmado
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      // Se não houver usuário logado, assumimos que existe mas não está confirmado
      // (método alternativo já que não temos acesso direto ao auth.users)
      return { exists: true, confirmed: false };
    } catch (error) {
      console.error('Error in checkEmailExistsFull:', error);
      return { exists: false, confirmed: false };
    }
  };

  // Verificar email em tempo real (debounced) - Fase 3
  useEffect(() => {
    if (activeTab === 'signup' && email && email.includes('@')) {
      const timeoutId = setTimeout(async () => {
        setEmailExistsStatus('checking');
        const { getSupabase } = await import('@/integrations/supabase/client');
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();
        
        if (data && !error) {
          setEmailExistsStatus('exists');
          setIsEmailConfirmed(true); // Assumir que está confirmado se existe no profiles
        } else {
          setEmailExistsStatus('available');
          setIsEmailConfirmed(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailExistsStatus(null);
      setIsEmailConfirmed(false);
    }
  }, [email, activeTab]);

  const handleResetPassword = async () => {
    // Verificar cooldown
    if (resetCooldown > 0) {
      toast({
        title: "⏱️ Aguarde",
        description: `Você poderá solicitar novamente em ${resetCooldown}s`,
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Informe seu email",
        description: "Digite seu email para receber o link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || email.length < 5) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      // Verificar se o email existe no sistema
      await checkEmailExists(email);
      
      if (emailExists === false) {
        toast({
          title: "Email não encontrado",
          description: "Este email não está cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Tentar enviar o email de reset
      await resetPasswordForEmail(email, isNative);
      
      toast({
        title: "Email enviado com sucesso!",
        description: "Verifique sua caixa de entrada e spam. O link é válido por 1 hora.",
      });

      // Opcional: Mostrar informações adicionais sobre onde verificar
      setTimeout(() => {
        toast({
          title: "💡 Dica importante",
          description: "Se não receber o email, verifique a pasta de spam ou lixo eletrônico.",
        });
      }, 3000);

    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = "Tente novamente mais tarde.";
      
      if (error.message?.includes('network')) {
        errorMessage = "Verifique sua conexão com a internet.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Email inválido ou não encontrado.";
      }

      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/bispo-shape-pro.png" 
            alt="Bispo - Shape Pro Consultoria Online" 
            className="h-32 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground">Sua jornada fitness começa aqui</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Fazer Login</CardTitle>
                <CardDescription>
                  Entre com sua conta para acessar seus treinos e dietas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          // Verificar email com debounce simples
                          setTimeout(() => checkEmailExists(e.target.value), 1000);
                        }}
                        required
                      />
                      {emailExists !== null && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailExists ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    onClick={handleResetPassword}
                    disabled={resetLoading || resetCooldown > 0}
                    className="flex items-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Enviando...
                      </>
                    ) : resetCooldown > 0 ? (
                      <>
                        <Mail className="h-3 w-3" />
                        Aguarde {resetCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="h-3 w-3" />
                        Esqueceu a senha?
                      </>
                    )}
                  </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>
                  Crie sua conta gratuita e comece sua transformação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pr-10"
                      />
                      {/* FASE 3: Indicador visual de email */}
                      {emailExistsStatus && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailExistsStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {emailExistsStatus === 'exists' && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          {emailExistsStatus === 'available' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Mensagem de feedback */}
                    {emailExistsStatus === 'exists' && (
                      <p className="text-xs text-destructive mt-1">
                        ⚠️ Email já cadastrado. Faça login ou use outro email.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Checkbox de Termos de Uso */}
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Li e concordo com os{' '}
                      <a 
                        href="https://shapepro.site/app/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 font-medium"
                      >
                        Termos de Uso
                      </a>
                      {' '}e a{' '}
                      <a 
                        href="https://shapepro.site/app/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 font-medium"
                      >
                        Política de Privacidade
                      </a>
                    </Label>
                  </div>

                  {/* FASE 4: Feedback no botão */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !termsAccepted || (emailExistsStatus === 'exists' && isEmailConfirmed)}
                  >
                    {loading 
                      ? "Criando conta..." 
                      : (emailExistsStatus === 'exists' && isEmailConfirmed)
                      ? "Email já cadastrado"
                      : "Criar Conta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};