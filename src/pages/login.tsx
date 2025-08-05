import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInUser } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';

/**
 * Página de Login do App do Aluno
 * 
 * FUNCIONALIDADES:
 * - Autenticação com Firebase Auth (email/senha)
 * - Redirecionamento automático para /aluno/dashboard após login
 * - Validação de formulário e tratamento de erros
 * - Interface responsiva e acessível
 * 
 * ROTEAMENTO:
 * - Adicionar em App.tsx: <Route path="/login" element={<Login />} />
 * - Proteger rotas do aluno redirecionando para /login se não autenticado
 */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirecionar se já estiver logado
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/aluno/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      await signInUser(email, password);
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Shape Pro.",
      });

      // Redirecionamento será automático devido ao useAuth
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <ShapeProLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Entrar no Shape Pro
          </CardTitle>
          <CardDescription>
            Acesse sua conta de aluno para continuar seus treinos
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => {
                  toast({
                    title: "Contate seu professor",
                    description: "Para criar uma conta, entre em contato com seu professor ou academia.",
                  });
                }}
              >
                Fale com seu professor
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}