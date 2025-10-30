import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PaymentGatewaySettings {
  id: string;
  teacher_id: string;
  gateway_type: 'mercadopago' | 'pagseguro' | 'asaas' | 'stripe';
  credentials: Record<string, any>;
  is_active: boolean;
  pix_key?: string;
  commission_rate?: number;
  bank_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useTeacherPaymentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PaymentGatewaySettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_payment_settings')
        .select('*')
        .eq('teacher_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data as PaymentGatewaySettings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<PaymentGatewaySettings>) => {
    if (!user || !newSettings.gateway_type) return false;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_payment_settings')
        .upsert({
          teacher_id: user.id,
          gateway_type: newSettings.gateway_type,
          credentials: newSettings.credentials || {},
          is_active: newSettings.is_active || false,
          pix_key: newSettings.pix_key || null,
          commission_rate: newSettings.commission_rate || 0
        }, { onConflict: 'teacher_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(data as PaymentGatewaySettings);
      toast({
        title: "Configurações salvas",
        description: "Configurações de pagamento atualizadas com sucesso!",
      });
      return true;
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de pagamento.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasActiveGateway = () => {
    return settings?.is_active && 
           settings?.gateway_type && 
           Object.keys(settings?.credentials || {}).length > 0;
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    hasActiveGateway: hasActiveGateway(),
    refresh: fetchSettings
  };
};