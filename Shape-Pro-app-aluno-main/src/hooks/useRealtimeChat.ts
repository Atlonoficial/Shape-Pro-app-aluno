import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PresenceState {
  user_id: string;
  online_at: string;
  typing?: boolean;
}

export const useRealtimeChat = (conversationId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    
    if (isTyping) {
      channel.track({
        user_id: user.id,
        typing: true,
        typing_at: new Date().toISOString()
      });
    } else {
      channel.untrack();
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Canal de presença para usuários online
    const presenceChannel = supabase
      .channel(`presence:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const allData = Object.values(state).flat();
        const users = allData.filter((u: any) => u && u.user_id).map((u: any) => u as PresenceState);
        setOnlineUsers(users.map(u => u.user_id));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const users = (newPresences as any[]).filter(u => u.user_id) as PresenceState[];
        setOnlineUsers(prev => [...prev, ...users.map(u => u.user_id)]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const users = (leftPresences as any[]).filter(u => u.user_id) as PresenceState[];
        setOnlineUsers(prev => prev.filter(id => !users.some(u => u.user_id === id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    // Canal de digitação
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const allData = Object.values(state).flat();
        const users = allData.filter((u: any) => u && u.user_id && u.typing && u.user_id !== user.id).map((u: any) => u as PresenceState);
        setTypingUsers(users.map(u => u.user_id));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const users = (newPresences as any[]).filter(u => u.user_id && u.typing && u.user_id !== user.id) as PresenceState[];
        setTypingUsers(prev => [...prev, ...users.map(u => u.user_id)]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const users = (leftPresences as any[]).filter(u => u.user_id) as PresenceState[];
        setTypingUsers(prev => prev.filter(id => !users.some(u => u.user_id === id)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, user]);

  return {
    onlineUsers,
    typingUsers,
    sendTypingIndicator
  };
};