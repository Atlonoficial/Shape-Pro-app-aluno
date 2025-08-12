import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getStudentByUserId, createStudent, updateStudentProfile, Student } from '@/lib/supabase';

export const useStudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!user?.id) {
      setStudent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      unsubscribe = getStudentByUserId(user.id, (s) => {
        setStudent(s);
        setLoading(false);
      });
    } catch (e: any) {
      console.error('Error subscribing to student profile:', e);
      setError(e?.message || 'Erro ao carregar perfil');
      setLoading(false);
    }

    return () => {
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, [user?.id]);

  const createStudentProfile = useCallback(async (profileData: Partial<Student>) => {
    if (!user?.id) throw new Error('User not authenticated');
    setError(null);
    try {
      const payload: any = { user_id: user.id, ...profileData };
      const res: any = await createStudent(payload);
      return res?.id ?? 'ok';
    } catch (e: any) {
      console.error('Error creating student profile:', e);
      setError(e?.message || 'Erro ao criar perfil');
      throw e;
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<Student>) => {
    if (!student?.id) throw new Error('Student profile not loaded');
    setError(null);
    try {
      await updateStudentProfile(student.id, updates);
    } catch (e: any) {
      console.error('Error updating profile:', e);
      setError(e?.message || 'Erro ao atualizar perfil');
      throw e;
    }
  }, [student?.id]);

  return {
    student,
    loading,
    error,
    createStudentProfile,
    updateProfile,
    isActive: student?.membership_status === 'active',
    hasTeacher: !!student?.teacher_id
  };
};