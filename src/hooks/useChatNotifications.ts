import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useChatNotifications = () => {
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Escutar novas mensagens de chat
    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Não mostrar notificação para próprias mensagens
          if (newMessage.sender_id === user.id) return;

          try {
            // Buscar dados da conversa para determinar se é para este usuário
            const { data: conversation } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', newMessage.conversation_id)
              .single();

            if (!conversation) return;

            // Verificar se o usuário participa da conversa
            const isParticipant = conversation.student_id === user.id || 
                                conversation.teacher_id === user.id;

            if (!isParticipant) return;

            // Buscar nome do remetente
            const { data: sender } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', newMessage.sender_id)
              .single();

            const senderName = sender?.name || sender?.email || 'Alguém';
            
            // Mostrar notificação
            toast(senderName, {
              description: newMessage.message.length > 100 
                ? newMessage.message.substring(0, 100) + '...'
                : newMessage.message,
              action: {
                label: "Ver",
                onClick: () => {
                  // Se estiver no app, navegar para o chat
                  if (window.location.pathname !== '/chat') {
                    window.location.href = '/chat';
                  }
                }
              }
            });

          } catch (error) {
            console.error('Erro ao processar notificação de chat:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userProfile]);

  return null;
};