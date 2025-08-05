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
  trainings: Workout[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMyTrainings = (currentUserId: string | undefined): UseMyTrainingsReturn => {
  const [trainings, setTrainings] = useState<Workout[]>([]);
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
        collection(db, 'workouts'),
        where('assignedTo', 'array-contains', currentUserId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        trainingsQuery,
        (snapshot) => {
          const trainingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Converter timestamps do Firestore para Date se necessário
              createdAt: data.createdAt?.toDate?.() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            };
          }) as Workout[];

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