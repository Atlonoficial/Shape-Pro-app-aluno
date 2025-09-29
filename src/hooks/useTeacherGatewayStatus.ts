import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherGatewayStatus {
  gateway_type?: string;
  is_active: boolean;
  has_credentials: boolean;
  commission_rate?: number;
  pix_key?: string;
}

export const useTeacherGatewayStatus = (teacherId: string) => {
  const [gatewayStatus, setGatewayStatus] = useState<TeacherGatewayStatus>({
    is_active: false,
    has_credentials: false
  });
  const [loading, setLoading] = useState(false);

  const fetchGatewayStatus = async () => {
    if (!teacherId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teacher_payment_settings')
        .select('gateway_type, is_active, credentials, commission_rate, pix_key')
        .eq('teacher_id', teacherId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching gateway status:', error);
        return;
      }

      if (data) {
        setGatewayStatus({
          gateway_type: data.gateway_type,
          is_active: data.is_active,
          has_credentials: data.credentials && Object.keys(data.credentials).length > 0,
          commission_rate: data.commission_rate,
          pix_key: data.pix_key
        });
      }
    } catch (error) {
      console.error('Error fetching gateway status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
  }, [teacherId]);

  return {
    gatewayStatus,
    loading,
    refresh: fetchGatewayStatus,
    canProcessPayments: gatewayStatus.is_active && gatewayStatus.has_credentials
  };
};