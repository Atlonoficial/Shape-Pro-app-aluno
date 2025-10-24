import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando conexão com Strava...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('[StravaCallback] 🔄 Processando callback...');
        console.log('[StravaCallback] 📱 Platform:', Capacitor.getPlatform());
        console.log('[StravaCallback] 🌐 URL:', window.location.href);
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        console.log('[StravaCallback] 📦 Params:', { code: code?.substring(0, 10) + '...', state, error });

        if (error) {
          console.error('[StravaCallback] ❌ Erro no callback:', error);
          // Close browser on mobile
          if (Capacitor.isNativePlatform()) {
            await Browser.close();
          }
          throw new Error(`Strava OAuth error: ${error}`);
        }

        if (!code) {
          console.error('[StravaCallback] ❌ Código não encontrado');
          // Close browser on mobile
          if (Capacitor.isNativePlatform()) {
            await Browser.close();
          }
          throw new Error('Código de autorização não encontrado');
        }

        if (!user || state !== user.id) {
          console.error('[StravaCallback] ❌ Estado inválido');
          // Close browser on mobile
          if (Capacitor.isNativePlatform()) {
            await Browser.close();
          }
          throw new Error('Estado inválido - usuário não autenticado');
        }

        console.log('[StravaCallback] ✅ Processando código com edge function...');

        const { data, error: functionError } = await supabase.functions.invoke('strava-auth', {
          body: {
            action: 'exchange_code',
            code: code,
            state: state
          }
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error(`Erro na função: ${functionError.message}`);
        }

        if (data?.error) {
          console.error('Strava auth error:', data.error);
          throw new Error(data.error);
        }

        if (data?.success) {
          console.log('[StravaCallback] ✅ Sucesso!');
          setStatus('success');
          setMessage('Conta Strava conectada com sucesso!');
          
          // Close browser on mobile
          if (Capacitor.isNativePlatform()) {
            console.log('[StravaCallback] 📱 Fechando Capacitor Browser...');
            await Browser.close();
          }
          
          // Redirecionar para configurações após 2 segundos
          setTimeout(() => {
            navigate('/configuracoes');
          }, 2000);
        } else {
          throw new Error('Resposta inesperada do servidor');
        }

      } catch (error) {
        console.error('[StravaCallback] ❌ Erro no processamento:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro desconhecido');
        
        // Close browser on mobile
        if (Capacitor.isNativePlatform()) {
          await Browser.close();
        }
        
        // Redirecionar para configurações após 3 segundos
        setTimeout(() => {
          navigate('/configuracoes');
        }, 3000);
      }
    };

    if (user) {
      processCallback();
    }
  }, [searchParams, navigate, user]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>
            {status === 'loading' && 'Conectando...'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Erro na Conexão'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
          {status === 'success' && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Redirecionando para configurações...
            </p>
          )}
          {status === 'error' && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Retornando para configurações...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}