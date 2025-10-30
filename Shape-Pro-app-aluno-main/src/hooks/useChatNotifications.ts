import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export const useChatNotifications = () => {
  const { user, userProfile } = useAuth();

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'chat_messages',
        event: 'INSERT',
        callback: async (payload) => {
          const newMessage = payload.new as any;
          
          if (newMessage.sender_id === user?.id) return;

          console.log('Chat Notifications: New message received:', newMessage);
          
          try {
            const { data: conversation } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', newMessage.conversation_id)
              .single();

            if (!conversation) return;

            const isParticipant = conversation.student_id === user?.id || 
                                conversation.teacher_id === user?.id;

            if (!isParticipant) return;

            console.log('Chat Notifications: Message processed for user participation');
          } catch (error) {
            console.error('Chat Notifications: Error processing message:', error);
          }
        }
      }
    ],
    enabled: !!(user && userProfile),
    channelName: `chat-notifications-${user?.id}`,
    debounceMs: 1500
  });

  return null;
};