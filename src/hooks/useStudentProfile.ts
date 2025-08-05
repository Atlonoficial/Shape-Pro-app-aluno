import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  getStudentByUserId, 
  Student,
  createStudent,
  updateStudentProfile 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useStudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = getStudentByUserId(user.uid, (studentData) => {
      setStudent(studentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const createStudentProfile = async (profileData: Partial<Student>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const newStudent: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        teacherId: profileData.teacherId || '',
        goals: profileData.goals || [],
        measurements: profileData.measurements || {
          weight: 0,
          height: 0,
          lastUpdated: Timestamp.now()
        },
        preferences: profileData.preferences || {
          notifications: true,
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        },
        membershipStatus: 'active',
        ...profileData
      };

      const studentId = await createStudent(newStudent);
      return studentId;
    } catch (error) {
      console.error('Error creating student profile:', error);
      setError('Erro ao criar perfil do aluno');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Student>) => {
    if (!student?.id) {
      throw new Error('Student profile not found');
    }

    try {
      await updateStudentProfile(student.id, updates);
    } catch (error) {
      console.error('Error updating student profile:', error);
      setError('Erro ao atualizar perfil');
      throw error;
    }
  };

  return {
    student,
    loading,
    error,
    createStudentProfile,
    updateProfile,
    isActive: student?.membershipStatus === 'active',
    hasTeacher: !!student?.teacherId
  };
};