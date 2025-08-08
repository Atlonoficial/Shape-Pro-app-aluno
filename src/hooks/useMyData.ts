import { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student, Workout } from '@/lib/firestore';

/**
 * Hook para buscar dados do estudante logado em tempo real
 * 
 * ONDE USAR:
 * - /pages/aluno/dashboard.tsx (para exibir perfil e treinos atribuídos)
 * - Qualquer componente que precise dos dados do estudante atual
 * 
 * EXEMPLO DE USO:
 * const { student, trainings, loading, error } = useMyData(user?.uid);
 */

interface UseMyDataReturn {
  student: Student | null;
  trainings: any[];
  loading: boolean;
  error: string | null;
}

export const useMyData = (studentId: string | undefined): UseMyDataReturn => {
  const [student, setStudent] = useState<Student | null>(null);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    try {
      // 1. Listener para dados do estudante
      const studentRef = doc(db, 'students', studentId);
      const unsubscribeStudent = onSnapshot(
        studentRef,
        (doc) => {
          if (doc.exists()) {
            setStudent({ id: doc.id, ...doc.data() } as Student);
          } else {
            setStudent(null);
          }
        },
        (err) => {
          console.error('Erro ao buscar dados do estudante:', err);
          setError('Erro ao carregar dados do perfil');
        }
      );
      unsubscribes.push(unsubscribeStudent);

      // 2. Listener para treinos atribuídos ao estudante
      const trainingsQuery = query(
        collection(db, 'training_plans'),
        where('student_id', '==', studentId),
        orderBy('updated_at', 'desc')
      );
      
      const unsubscribeTrainings = onSnapshot(
        trainingsQuery,
        (snapshot) => {
          const trainingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          setTrainings(trainingsData);
          setLoading(false);
        },
        (err) => {
          console.error('Erro ao buscar treinos:', err);
          setError('Erro ao carregar treinos');
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribeTrainings);

    } catch (err) {
      console.error('Erro no useMyData:', err);
      setError('Erro ao configurar listeners');
      setLoading(false);
    }

    // Cleanup
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [studentId]);

  return {
    student,
    trainings,
    loading,
    error
  };
};