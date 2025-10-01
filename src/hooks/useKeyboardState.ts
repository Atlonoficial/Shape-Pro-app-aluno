import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { useIsMobileApp } from './useIsMobileApp';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

export const useKeyboardState = () => {
  const { isMobileApp } = useIsMobileApp();
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    if (!isMobileApp) return;

    let keyboardShowListener: any;
    let keyboardHideListener: any;

    const setupKeyboardListeners = async () => {
      try {
        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardState({
            isVisible: true,
            height: info.keyboardHeight,
          });
        });

        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardState({
            isVisible: false,
            height: 0,
          });
        });
      } catch (error) {
        console.error('[useKeyboardState] Error setting up keyboard listeners:', error);
      }
    };

    setupKeyboardListeners();

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [isMobileApp]);

  return keyboardState;
};
