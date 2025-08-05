import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Interface para dados iniciais do usuário
interface InitialUserData {
  uid: string;
  email: string;
  name: string;
  userType: 'student' | 'teacher';
}

// Configuração inicial do banco de dados para novos usuários
export const initializeUserData = async (userData: InitialUserData) => {
  try {
    const { uid, email, name, userType } = userData;
    const now = Timestamp.now();

    // Criar documento do usuário
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      name,
      userType,
      createdAt: now,
      lastLogin: now,
      profileComplete: false,
      preferences: {
        notifications: true,
        theme: 'system',
        language: 'pt-BR'
      },
      stats: {
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
        averageWorkoutDuration: 0,
        streakDays: 0
      }
    });

    // Se for student, criar dados de progresso inicial
    if (userType === 'student') {
      await addDoc(collection(db, 'progress'), {
        userId: uid,
        type: 'weight',
        value: 0,
        unit: 'kg',
        notes: 'Peso inicial a ser definido',
        date: now
      });

      // Criar metas padrão
      await addDoc(collection(db, 'goals'), {
        userId: uid,
        title: 'Primeira Meta',
        description: 'Defina sua primeira meta de fitness',
        targetValue: 0,
        currentValue: 0,
        unit: 'kg',
        type: 'weight',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        isActive: true,
        createdAt: now
      });
    }

    // Criar notificação de boas-vindas
    await addDoc(collection(db, 'notifications'), {
      title: 'Bem-vindo ao Shape Pro!',
      message: `Olá ${name}! Sua conta foi criada com sucesso. Complete seu perfil para começar sua jornada.`,
      type: 'general',
      targetUsers: [uid],
      isRead: false,
      createdAt: now
    });

    console.log('Dados iniciais do usuário criados com sucesso');
  } catch (error) {
    console.error('Erro ao criar dados iniciais do usuário:', error);
    throw error;
  }
};

// Dados de exemplo para desenvolvimento
export const createSampleData = async (userId: string) => {
  try {
    const now = Timestamp.now();

    // Workout de exemplo
    await addDoc(collection(db, 'workouts'), {
      name: 'Treino de Iniciante - Corpo Todo',
      description: 'Um treino completo para iniciantes focado em todos os grupos musculares',
      exercises: [
        {
          id: '1',
          name: 'Flexão de Braço',
          sets: 3,
          reps: 10,
          restTime: 60,
          instructions: 'Mantenha o corpo reto e desça até o peito quase tocar o chão',
          muscleGroup: 'Peito, Ombros, Tríceps'
        },
        {
          id: '2',
          name: 'Agachamento',
          sets: 3,
          reps: 15,
          restTime: 60,
          instructions: 'Desça até as coxas ficarem paralelas ao chão',
          muscleGroup: 'Quadríceps, Glúteos'
        },
        {
          id: '3',
          name: 'Prancha',
          sets: 3,
          duration: 30,
          restTime: 60,
          instructions: 'Mantenha o corpo reto como uma tábua',
          muscleGroup: 'Core'
        }
      ],
      duration: 30,
      calories: 150,
      difficulty: 'beginner',
      muscleGroup: 'Corpo Todo',
      assignedTo: [userId],
      createdBy: 'system',
      createdAt: now,
      updatedAt: now
    });

    // Plano nutricional de exemplo
    await addDoc(collection(db, 'nutrition'), {
      name: 'Plano Nutricional Básico',
      description: 'Um plano nutricional equilibrado para iniciantes',
      meals: [
        {
          id: '1',
          name: 'Café da Manhã',
          calories: 350,
          protein: 20,
          carbs: 45,
          fat: 12,
          time: '08:00',
          foods: ['Aveia', 'Banana', 'Leite', 'Mel']
        },
        {
          id: '2',
          name: 'Almoço',
          calories: 450,
          protein: 35,
          carbs: 50,
          fat: 15,
          time: '12:00',
          foods: ['Frango grelhado', 'Arroz integral', 'Feijão', 'Salada']
        },
        {
          id: '3',
          name: 'Jantar',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 12,
          time: '19:00',
          foods: ['Peixe', 'Batata doce', 'Brócolis', 'Azeite']
        }
      ],
      totalCalories: 1200,
      assignedTo: [userId],
      createdBy: 'system',
      createdAt: now,
      updatedAt: now
    });

    console.log('Dados de exemplo criados com sucesso');
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
    throw error;
  }
};

// Função para limpar dados de teste
export const clearUserData = async (userId: string) => {
  try {
    // Esta função seria implementada para limpar dados de teste
    // Por segurança, não vamos implementar a lógica de delete aqui
    console.log(`Limpeza de dados solicitada para usuário: ${userId}`);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
    throw error;
  }
};