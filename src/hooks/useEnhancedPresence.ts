import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PresenceState {
  user_id: string;
  online_at: string;
  typing?: boolean;
  last_heartbeat?: string;
}

export const useEnhancedPresence = (channelName: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();

  const sendHeartbeat = useCallback(() => {
    if (!channelRef.current || !user) return;

    channelRef.current.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      typing: false
    });
  }, [user]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    if (isTyping) {
      channelRef.current.track({
        user_id: user.id,
        typing: true,
        online_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      });

      // Auto stop typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else {
      channelRef.current.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user || !channelName) return;

    // Criar canal de presença
    const channel = supabase
      .channel(`presence:${channelName}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allPresences = Object.values(state).flat() as PresenceState[];
        
        // Filtrar usuários online (heartbeat nos últimos 30 segundos)
        const now = new Date();
        const thirtySecondsAgo = new Date(now.getTime() - 30000);
        
        const online = allPresences
          .filter(p => {
            if (!p.last_heartbeat) return false;
            const lastSeen = new Date(p.last_heartbeat);
            return lastSeen > thirtySecondsAgo;
          })
          .map(p => p.user_id)
          .filter(id => id !== user.id);

        const typing = allPresences
          .filter(p => p.typing && p.user_id !== user.id)
          .map(p => p.user_id);

        setOnlineUsers(online);
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const users = (newPresences as PresenceState[])
          .filter(p => p.user_id !== user.id)
          .map(p => p.user_id);
        
        setOnlineUsers(prev => [...new Set([...prev, ...users])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const users = (leftPresences as PresenceState[])
          .map(p => p.user_id);
        
        setOnlineUsers(prev => prev.filter(id => !users.includes(id)));
        setTypingUsers(prev => prev.filter(id => !users.includes(id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Presença inicial
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            last_heartbeat: new Date().toISOString(),
            typing: false
          });

          // Iniciar heartbeat a cada 15 segundos
          heartbeatRef.current = setInterval(sendHeartbeat, 15000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, channelName, sendHeartbeat]);

  return {
    onlineUsers,
    typingUsers,
    sendTypingIndicator
  };
};