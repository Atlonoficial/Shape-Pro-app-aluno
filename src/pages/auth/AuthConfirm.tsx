import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath, getActionTitle, getActionDescription } from '@/utils/authRedirectUtils';
import { supabase } from '@/integrations/supabase/client';

export const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [actionType, setActionType] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        console.log('🔐 AuthConfirm: Iniciando processamento de confirmação');
        
        // Parse URL params
        const actionData = parseAuthParams(searchParams);
        console.log('📋 AuthConfirm: Dados da ação:', actionData);
        
        // ✅ NOVO: Ler parâmetro src como fallback
        const srcParam = searchParams.get('src'); // 'app' | 'dashboard'
        console.log('🔍 AuthConfirm: Parâmetro src detectado:', srcParam);
        
        setActionType(actionData.type);

        // Processar autenticação
        await processAuthAction(actionData);
        console.log('✅ AuthConfirm: Ação processada com sucesso');
        
        // 🔄 FASE 2: Esperar sessão ser estabelecida (até 10 segundos)
        console.log('⏳ AuthConfirm: Aguardando sessão ser estabelecida...');
        let sessionEstablished = false;
        let currentSession = null;
        
        for (let i = 0; i < 20; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            sessionEstablished = true;
            currentSession = session;
            console.log('✅ AuthConfirm: Sessão confirmada, usuário autenticado', {
              attempt: i + 1,
              userId: session.user.id,
              userType: session.user.user_metadata?.user_type
            });
            break;
          }
          console.log(`⏳ AuthConfirm: Tentativa ${i + 1}/20 - aguardando sessão...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Fallback se sessão não for estabelecida
        if (!sessionEstablished) {
          console.error('❌ AuthConfirm: Sessão não estabelecida após timeout');
          throw new Error('Email confirmado, mas falha ao estabelecer sessão. Por favor, faça login manualmente.');
        }
        
        // Buscar dados do usuário para determinar redirecionamento
        const { data: { user } } = await supabase.auth.getUser();
        const userType = user?.user_metadata?.user_type;
        
        console.log('📊 AuthConfirm: Dados completos da sessão:', {
          userId: user?.id,
          email: user?.email,
          userType,
          sessionActive: !!currentSession
        });
        
        console.log('👤 AuthConfirm: user_type dos metadados:', userType);
        console.log('🎯 AuthConfirm: src da URL:', srcParam);
        
        // ✅ NOVO: Usar src como fallback se user_type não existir
        let finalUserType = userType;
        if (!finalUserType && srcParam === 'dashboard') {
          finalUserType = 'teacher';
          console.log('⚠️ AuthConfirm: user_type vazio, usando fallback src=dashboard → teacher');
        } else if (!finalUserType) {
          finalUserType = 'student';
          console.log('⚠️ AuthConfirm: user_type vazio, usando fallback padrão → student');
        }
        
        // Calcular path de redirecionamento
        const path = await getRedirectPath(finalUserType as 'student' | 'teacher');
        
        console.log('🎯 AuthConfirm: Redirecionamento final:', {
          userType: finalUserType,
          srcParam,
          redirectPath: path
        });
        
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('❌ AuthConfirm: Erro na confirmação:', error);
        setErrorMessage(error.message || 'Erro ao processar confirmação');
        setStatus('error');
      }
    };

    processConfirmation();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout 
      title={getActionTitle(actionType)}
      description={status === 'loading' ? 'Processando sua solicitação...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage={getActionDescription(actionType)}
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};