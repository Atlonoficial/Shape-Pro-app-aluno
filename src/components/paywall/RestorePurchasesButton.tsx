import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { toast } from "sonner";

export const RestorePurchasesButton = () => {
    const { restorePurchases } = useRevenueCat();
    const [loading, setLoading] = useState(false);

    const handleRestore = async () => {
        setLoading(true);
        try {
            await restorePurchases();
            toast.success("Compras restauradas com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível restaurar as compras.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleRestore}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-primary"
        >
            {loading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Restaurar Compras
        </Button>
    );
};
