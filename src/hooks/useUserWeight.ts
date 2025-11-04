import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserWeight = () => {
  const { user } = useAuth();
  const [weight, setWeight] = useState<number>(70); // Default 70kg
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeight = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Try to get weight from evaluations physical_measurements
        const { data: evalData } = await supabase
          .from('evaluations')
          .select('physical_measurements')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (evalData?.physical_measurements) {
          const measurements = evalData.physical_measurements as any;
          const weightMeasurement = Array.isArray(measurements) 
            ? measurements.find((m: any) => 
                m.name?.toLowerCase().includes('peso') || 
                m.label?.toLowerCase().includes('peso') ||
                m.name?.toLowerCase().includes('weight')
              )
            : null;
          
          if (weightMeasurement?.value) {
            setWeight(parseFloat(weightMeasurement.value));
          }
        }
      } catch (error) {
        console.error('Error fetching user weight:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeight();
  }, [user?.id]);

  return { weight, loading };
};
