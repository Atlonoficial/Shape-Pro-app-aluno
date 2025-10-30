import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className = "" }: MobileContainerProps) => {
  return (
    <div 
      className={`tab-container pb-safe ${className}`}
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  );
};