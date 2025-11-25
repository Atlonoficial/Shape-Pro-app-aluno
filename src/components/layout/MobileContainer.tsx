import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  withBottomPadding?: boolean;
}

export const MobileContainer = ({ children, className = "", withBottomPadding = true }: MobileContainerProps) => {
  return (
    <div
      className={`tab-container w-full min-h-screen bg-background ${className}`}
      style={{
        position: 'relative',
        paddingBottom: withBottomPadding ? 'calc(90px + env(safe-area-inset-bottom))' : '0px'
      }}
    >
      {children}
    </div>
  );
};