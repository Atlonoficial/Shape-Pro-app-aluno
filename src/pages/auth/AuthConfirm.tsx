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
          console.log('🔄 AuthConfirm: Forçando refresh da sessão...');
          
          // ✅ BUILD 36: Tentar forçar refresh do token
          try {
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('❌ AuthConfirm: Erro ao refresh da sessão:', refreshError);
              throw new Error('Não foi possível estabelecer sessão automaticamente.');
            }
            
            if (session) {
              console.log('✅ AuthConfirm: Sessão estabelecida após refresh!', {
                userId: session.user.id,
                expiresAt: session.expires_at
              });
              currentSession = session;
              sessionEstablished = true;
            } else {
              throw new Error('Sessão não retornada após refresh.');
            }
          } catch (refreshErr: any) {
            console.error('❌ AuthConfirm: Falha no refresh, redirecionando para login manual', refreshErr);
            
            setErrorMessage('Email confirmado com sucesso! Faça login para acessar sua conta.');
            setStatus('error');
            
            // Redirecionar para login com flag autoLogin
            setTimeout(() => {
              window.location.href = '/?confirmed=true&autoLogin=true';
            }, 2000);
            
            return;
          }
        }
        
        // 🎯 FASE 2: ORDEM DE PRIORIDADE para determinar user_type
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fontes de informação (por ordem de confiabilidade)
        const userTypeFromMetadata = user?.user_metadata?.user_type;
        const srcFromMetadata = user?.user_metadata?.src;
        const srcFromUrl = srcParam;
        
        console.log('🔍 AuthConfirm: Fontes de user_type:', {
          userTypeFromMetadata,
          srcFromMetadata,
          srcFromUrl,
          userId: user?.id,
          email: user?.email
        });
        
        // Determinar finalUserType com lógica de prioridade
        let finalUserType: 'student' | 'teacher';
        
        if (userTypeFromMetadata) {
          finalUserType = userTypeFromMetadata;
          console.log('✅ AuthConfirm: Usando user_type dos metadados:', finalUserType);
        } else if (srcFromMetadata === 'dashboard' || srcFromUrl === 'dashboard') {
          finalUserType = 'teacher';
          console.log('⚠️ AuthConfirm: user_type vazio, detectado dashboard → teacher');
        } else if (srcFromMetadata === 'app' || srcFromUrl === 'app') {
          finalUserType = 'student';
          console.log('⚠️ AuthConfirm: user_type vazio, detectado app → student');
        } else {
          finalUserType = 'student';
          console.log('⚠️ AuthConfirm: Usando fallback padrão → student');
        }
        
        // Calcular path de redirecionamento
        const path = await getRedirectPath(finalUserType);
        
        console.log('🎯 AuthConfirm: Preparando redirecionamento:', {
          sessionEstablished,
          hasUser: !!user,
          finalUserType,
          redirectPath: path,
          timestamp: new Date().toISOString()
        });

        console.log('✅ AuthConfirm: Setando status success - AuthStatusHandler vai redirecionar em 3s');
        
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('❌ AuthConfirm: Erro crítico na confirmação:', {
          message: error.message,
          code: error.code,
          status: error.status,
          name: error.name,
          fullError: error
        });
        
        // ✅ BUILD 37: Mensagem de erro mais específica
        let userFriendlyMessage = 'Erro ao processar confirmação';
        
        if (error.message?.includes('Token') || error.message?.includes('token')) {
          userFriendlyMessage = 'Link de confirmação inválido ou expirado. Solicite um novo email.';
        } else if (error.message?.includes('expired') || error.message?.includes('expirado')) {
          userFriendlyMessage = 'Link expirado. Solicite um novo email de confirmação.';
        } else if (error.message?.includes('already') || error.message?.includes('já')) {
          userFriendlyMessage = 'Email já foi confirmado. Faça login normalmente.';
        } else if (error.status === 422) {
          userFriendlyMessage = 'Confirmação já processada anteriormente. Faça login.';
        } else if (error.status === 404) {
          userFriendlyMessage = 'Link de confirmação não encontrado. Solicite um novo email.';
        }
        
        setErrorMessage(userFriendlyMessage);
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