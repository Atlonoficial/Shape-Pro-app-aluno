import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';

export const useRealTimePermissions = () => {
  const { user } = useAuth();
  const { refresh } = useActiveSubscription();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime permissions listeners');

    // Escutar mudanças na tabela students
    const studentsChannel = supabase
      .channel('students-permissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Students table changed:', payload);
          refresh();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela plan_subscriptions
    const subscriptionsChannel = supabase
      .channel('plan-subscriptions-permissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_subscriptions',
          filter: `student_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Plan subscriptions changed:', payload);
          refresh();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela payment_transactions
    const transactionsChannel = supabase
      .channel('payment-transactions-permissions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_transactions',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Payment transaction updated:', payload);
          // Só recarregar se status mudou para paid
          if (payload.new?.status === 'paid') {
            setTimeout(() => {
              refresh();
            }, 2000); // Delay para garantir que webhook processou
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up realtime permissions listeners');
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [user?.id, refresh]);

  return null;
};