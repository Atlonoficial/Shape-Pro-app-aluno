import React from 'react';

interface StudentLayoutProps {
    children: React.ReactNode;
    bottomNav?: React.ReactNode;
}

export const StudentLayout = ({ children, bottomNav }: StudentLayoutProps) => {
    return (
        <div className="min-h-[100dvh] w-full bg-background">
            {/* Content Area - Scrollable with padding for fixed bottom nav */}
            <main className="min-h-[100dvh] overflow-y-auto scrollbar-hide overscroll-y-contain pt-[env(safe-area-inset-top)] pb-[calc(72px+env(safe-area-inset-bottom))]">
                {children}
            </main>

            {/* Bottom Navigation - Fixed position via CSS class */}
            {bottomNav && (
                <div className="pb-[env(safe-area-inset-bottom)]">
                    {bottomNav}
                </div>
            )}
        </div>
    );
};
