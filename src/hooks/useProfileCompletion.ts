import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useStudentProfile } from './useStudentProfile';

interface ProfileCompletionResult {
  percentage: number;
  isComplete: boolean;
  missingFields: number;
  completedFields: number;
  totalFields: number;
}

export const useProfileCompletion = (): ProfileCompletionResult => {
  const { userProfile } = useAuth();
  const { student } = useStudentProfile();

  const completion = useMemo((): ProfileCompletionResult => {
    if (!userProfile) {
      return {
        percentage: 0,
        isComplete: false,
        missingFields: 7,
        completedFields: 0,
        totalFields: 7
      };
    }

    const requiredFields = [
      userProfile.name,
      userProfile.email,
      userProfile.avatar_url,
      userProfile.phone,
      student?.weight,
      student?.height,
      student?.goals?.length ? student.goals.join('') : null,
    ];

    const completedFields = requiredFields.filter(Boolean);
    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);

    return {
      percentage,
      isComplete: percentage === 100,
      missingFields: requiredFields.length - completedFields.length,
      completedFields: completedFields.length,
      totalFields: requiredFields.length
    };
  }, [userProfile, student]);

  return completion;
};