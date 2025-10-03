import { supabase } from '@/integrations/supabase/client';

export interface AuthActionData {
  type: string;
  token_hash?: string;
  email?: string;
  redirect_to?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}

export const parseAuthParams = (searchParams: URLSearchParams): AuthActionData => {
  // First try to get from search params (query)
  let authData: AuthActionData = {
    type: searchParams.get('type') || '',
    token_hash: searchParams.get('token_hash') || undefined,
    email: searchParams.get('email') || undefined,
    redirect_to: searchParams.get('redirect_to') || undefined,
    error: searchParams.get('error') || undefined,
    error_code: searchParams.get('error_code') || undefined,
    error_description: searchParams.get('error_description') || undefined,
  };

  // If no type found in search params, check URL fragment (hash)
  if (!authData.type && window.location.hash) {
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
    
    authData = {
      type: fragmentParams.get('type') || 'recovery', // Default to recovery for fragment tokens
      token_hash: fragmentParams.get('access_token') || fragmentParams.get('token_hash') || undefined,
      email: fragmentParams.get('email') || undefined,
      redirect_to: fragmentParams.get('redirect_to') || undefined,
      error: fragmentParams.get('error') || undefined,
      error_code: fragmentParams.get('error_code') || undefined,
      error_description: fragmentParams.get('error_description') || undefined,
    };
  }

  return authData;
};

export const getRedirectPath = async (userType?: 'student' | 'teacher'): Promise<string> => {
  if (!userType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 getRedirectPath: Buscando tipo de usuário para:', user?.id);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        userType = profile?.user_type as 'student' | 'teacher';
        console.log('👤 getRedirectPath: Tipo de usuário encontrado:', userType);
      }
    } catch (error) {
      console.error('❌ getRedirectPath: Erro ao buscar tipo de usuário:', error);
    }
  }

  const path = userType === 'teacher' ? '/dashboard-professor' : '/';
  console.log('🎯 getRedirectPath: Redirecionando para:', path);
  
  return path;
};

export const processAuthAction = async (actionData: AuthActionData) => {
  const { type, token_hash, error } = actionData;

  console.log('🔐 processAuthAction: Processando ação de autenticação:', type);

  if (error) {
    console.error('❌ processAuthAction: Erro na ação:', error);
    throw new Error(actionData.error_description || error);
  }

  if (!token_hash) {
    console.error('❌ processAuthAction: Token não encontrado');
    throw new Error('Token de autenticação não encontrado');
  }

  switch (type) {
    case 'signup':
    case 'email_confirmation':
      console.log('📧 processAuthAction: Verificando email de confirmação');
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });
      if (verifyError) {
        console.error('❌ processAuthAction: Erro ao verificar OTP:', verifyError);
        throw verifyError;
      }
      console.log('✅ processAuthAction: Email confirmado com sucesso');
      break;

    case 'recovery':
    case 'password_recovery':
      // For password recovery from fragment, the token is already an access_token
      // We don't need to exchange it, Supabase will handle it automatically
      console.log('Processing recovery token from URL fragment');
      break;

    case 'email_change':
      const { error: emailChangeError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email_change'
      });
      if (emailChangeError) throw emailChangeError;
      break;

    case 'invite':
    case 'magiclink':
      const { error: magicLinkError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'magiclink'
      });
      if (magicLinkError) throw magicLinkError;
      break;

    default:
      throw new Error(`Tipo de ação não reconhecido: ${type}`);
  }
};

export const getActionTitle = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Confirmação de Email';
    case 'recovery':
    case 'password_recovery':
      return 'Recuperação de Senha';
    case 'email_change':
      return 'Alteração de Email';
    case 'invite':
      return 'Convite Aceito';
    case 'magiclink':
      return 'Login por Link Mágico';
    default:
      return 'Autenticação';
  }
};

export const getActionDescription = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Sua conta foi confirmada com sucesso!';
    case 'recovery':
    case 'password_recovery':
      return 'Agora você pode definir uma nova senha.';
    case 'email_change':
      return 'Seu email foi alterado com sucesso!';
    case 'invite':
      return 'Convite aceito! Bem-vindo à Shape Pro!';
    case 'magiclink':
      return 'Login realizado com sucesso!';
    default:
      return 'Processando sua solicitação...';
  }
};