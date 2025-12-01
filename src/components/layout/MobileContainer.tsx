import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  withBottomPadding?: boolean;
}

export const MobileContainer = ({ children, className = "", withBottomPadding = true }: MobileContainerProps) => {
  return (
    <div
      className={`tab-container w-full min-h-screen bg-background pt-[env(safe-area-inset-top)] ${className}`}
      style={{
        position: 'relative',
        paddingBottom: withBottomPadding ? 'calc(90px + env(safe-area-inset-bottom))' : '0px'
      }}
    >
      {children}
    </div>
  );
};