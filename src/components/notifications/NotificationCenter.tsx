import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, Trash2, MessageCircle, Zap, Trophy, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { markNotificationAsRead } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';

interface NotificationCenterProps {
  userId: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'workout':
      return <Zap className="w-4 h-4 text-primary" />;
    case 'achievement':
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 'appointment':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'message':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { notifications, loading, unreadCount } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        toast({
          description: "Notificação marcada como lida",
        });
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }

    // Navigate if deep_link exists
    if (notification.deep_link) {
      window.location.href = notification.deep_link;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          markNotificationAsRead(notification.id)
        )
      );

      toast({
        description: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        variant: "destructive",
        description: "Erro ao marcar notificações como lidas",
      });
    }
  };

  const handleClearAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .contains('target_users', [userId]);

      if (error) throw error;

      toast({
        description: "Todas as notificações foram removidas",
      });
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      toast({
        variant: "destructive",
        description: "Erro ao limpar notificações",
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.is_read ? 'bg-muted' : 'bg-primary'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className={`text-sm ${
                          notification.is_read ? 'text-muted-foreground' : 'font-medium text-foreground'
                        }`}>
                          {notification.title}
                        </p>
                      </div>
                    </div>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at!), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                    {notification.action_required && notification.action_text && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.action_url) {
                            window.location.href = notification.action_url;
                          }
                        }}
                      >
                        {notification.action_text}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-border flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="flex-1 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}