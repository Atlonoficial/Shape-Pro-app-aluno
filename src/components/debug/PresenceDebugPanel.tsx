import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

interface PresenceDebugPanelProps {
  conversationId?: string;
  onlineUsers: string[];
  typingUsers: string[];
}

export const PresenceDebugPanel = ({ 
  conversationId, 
  onlineUsers, 
  typingUsers 
}: PresenceDebugPanelProps) => {
  const [presenceState, setPresenceState] = useState<any>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (!conversationId) return;

    const channelName = `presence:${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);
        setLastUpdate(new Date().toISOString());
        console.log('🔍 [DEBUG] Presence Sync:', {
          channelName,
          state,
          onlineUsers,
          typingUsers
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onlineUsers, typingUsers]);

  if (!conversationId) return null;

  const allPresences = Object.values(presenceState).flat() as any[];

  return (
    <Card className="fixed bottom-[240px] right-4 p-4 z-50 max-w-md bg-background/95 backdrop-blur border-2 border-primary">
      <div className="space-y-3 text-xs">
        <div className="font-bold text-primary border-b pb-2">
          🔍 PRESENCE DEBUG PANEL
        </div>

        <div>
          <div className="font-semibold text-foreground">Conversation ID:</div>
          <div className="text-muted-foreground font-mono break-all">
            {conversationId}
          </div>
        </div>

        <div>
          <div className="font-semibold text-foreground">Channel:</div>
          <div className="text-muted-foreground font-mono">
            presence:{conversationId}
          </div>
        </div>

        <div>
          <div className="font-semibold text-foreground">Online Users ({onlineUsers.length}):</div>
          <div className="text-muted-foreground">
            {onlineUsers.length > 0 ? (
              <ul className="list-disc list-inside">
                {onlineUsers.map(userId => (
                  <li key={userId} className="font-mono break-all">{userId}</li>
                ))}
              </ul>
            ) : (
              <div className="text-destructive">Nenhum usuário online detectado</div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-foreground">Typing Users ({typingUsers.length}):</div>
          <div className="text-muted-foreground">
            {typingUsers.length > 0 ? (
              <ul className="list-disc list-inside">
                {typingUsers.map(userId => (
                  <li key={userId} className="font-mono break-all">{userId}</li>
                ))}
              </ul>
            ) : (
              <div>Nenhum usuário digitando</div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-foreground">
            All Presences ({allPresences.length}):
          </div>
          <div className="text-muted-foreground max-h-40 overflow-y-auto">
            {allPresences.length > 0 ? (
              <pre className="text-[10px] bg-muted p-2 rounded">
                {JSON.stringify(allPresences, null, 2)}
              </pre>
            ) : (
              <div className="text-destructive">Nenhuma presença detectada</div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-foreground">Last Update:</div>
          <div className="text-muted-foreground font-mono">
            {lastUpdate || 'Aguardando primeira atualização...'}
          </div>
        </div>
      </div>
    </Card>
  );
};
