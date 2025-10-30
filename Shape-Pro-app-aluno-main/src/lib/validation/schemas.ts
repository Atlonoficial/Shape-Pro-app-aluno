import { z } from 'zod';

// Authentication schemas
export const signUpSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  userType: z.enum(['student', 'teacher']).default('student')
});

export const signInSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// Profile schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Telefone inválido').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  goals: z.string().max(500, 'Objetivos muito longos').optional(),
  medical_conditions: z.string().max(1000, 'Condições médicas muito longas').optional()
});

// Chat schemas
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(5000, 'Mensagem muito longa')
    .refine(val => {
      // Block XSS attempts
      const dangerous = /<script|javascript:|data:text\/html|<iframe|<object|<embed|eval\(|document\.|window\./i;
      return !dangerous.test(val);
    }, 'Conteúdo da mensagem não permitido'),
  conversation_id: z.string().uuid('ID da conversa inválido'),
  message_type: z.enum(['text', 'image', 'file']).default('text'),
  attachments: z.array(z.object({
    url: z.string().url('URL inválida'),
    type: z.string(),
    name: z.string().max(255, 'Nome do arquivo muito longo')
  })).max(5, 'Máximo 5 anexos').optional()
});

// Feedback schemas
export const feedbackSchema = z.object({
  rating: z.number().min(1, 'Avaliação mínima é 1').max(5, 'Avaliação máxima é 5'),
  message: z.string()
    .min(10, 'Feedback deve ter pelo menos 10 caracteres')
    .max(1000, 'Feedback muito longo')
    .refine(val => {
      const dangerous = /<script|javascript:|data:text\/html/i;
      return !dangerous.test(val);
    }, 'Conteúdo do feedback não permitido'),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).max(10, 'Máximo 10 tags').optional()
  }).optional()
});

// Payment schemas
export const paymentDataSchema = z.object({
  amount: z.number()
    .min(0.01, 'Valor mínimo é R$ 0,01')
    .max(10000, 'Valor máximo é R$ 10.000,00'),
  currency: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  metadata: z.object({
    student_id: z.string().uuid('ID do aluno inválido'),
    teacher_id: z.string().uuid('ID do professor inválido'),
    plan_id: z.string().uuid('ID do plano inválido').optional(),
    course_id: z.string().uuid('ID do curso inválido').optional()
  })
});

// Appointment schemas
export const appointmentSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  scheduled_time: z.string().datetime('Data/hora inválida'),
  duration: z.number().min(15, 'Duração mínima 15 minutos').max(480, 'Duração máxima 8 horas').default(60),
  type: z.enum(['consultation', 'training', 'assessment', 'other']).default('consultation'),
  student_id: z.string().uuid('ID do aluno inválido'),
  location: z.string().max(255, 'Local muito longo').optional(),
  meeting_link: z.string().url('Link inválido').optional(),
  price: z.number().min(0, 'Preço não pode ser negativo').optional()
});

// Course schemas
export const courseSchema = z.object({
  title: z.string().min(5, 'Título muito curto').max(200, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  price: z.number().min(0, 'Preço não pode ser negativo').optional(),
  category: z.string().max(100, 'Categoria muito longa').optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  is_free: z.boolean().default(false),
  requirements: z.array(z.string().max(200)).max(10, 'Máximo 10 requisitos').optional(),
  what_you_learn: z.array(z.string().max(200)).max(20, 'Máximo 20 itens').optional(),
  tags: z.array(z.string().max(50)).max(15, 'Máximo 15 tags').optional()
});

// Banner schemas
export const bannerSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(100, 'Título muito longo'),
  message: z.string().max(300, 'Mensagem muito longa').optional(),
  type: z.enum(['info', 'warning', 'success', 'promotional']).default('info'),
  action_text: z.string().max(50, 'Texto do botão muito longo').optional(),
  action_url: z.string().url('URL inválida').optional(),
  start_date: z.string().datetime('Data de início inválida').optional(),
  end_date: z.string().datetime('Data de fim inválida').optional(),
  target_users: z.array(z.string().uuid()).max(1000, 'Máximo 1000 usuários').optional(),
  priority: z.number().min(0).max(10).default(0)
});

// Goal schemas
export const goalSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  category: z.enum(['weight', 'strength', 'cardio', 'flexibility', 'nutrition', 'habit']),
  target_value: z.number().min(0.1, 'Valor alvo deve ser positivo'),
  current_value: z.number().min(0, 'Valor atual não pode ser negativo').default(0),
  unit: z.string().max(20, 'Unidade muito longa'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  is_active: z.boolean().default(true)
});

// Meal log schemas
export const mealLogSchema = z.object({
  meal_plan_item_id: z.string().min(1, 'ID da refeição é obrigatório'),
  consumed: z.boolean().default(true),
  portion_size: z.number().min(0.1, 'Porção deve ser positiva').max(10, 'Porção muito grande').default(1),
  notes: z.string().max(300, 'Notas muito longas').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  consumed_at: z.string().datetime('Horário inválido').optional()
});

// Progress photo schemas
export const progressPhotoSchema = z.object({
  description: z.string().max(300, 'Descrição muito longa').optional(),
  weight: z.number().min(20, 'Peso muito baixo').max(300, 'Peso muito alto').optional(),
  body_fat: z.number().min(1, 'Percentual de gordura muito baixo').max(60, 'Percentual de gordura muito alto').optional(),
  muscle_mass: z.number().min(10, 'Massa muscular muito baixa').max(150, 'Massa muscular muito alta').optional(),
  measurements: z.object({
    chest: z.number().min(50).max(200).optional(),
    waist: z.number().min(40).max(200).optional(),
    hips: z.number().min(50).max(200).optional(),
    arms: z.number().min(15).max(80).optional(),
    thighs: z.number().min(30).max(120).optional()
  }).optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string().max(255, 'Nome do arquivo muito longo'),
    size: z.number().max(50 * 1024 * 1024, 'Arquivo muito grande (máximo 50MB)'),
    type: z.string().regex(/^(image|video|application\/pdf|text)\//, 'Tipo de arquivo não permitido')
  }),
  category: z.enum(['profile', 'progress', 'document', 'course_material']).default('document'),
  description: z.string().max(300, 'Descrição muito longa').optional()
});

// Exercise schemas
export const exerciseSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  instructions: z.string().max(2000, 'Instruções muito longas').optional(),
  muscle_group: z.string().max(50, 'Grupo muscular muito longo'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.array(z.string().max(50)).max(10, 'Máximo 10 equipamentos').optional(),
  sets: z.number().min(1, 'Mínimo 1 série').max(20, 'Máximo 20 séries'),
  reps: z.number().min(1, 'Mínimo 1 repetição').max(100, 'Máximo 100 repetições'),
  rest_time: z.number().min(0, 'Tempo de descanso não pode ser negativo').max(600, 'Tempo de descanso muito longo'),
  weight: z.number().min(0, 'Peso não pode ser negativo').max(1000, 'Peso muito alto').optional(),
  duration: z.number().min(1, 'Duração muito curta').max(7200, 'Duração muito longa').optional()
});

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
};

// XSS prevention helper
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting helper
export const rateLimitKey = (userId: string, action: string): string => {
  return `rate_limit:${userId}:${action}`;
};