import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useAnamnese } from './useAnamnese';

export const useAnamneseCompletion = () => {
  const { user } = useAuth();
  const { record, loading } = useAnamnese(user?.id);

  const completion = useMemo(() => {
    if (loading) return { percentage: 0, isComplete: false, hasAnamnese: false };
    if (!record) return { percentage: 0, isComplete: false, hasAnamnese: false };

    // Campos essenciais da anamnese
    const essentialFields = [
      record.doencas?.length ? 'diseases' : null,
      record.alergias?.length ? 'allergies' : null, 
      record.medicacoes?.length ? 'medications' : null,
      record.qualidade_sono ? 'sleep_quality' : null,
      record.horas_sono ? 'sleep_hours' : null,
    ];

    // Campos opcionais mas recomendados
    const optionalFields = [
      record.outras_doencas ? 'other_diseases' : null,
      record.outras_alergias ? 'other_allergies' : null,
      record.lesoes ? 'injuries' : null,
    ];

    const completedEssential = essentialFields.filter(Boolean).length;
    const completedOptional = optionalFields.filter(Boolean).length;
    
    // Peso maior para campos essenciais
    const essentialWeight = 0.7;
    const optionalWeight = 0.3;
    
    const essentialPercentage = (completedEssential / essentialFields.length) * essentialWeight;
    const optionalPercentage = (completedOptional / optionalFields.length) * optionalWeight;
    
    const percentage = Math.round((essentialPercentage + optionalPercentage) * 100);

    return {
      percentage,
      isComplete: percentage >= 70, // 70% considerado completo
      hasAnamnese: true,
      completedEssential,
      completedOptional,
      totalEssential: essentialFields.length,
      totalOptional: optionalFields.length
    };
  }, [record, loading]);

  return completion;
};