import { ReactNode, useState } from 'react';
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { PaywallModal } from "./PaywallModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PremiumGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const PremiumGuard = ({ children, fallback }: PremiumGuardProps) => {
    const { isPremium, isLoading } = useRevenueCat();
    const [showPaywall, setShowPaywall] = useState(false);

    if (isLoading) {
        return null; // Or a loading skeleton
    }

    if (isPremium) {
        return <>{children}</>;
    }

    // Default fallback if none provided: A locked state that opens the paywall
    if (!fallback) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Funcionalidade Premium</h3>
                <p className="text-muted-foreground max-w-xs">
                    Esta funcionalidade é exclusiva para assinantes do Prass Trainer Premium.
                </p>
                <Button onClick={() => setShowPaywall(true)} className="w-full max-w-xs">
                    Desbloquear Agora
                </Button>

                <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
            </div>
        );
    }

    return <>{fallback}</>;
};
