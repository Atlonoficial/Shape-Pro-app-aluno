import { useCallback, useRef } from "react";

/**
 * Hook para prevenir chamadas duplicadas de gamificação
 * Implementa debounce e cache para evitar pontos duplicados
 */
export const useGamificationDebounce = () => {
  const recentActions = useRef<Map<string, number>>(new Map());
  const DEBOUNCE_TIME = 5000; // 5 seconds

  const isDuplicateAction = useCallback((actionKey: string): boolean => {
    const now = Date.now();
    const lastActionTime = recentActions.current.get(actionKey);
    
    if (lastActionTime && (now - lastActionTime) < DEBOUNCE_TIME) {
      console.warn(`[Gamification] Duplicate action prevented: ${actionKey}`);
      return true;
    }
    
    recentActions.current.set(actionKey, now);
    
    // Limpar ações antigas
    for (const [key, time] of recentActions.current.entries()) {
      if ((now - time) > DEBOUNCE_TIME * 2) {
        recentActions.current.delete(key);
      }
    }
    
    return false;
  }, []);

  const generateActionKey = useCallback((type: string, userId: string, metadata?: any): string => {
    const baseKey = `${type}_${userId}`;
    
    // Para alguns tipos, adicionar identificadores únicos mais rigorosos
    if (type === 'meal_logged') {
      const today = new Date().toISOString().split('T')[0];
      const mealId = metadata?.meal_plan_item_id || metadata?.meal_id || 'unknown';
      return `${baseKey}_${mealId}_${today}`;
    }
    
    if (type === 'progress_logged' && metadata?.progress_type) {
      // Para progresso, usar apenas tipo + data para evitar spam
      const today = new Date().toISOString().split('T')[0];
      return `${baseKey}_${metadata.progress_type}_${today}`;
    }
    
    if (type === 'daily_checkin') {
      const today = new Date().toISOString().split('T')[0];
      return `${baseKey}_${today}`;
    }
    
    if (type === 'training_completed') {
      // Para treinos, permitir múltiplos por dia mas com debounce
      return `${baseKey}_${Math.floor(Date.now() / (5 * 60 * 1000))}`;
    }
    
    return `${baseKey}_${Date.now()}`;
  }, []);

  return {
    isDuplicateAction,
    generateActionKey
  };
};