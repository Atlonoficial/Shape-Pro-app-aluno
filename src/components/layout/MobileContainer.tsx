import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className = "" }: MobileContainerProps) => {
  return (
    <div
      className={`tab-container pb-32 safe-area-bottom ${className}`}
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  );
};