import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useStudentTeacher } from '@/hooks/useStudentTeacher';
import { toast } from 'sonner';

interface CheckoutItem {
  type: 'course' | 'product' | 'plan';
  id: string;
  title: string;
  price: number;
  quantity?: number;
  course_id?: string;
  product_id?: string;
  plan_catalog_id?: string;
}

interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { teacherId } = useStudentTeacher();

  const createCheckout = async (
    items: CheckoutItem[],
    customerData?: CustomerData
  ) => {
    if (!user || !teacherId) {
      toast.error('Usuário não autenticado ou professor não encontrado');
      return null;
    }

    setLoading(true);

    try {
      // Calcular total
      const totalAmount = items.reduce(
        (total, item) => total + item.price * (item.quantity || 1), 
        0
      );

      console.log('🛒 Creating checkout:', { items, totalAmount });

      // Chamar edge function de checkout dinâmico
      const { data, error } = await supabase.functions.invoke('dynamic-checkout', {
        body: {
          teacherId,
          studentId: user.id,
          items,
          totalAmount,
          customerData: {
            name: customerData?.name || user.user_metadata?.name || '',
            email: customerData?.email || user.email || '',
            phone: customerData?.phone || ''
          }
        }
      });

      if (error) {
        console.error('❌ Checkout error:', error);
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no checkout');
      }

      console.log('✅ Checkout created:', data);

      // Log analytics da tentativa de compra
      await supabase.rpc('award_points_enhanced_v3', {
        p_user_id: user.id,
        p_activity_type: 'checkout_initiated',
        p_description: `Checkout iniciado - ${totalAmount} BRL`,
        p_metadata: { 
          items: items.length, 
          amount: totalAmount,
          gateway: data.gateway_type 
        }
      });

      toast.success(
        `Checkout criado! Redirecionando para ${data.gateway_type}...`
      );

      return {
        success: true,
        checkout_url: data.checkout_url,
        transaction_id: data.transaction_id,
        gateway_type: data.gateway_type,
        expires_at: data.expires_at
      };

    } catch (error: any) {
      console.error('❌ Checkout failed:', error);
      toast.error(error.message || 'Erro ao criar checkout');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('status, paid_at, gateway_type')
        .eq('id', transactionId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return null;
    }
  };

  return {
    createCheckout,
    checkPaymentStatus,
    loading
  };
};