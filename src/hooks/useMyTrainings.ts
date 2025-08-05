import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Workout } from '@/lib/firestore';

/**
 * Hook para buscar treinos do usuário atual ordenados por data
 * 
 * ONDE USAR:
 * - /pages/aluno/dashboard.tsx (seção "Meus Treinos")
 * - /pages/aluno/treinos.tsx (lista completa de treinos)
 * - Componentes que mostram progresso de treinos
 * 
 * EXEMPLO DE USO:
 * const { trainings, loading, error } = useMyTrainings(user?.uid);
 */

interface UseMyTrainingsReturn {
  trainings: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMyTrainings = (currentUserId: string | undefined): UseMyTrainingsReturn => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      setTrainings([]);
      return;
    }

    try {
      // Query para buscar treinos atribuídos ao usuário atual
      // Ordenados por data de criação (mais recentes primeiro)
      const trainingsQuery = query(
        collection(db, 'training_plans'),
        where('assignedTo', 'array-contains', currentUserId),
        orderBy('created_at', 'desc')
      );

      // Debug Firestore query
      console.log('📋 [App] Query training_plans:', trainingsQuery);
      console.log('📋 [App] Query training_plans (toString):', trainingsQuery.toString());

      const unsubscribe = onSnapshot(
        trainingsQuery,
        (snapshot) => {
          console.log('🔔 [App] onSnapshot training_plans docs IDs:', snapshot.docs.map(d => d.id));
          const trainingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Converter timestamps do Firestore para Date se necessário
              created_at: data.created_at?.toDate?.() || data.created_at,
              updated_at: data.updated_at?.toDate?.() || data.updated_at
            };
          }) as any[];

          setTrainings(trainingsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Erro ao buscar treinos do usuário:', err);
          setError('Erro ao carregar seus treinos');
          setLoading(false);
        }
      );

      return () => unsubscribe();

    } catch (err) {
      console.error('Erro no useMyTrainings:', err);
      setError('Erro ao configurar busca de treinos');
      setLoading(false);
    }
  }, [currentUserId]);

  return {
    trainings,
    loading,
    error,
    refetch
  };
};