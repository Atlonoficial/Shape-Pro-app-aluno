import { useState } from 'react';
import { signInUser, signUpUser, resetPasswordForEmail } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInUser(email, password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Shape Pro.",
      });
    } catch (error: any) {
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
    setLoading(true);

    try {
      const result = await signUpUser(email, password, name, 'student');

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailToCheck.toLowerCase().trim())
        .single();

      setEmailExists(!!data && !error);
    } catch (error) {
      setEmailExists(false);
    }
  };

  const handleResetPassword = async () => {
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
      await resetPasswordForEmail(email);
      
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

        <Tabs defaultValue="signin" className="w-full">
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
                      disabled={resetLoading}
                      className="flex items-center gap-2"
                    >
                      {resetLoading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Enviando...
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
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando conta..." : "Criar Conta"}
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