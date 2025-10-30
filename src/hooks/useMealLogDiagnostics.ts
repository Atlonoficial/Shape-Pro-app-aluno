import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isValidUUID, ensureValidMealId } from '@/lib/utils';

export interface MealLogDiagnostic {
  timestamp: string;
  action: 'create' | 'update' | 'error';
  mealId: string;
  validMealId: string;
  success: boolean;
  error?: string;
  userId: string;
}

export const useMealLogDiagnostics = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<MealLogDiagnostic[]>([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    successfulLogs: 0,
    failedLogs: 0,
    successRate: 0
  });

  // Log diagnostic event
  const logDiagnostic = (diagnostic: Omit<MealLogDiagnostic, 'timestamp' | 'userId'>) => {
    if (!user?.id) return;

    const newDiagnostic: MealLogDiagnostic = {
      ...diagnostic,
      timestamp: new Date().toISOString(),
      userId: user.id
    };

    setDiagnostics(prev => {
      const updated = [newDiagnostic, ...prev].slice(0, 50); // Keep last 50 entries
      return updated;
    });

    console.log('[MealLogDiagnostics]', newDiagnostic);
  };

  // Calculate stats
  useEffect(() => {
    const totalAttempts = diagnostics.length;
    const successfulLogs = diagnostics.filter(d => d.success).length;
    const failedLogs = totalAttempts - successfulLogs;
    const successRate = totalAttempts > 0 ? (successfulLogs / totalAttempts) * 100 : 0;

    setStats({
      totalAttempts,
      successfulLogs,
      failedLogs,
      successRate: Math.round(successRate)
    });
  }, [diagnostics]);

  // Validate meal IDs in current meal plan
  const validateMealIds = async (mealPlan: any) => {
    if (!mealPlan?.meals_data) return { valid: 0, invalid: 0, issues: [] };

    const issues: Array<{mealId: string, isValid: boolean, convertedId: string}> = [];
    let valid = 0;
    let invalid = 0;

    mealPlan.meals_data.forEach((meal: any) => {
      const isValid = isValidUUID(meal.id);
      const convertedId = ensureValidMealId(meal.id);
      
      if (isValid) {
        valid++;
      } else {
        invalid++;
      }

      issues.push({
        mealId: meal.id,
        isValid,
        convertedId
      });
    });

    return { valid, invalid, issues };
  };

  // Test meal log creation
  const testMealLogCreation = async (mealId: string) => {
    if (!user?.id) return false;

    try {
      const validMealId = ensureValidMealId(mealId);
      
      logDiagnostic({
        action: 'create',
        mealId,
        validMealId,
        success: true
      });

      return true;
    } catch (error) {
      logDiagnostic({
        action: 'error',
        mealId,
        validMealId: ensureValidMealId(mealId),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  };

  return {
    diagnostics,
    stats,
    logDiagnostic,
    validateMealIds,
    testMealLogCreation
  };
};