import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useStudentProfile } from './useStudentProfile';

export const useProfileCompletion = () => {
  const { userProfile } = useAuth();
  const { student } = useStudentProfile();

  const completion = useMemo(() => {
    if (!userProfile) return 0;

    const requiredFields = [
      userProfile.name,
      userProfile.email,
      userProfile.avatar_url,
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