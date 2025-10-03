import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function AppResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    console.log('[AppResetPassword] 🔑 Token hash:', token_hash ? 'presente' : 'ausente');
    
    if (token_hash) {
      setValidToken(true);
    } else {
      toast.error('Link de recuperação inválido');
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [searchParams, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não correspondem');
      return;
    }

    setLoading(true);
    
    try {
      console.log('[AppResetPassword] 🔐 Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      console.log('[AppResetPassword] ✅ Password updated successfully');
      toast.success('Senha atualizada com sucesso!');
      setTimeout(() => navigate('/auth'), 1500);
      
    } catch (error: any) {
      console.error('[AppResetPassword] ❌ Error:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Nova Senha</h1>
        <p className="text-muted-foreground mb-6">Digite sua nova senha abaixo</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              minLength={8}
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
