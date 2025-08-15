import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface ActiveSubscription {
  id: string;
  plan_id: string;
  teacher_id: string;
  status: string;
  start_at: string;
  end_at: string | null;
  plan_name: string;
  plan_features: any[];
}

export const useActiveSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSubscription = async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get student data to get teacher_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id, active_plan, membership_status, membership_expiry')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData || !studentData.teacher_id) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // For now, use the legacy approach until types are updated
      if (studentData.active_plan && studentData.active_plan !== 'free' && studentData.membership_status === 'active') {
        // Check if subscription is not expired
        const isExpired = studentData.membership_expiry && new Date(studentData.membership_expiry) <= new Date();
        
        if (!isExpired) {
          setSubscription({
            id: 'legacy-subscription',
            plan_id: studentData.active_plan,
            teacher_id: studentData.teacher_id,
            status: studentData.membership_status,
            start_at: new Date().toISOString(),
            end_at: studentData.membership_expiry,
            plan_name: studentData.active_plan,
            plan_features: []
          });
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
    } catch (error: any) {
      console.error('Error fetching active subscription:', error);
      setError(error.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSubscription();

    // Set up real-time subscription for changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchActiveSubscription();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_subscriptions',
          filter: `student_user_id=eq.${user?.id}`,
        },
        () => {
          fetchActiveSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Helper functions
  const hasActiveSubscription = () => {
    return !!subscription && subscription.status === 'active' && subscription.plan_name !== 'free';
  };

  const isSubscriptionExpired = () => {
    if (!subscription || !subscription.end_at) return false;
    return new Date(subscription.end_at) <= new Date();
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'none';
    if (subscription.status === 'pending') return 'pending';
    if (isSubscriptionExpired()) return 'expired';
    if (subscription.status === 'active' && subscription.plan_name !== 'free') return 'active';
    return 'none';
  };

  const getStatusMessage = () => {
    const status = getSubscriptionStatus();
    
    switch (status) {
      case 'none':
        return 'Você precisa contratar uma consultoria para agendar horários';
      case 'pending':
        return 'Aguardando aprovação da consultoria pelo professor';
      case 'expired':
        return 'Sua consultoria expirou. Renove para continuar agendando';
      case 'active':
        return null; // Subscription is active, no message needed
      default:
        return 'Status da consultoria não reconhecido';
    }
  };

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription: hasActiveSubscription(),
    isExpired: isSubscriptionExpired(),
    status: getSubscriptionStatus(),
    statusMessage: getStatusMessage(),
    teacherId: subscription?.teacher_id || null,
    planName: subscription?.plan_name || null,
    refresh: fetchActiveSubscription,
  };
};