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
  return {
    type: searchParams.get('type') || '',
    token_hash: searchParams.get('token_hash') || undefined,
    email: searchParams.get('email') || undefined,
    redirect_to: searchParams.get('redirect_to') || undefined,
    error: searchParams.get('error') || undefined,
    error_code: searchParams.get('error_code') || undefined,
    error_description: searchParams.get('error_description') || undefined,
  };
};

export const getRedirectPath = async (userType?: 'student' | 'teacher'): Promise<string> => {
  if (!userType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        userType = profile?.user_type as 'student' | 'teacher';
      }
    } catch (error) {
      console.error('Error getting user type:', error);
    }
  }

  switch (userType) {
    case 'teacher':
      return '/dashboard-professor';
    case 'student':
      return '/';
    default:
      return '/';
  }
};

export const processAuthAction = async (actionData: AuthActionData) => {
  const { type, token_hash, error } = actionData;

  if (error) {
    throw new Error(actionData.error_description || error);
  }

  if (!token_hash) {
    throw new Error('Token de autenticação não encontrado');
  }

  switch (type) {
    case 'signup':
    case 'email_confirmation':
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });
      if (verifyError) throw verifyError;
      break;

    case 'recovery':
    case 'password_recovery':
      // For password recovery, we need to exchange the token
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(token_hash);
      if (exchangeError) throw exchangeError;
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