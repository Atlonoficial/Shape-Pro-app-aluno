import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ActiveSubscription {
  id: string;
  plan_id: string;
  teacher_id: string;
  status: string;
  start_at: string;
  end_at: string | null;
  plan_name: string;
  plan_features: any[];
  plan_price?: number;
  plan_currency?: string;
  plan_interval?: string;
  daysRemaining?: number;
  expirationStatus?: 'active' | 'expiring_soon' | 'expired';
}

export const useActiveSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDaysRemaining = (endDate: string | null): number => {
    if (!endDate) return -1;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (daysRemaining: number): 'active' | 'expiring_soon' | 'expired' => {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring_soon';
    return 'active';
  };

  const fetchActiveSubscription = async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useActiveSubscription] Fetching subscription for user:', user.id);

      // First try to get subscription from plan_subscriptions table
      const { data: planSub, error: planSubError } = await supabase
        .from('plan_subscriptions')
        .select(`
          id, plan_id, status, start_at, end_at, teacher_id,
          plan_catalog (
            name, price, currency, interval, features
          )
        `)
        .eq('student_user_id', user.id)
        .eq('status', 'active')
        .order('start_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planSub && planSub.plan_catalog) {
        const daysRemaining = calculateDaysRemaining(planSub.end_at);
        const expirationStatus = getExpirationStatus(daysRemaining);
        
        setSubscription({
          id: planSub.id,
          plan_id: planSub.plan_id,
          teacher_id: planSub.teacher_id,
          status: planSub.status,
          start_at: planSub.start_at,
          end_at: planSub.end_at,
          plan_name: planSub.plan_catalog.name,
          plan_features: Array.isArray(planSub.plan_catalog.features) ? planSub.plan_catalog.features : [],
          plan_price: planSub.plan_catalog.price,
          plan_currency: planSub.plan_catalog.currency,
          plan_interval: planSub.plan_catalog.interval,
          daysRemaining,
          expirationStatus
        });
        setLoading(false);
        return;
      }

      // Fallback to legacy approach using students table
      console.log('[useActiveSubscription] No active plan subscription found, checking students table');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id, active_plan, membership_status, membership_expiry')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      console.log('[useActiveSubscription] Student data found:', studentData);

      if (!studentData || !studentData.teacher_id) {
        console.log('[useActiveSubscription] No student data or teacher found');
        setSubscription(null);
        setLoading(false);
        return;
      }

      if (studentData.active_plan && studentData.active_plan !== 'free' && studentData.membership_status === 'active') {
        const daysRemaining = calculateDaysRemaining(studentData.membership_expiry);
        const expirationStatus = getExpirationStatus(daysRemaining);
        
        if (expirationStatus !== 'expired') {
          setSubscription({
            id: 'legacy-subscription',
            plan_id: studentData.active_plan,
            teacher_id: studentData.teacher_id,
            status: studentData.membership_status,
            start_at: new Date().toISOString(),
            end_at: studentData.membership_expiry,
            plan_name: studentData.active_plan,
            plan_features: [],
            daysRemaining,
            expirationStatus
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
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchActiveSubscription();

    // Set up real-time subscription for changes with enhanced debugging
    console.log('[useActiveSubscription] Setting up real-time subscriptions for user:', user.id);
    
    const channel = supabase
      .channel(`subscription-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useActiveSubscription] Students table change detected:', payload);
          // Add small delay to ensure database consistency
          setTimeout(() => {
            fetchActiveSubscription();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_subscriptions',
          filter: `student_user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useActiveSubscription] Plan subscriptions change detected:', payload);
          setTimeout(() => {
            fetchActiveSubscription();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_catalog'
        },
        (payload) => {
          console.log('[useActiveSubscription] Plan catalog change detected:', payload);
          setTimeout(() => {
            fetchActiveSubscription();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('[useActiveSubscription] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Conectado",
            description: "Sistema de atualizações em tempo real ativo",
            duration: 2000,
          });
        }
      });

    return () => {
      console.log('[useActiveSubscription] Cleaning up subscriptions for user:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

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