import React from 'react';

interface StudentLayoutProps {
    children: React.ReactNode;
    bottomNav?: React.ReactNode;
}

export const StudentLayout = ({ children, bottomNav }: StudentLayoutProps) => {
    return (
        <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background">
            {/* Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto scrollbar-hide overscroll-y-contain pt-[env(safe-area-inset-top)]">
                {children}
            </main>

            {/* Bottom Navigation Wrapper - Fixed */}
            {bottomNav && (
                <div className="flex-none border-t bg-card z-50 pb-[env(safe-area-inset-bottom)]">
                    {bottomNav}
                </div>
            )}
        </div>
    );
};
