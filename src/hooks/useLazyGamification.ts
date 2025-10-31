import { useState, useEffect } from 'react';

/**
 * Hook otimizado para Gamification com Lazy Loading
 * Adia o carregamento por 1s para melhorar o boot time
 * Fase 4 - Frontend Optimizations
 * 
 * Use este hook para controlar quando ativar a gamification:
 * const shouldLoadGamification = useLazyGamification();
 * 
 * Então passe para componentes que usam useGamificationRealtime
 */
export const useLazyGamification = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Carregar gamification apenas após 1s do mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return shouldLoad;
};
