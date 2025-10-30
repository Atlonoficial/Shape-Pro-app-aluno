import { useState, useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useIsMobileApp } from './useIsMobileApp';

interface GestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseBottomNavGesturesProps {
  activeTab: string;
  tabs: Array<{ id: string }>;
  onTabChange: (tab: string) => void;
}

export const useBottomNavGestures = ({ 
  activeTab, 
  tabs, 
  onTabChange 
}: UseBottomNavGesturesProps): GestureHandlers => {
  const { isMobileApp } = useIsMobileApp();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const triggerHaptic = useCallback(async () => {
    if (isMobileApp) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('[useBottomNavGestures] Haptic error:', error);
      }
    }
  }, [isMobileApp]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(false);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    if (deltaX > 10 && deltaX > deltaY) {
      setIsDragging(true);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let newIndex = currentIndex;

      if (deltaX > 0 && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        newIndex = currentIndex + 1;
      }

      if (newIndex !== currentIndex) {
        triggerHaptic();
        onTabChange(tabs[newIndex].id);
      }
    }

    setIsDragging(false);
  }, [isDragging, activeTab, tabs, onTabChange, triggerHaptic]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};
