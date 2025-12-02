import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { RestorePurchasesButton } from "./RestorePurchasesButton";
import { toast } from "sonner";

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PaywallModal = ({ isOpen, onClose }: PaywallModalProps) => {
    const { currentOffering, purchasePackage, isPremium, isLoading } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (isPremium) {
            onClose();
        }
    }, [isPremium, onClose]);

    const handlePurchase = async (pkg: any) => {
        setPurchasing(true);
        try {
            await purchasePackage(pkg);
            toast.success("Assinatura realizada com sucesso! Bem-vindo ao Premium.");
            onClose();
        } catch (error: any) {
            if (!error.userCancelled) {
                toast.error("Erro ao processar a compra. Tente novamente.");
            }
        } finally {
            setPurchasing(false);
        }
    };

    if (isLoading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Desbloqueie o Coach IA</DialogTitle>
                    <DialogDescription className="text-base">
                        Tenha um treinador inteligente disponível 24h para tirar dúvidas e ajustar seus treinos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        {[
                            "Tire dúvidas sobre exercícios a qualquer hora",
                            "Receba ajustes de treino instantâneos",
                            "Dicas de nutrição personalizadas",
                            "Análise de progresso avançada"
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="bg-green-500/10 p-1 rounded-full">
                                    <Check className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-sm">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4 mt-6">
                        {currentOffering?.availablePackages.map((pkg) => (
                            <Card
                                key={pkg.identifier}
                                className={`cursor-pointer hover:border-primary transition-colors relative overflow-hidden ${purchasing ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => handlePurchase(pkg)}
                            >
                                {pkg.packageType === 'ANNUAL' && (
                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-medium">
                                        Melhor Valor
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        {pkg.product.title}
                                        <span className="text-xl font-bold text-primary">
                                            {pkg.product.priceString}
                                        </span>
                                    </CardTitle>
                                    <CardDescription>
                                        {pkg.packageType === 'MONTHLY' ? 'Cobrado mensalmente' : 'Cobrado anualmente'}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}

                        {!currentOffering && (
                            <div className="text-center p-4 text-muted-foreground text-sm">
                                Nenhuma oferta disponível no momento.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2 items-center">
                    <div className="w-full text-center text-xs text-muted-foreground space-y-2">
                        <p>
                            A assinatura renova automaticamente a menos que seja cancelada pelo menos 24h antes do fim do período atual.
                        </p>
                        <div className="flex justify-center gap-4 pt-2">
                            <a
                                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                            >
                                Termos de Uso (EULA)
                            </a>
                            <a
                                href="/politica-privacidade"
                                target="_blank"
                                className="hover:underline"
                            >
                                Política de Privacidade
                            </a>
                        </div>
                    </div>
                    <div className="pt-2">
                        <RestorePurchasesButton />
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
