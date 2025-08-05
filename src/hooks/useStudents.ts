import { useState } from 'react';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar cadastro e atualização de estudantes
 * 
 * SINCRONIZAÇÃO COM DASHBOARD DO PROFESSOR:
 * - Mesma coleção: 'students' no projeto shapepro-aluno
 * - Mesmo campo teacher_id para vincular professor/aluno
 * - Campos compatíveis com StudentManagementSection do Dashboard
 * - Real-time sync via onSnapshot no Dashboard
 */

export interface StudentData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  mode: string; 
  status?: 'active' | 'inactive' | 'pending'; // Opcional no input, definido automaticamente
  goal: string;
  teacher_id: string; // CAMPO CRÍTICO para Dashboard do Professor
  created_at?: any;
  updated_at?: any;
  // Campos adicionais do cadastro completo
  birthDate?: string;
  gender?: string;
  height?: number;
  initialWeight?: number;
  numericGoal?: string;
}

export const useStudents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cria novo estudante no Firestore
   * SINCRONIZAÇÃO: Professor verá instantaneamente no Dashboard
   */
  const createStudent = async (studentData: Omit<StudentData, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      // Debug logs para verificar salvamento
      console.log('🎓 [App] Criando estudante:', studentData);
      console.log('🎓 [App] Teacher ID:', studentData.teacher_id);
      console.log('🎓 [App] Project ID:', db.app.options.projectId);

      const studentPayload: StudentData = {
        ...studentData,
        status: 'active',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };

      // Adicionar à coleção 'students' - mesma que o Dashboard usa
      const docRef = await addDoc(collection(db, 'students'), studentPayload);
      
      console.log('✅ [App] Estudante criado com ID:', docRef.id);
      console.log('✅ [App] Dados salvos:', studentPayload);
      
      return docRef.id;
    } catch (error: any) {
      console.error('❌ [App] Erro ao criar estudante:', error);
      setError('Erro ao criar perfil do estudante');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza estudante existente
   * SINCRONIZAÇÃO: Mudanças aparecerão no Dashboard em tempo real
   */
  const updateStudent = async (studentId: string, updates: Partial<StudentData>) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎓 [App] Atualizando estudante:', studentId, updates);
      
      const updatePayload = {
        ...updates,
        updated_at: Timestamp.now()
      };

      await updateDoc(doc(db, 'students', studentId), updatePayload);
      
      console.log('✅ [App] Estudante atualizado:', studentId);
    } catch (error: any) {
      console.error('❌ [App] Erro ao atualizar estudante:', error);
      setError('Erro ao atualizar perfil do estudante');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper para mapear objetivos do formulário para formato padrão
   */
  const mapGoalToStandard = (objetivo: string): string => {
    const goalMap: { [key: string]: string } = {
      'emagrecer': 'Emagrecimento',
      'hipertrofia': 'Hipertrofia',
      'manutencao': 'Manutenção',
      'Emagrecer': 'Emagrecimento',
      'Hipertrofia': 'Hipertrofia',
      'Manutenção': 'Manutenção'
    };
    return goalMap[objetivo] || objetivo;
  };

  return {
    createStudent,
    updateStudent,
    mapGoalToStandard,
    loading,
    error
  };
};