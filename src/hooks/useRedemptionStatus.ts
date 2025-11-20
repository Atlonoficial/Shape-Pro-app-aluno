import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useRedemptionStatus = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('redemption-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          // Only show notification if status actually changed
          if (newStatus !== oldStatus) {
            if (newStatus === 'approved') {
              toast({
                title: "Resgate Aprovado! 🎉",
                description: "Seu resgate foi aprovado pelo professor. Entre em contato para retirar sua recompensa.",
                duration: 5000,
              });
            } else if (newStatus === 'rejected') {
              toast({
                title: "Resgate Recusado",
                description: payload.new.admin_notes || "Seu resgate foi recusado. Seus pontos foram devolvidos.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
