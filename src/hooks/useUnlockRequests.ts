import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UnlockRequest {
  id: string;
  student_id: string;
  course_id: string;
  teacher_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const useUnlockRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<UnlockRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const createUnlockRequest = async (courseId: string, teacherId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para solicitar desbloqueio",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('course_unlock_requests')
        .insert([
          {
            student_id: user.id,
            course_id: courseId,
            teacher_id: teacherId,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Solicitação já existe",
            description: "Você já solicitou o desbloqueio deste curso",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada ao professor!",
      });

      // Refresh requests
      fetchUserRequests();
      return true;
    } catch (error) {
      console.error('Error creating unlock request:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_unlock_requests')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      setRequests((data || []) as UnlockRequest[]);
    } catch (error) {
      console.error('Error fetching unlock requests:', error);
    }
  };

  const getRequestStatus = (courseId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
    const request = requests.find(r => r.course_id === courseId);
    return request?.status || 'none';
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  return {
    requests,
    loading,
    createUnlockRequest,
    getRequestStatus,
    refresh: fetchUserRequests
  };
};