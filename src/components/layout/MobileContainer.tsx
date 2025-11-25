import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className = "" }: MobileContainerProps) => {
  return (
    <div
      className={`tab-container w-full min-h-screen bg-background ${className}`}
      style={{
        position: 'relative',
        paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' // 72px tab bar + ~18px spacing
      }}
    >
      {children}
    </div>
  );
};