import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AppAuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando sua conta...');

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        console.log('[AppAuthConfirm] 🚀 Starting confirmation process');
        
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type') || 'signup';

        if (!token_hash) {
          throw new Error('Token não encontrado na URL');
        }

        console.log('[AppAuthConfirm] 🔑 Token hash:', token_hash.substring(0, 10) + '...');
        console.log('[AppAuthConfirm] 📋 Type:', type);

        // Verificar se já tem sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('[AppAuthConfirm] ✅ Session already active');
          setStatus('success');
          setMessage('Conta já confirmada!');
          toast.success('Bem-vindo ao ShapePro!');
          setTimeout(() => navigate('/', { replace: true }), 1500);
          return;
        }

        // Verificar OTP
        console.log('[AppAuthConfirm] 🔐 Verifying OTP...');
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error('[AppAuthConfirm] ❌ Verification error:', error);
          throw error;
        }

        console.log('[AppAuthConfirm] ✅ Verification successful');
        setStatus('success');
        setMessage('Conta confirmada com sucesso!');
        toast.success('Bem-vindo ao ShapePro!');
        setTimeout(() => navigate('/', { replace: true }), 1500);

      } catch (error: any) {
        console.error('[AppAuthConfirm] ❌ Error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao confirmar conta');
        toast.error('Erro ao confirmar conta');
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };

    processConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="text-center">
        {status === 'loading' && (
          <Loader2 className="h-16 w-16 text-white animate-spin mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-16 w-16 text-white mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="h-16 w-16 text-white mx-auto" />
        )}
        <p className="mt-6 text-white text-xl font-medium">{message}</p>
      </div>
    </div>
  );
}
