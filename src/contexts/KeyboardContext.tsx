import { createContext, useContext, ReactNode } from 'react';
import { useKeyboardState } from '@/hooks/useKeyboardState';

interface KeyboardContextType {
  isVisible: boolean;
  height: number;
}

const KeyboardContext = createContext<KeyboardContextType>({
  isVisible: false,
  height: 0,
});

export const useKeyboard = () => useContext(KeyboardContext);

export const KeyboardProvider = ({ children }: { children: ReactNode }) => {
  const keyboardState = useKeyboardState();

  return (
    <KeyboardContext.Provider value={keyboardState}>
      {children}
    </KeyboardContext.Provider>
  );
};
