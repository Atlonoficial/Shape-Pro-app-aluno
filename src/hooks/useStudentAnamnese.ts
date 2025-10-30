import { useState, useEffect, useCallback } from 'react';
import { getStudentAnamnese } from '@/lib/supabase';
import { AnamneseRecord } from './useAnamnese';

export const useStudentAnamnese = (studentUserId?: string) => {
  const [record, setRecord] = useState<AnamneseRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnamnese = useCallback(async () => {
    if (!studentUserId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getStudentAnamnese(studentUserId);
      setRecord(data);
    } catch (err) {
      console.error('Error fetching student anamnese:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar anamnese');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [studentUserId]);

  useEffect(() => {
    fetchAnamnese();
  }, [fetchAnamnese]);

  return {
    record,
    loading,
    error,
    refresh: fetchAnamnese,
  };
};