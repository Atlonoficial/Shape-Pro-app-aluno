import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useChatNotifications = () => {
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) return;

    console.log('Chat Notifications: Setting up real-time chat message listener');

    // Escutar novas mensagens de chat apenas para contar não lidas
    // As notificações push serão enviadas pelo professor via OneSignal
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
          
          // Não processar próprias mensagens
          if (newMessage.sender_id === user.id) return;

          console.log('Chat Notifications: New message received:', newMessage);
          
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

            // As notificações push do OneSignal vão cuidar das notificações visuais
            // Este hook serve apenas para sincronização em tempo real de dados
            console.log('Chat Notifications: Message processed for user participation');

          } catch (error) {
            console.error('Chat Notifications: Error processing message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Chat Notifications: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, userProfile]);

  // Este hook não retorna nada, apenas configura listeners
  return null;
};