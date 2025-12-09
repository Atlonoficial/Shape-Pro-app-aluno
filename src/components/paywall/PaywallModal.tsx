import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { RestorePurchasesButton } from "./RestorePurchasesButton";
import { toast } from "sonner";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// URL da Política de Privacidade - deve ser uma URL pública acessível
const PRIVACY_POLICY_URL = "https://shapepro.app/politica-privacidade";
const EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

// Helper para obter informações de duração do pacote
const getSubscriptionDuration = (packageType: string): { duration: string; period: string } => {
    switch (packageType) {
        case 'WEEKLY':
            return { duration: '1 semana', period: '/semana' };
        case 'MONTHLY':
            return { duration: '1 mês', period: '/mês' };
        case 'TWO_MONTH':
            return { duration: '2 meses', period: '/2 meses' };
        case 'THREE_MONTH':
            return { duration: '3 meses', period: '/3 meses' };
        case 'SIX_MONTH':
            return { duration: '6 meses', period: '/6 meses' };
        case 'ANNUAL':
            return { duration: '12 meses (1 ano)', period: '/ano' };
        case 'LIFETIME':
            return { duration: 'Vitalício', period: '' };
        default:
            return { duration: '1 mês', period: '/mês' };
    }
};

export const PaywallModal = ({ isOpen, onClose }: PaywallModalProps) => {
    const { currentOffering, purchasePackage, isPremium, isLoading } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (isPremium) {
            onClose();
        }
    }, [isPremium, onClose]);

    const handlePurchase = async (pkg: any) => {
        console.log("[PaywallModal] 🛒 Iniciando compra:", pkg.identifier);
        setPurchasing(true);
        try {
            await purchasePackage(pkg);
            console.log("[PaywallModal] ✅ Compra realizada com sucesso");
            toast.success("Assinatura realizada com sucesso! Bem-vindo ao Premium.");
            onClose();
        } catch (error: any) {
            console.error("[PaywallModal] ❌ Erro na compra:", JSON.stringify(error, null, 2));

            if (!error.userCancelled) {
                // Mensagem mais informativa baseada no tipo de erro
                const errorCode = error.code || error.errorCode || '';
                const errorMessage = error.message || error.readableErrorCode || '';

                console.error("[PaywallModal] Código:", errorCode, "Mensagem:", errorMessage);

                if (errorMessage.toLowerCase().includes('network') || errorCode === 'NETWORK_ERROR') {
                    toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
                } else if (errorMessage.toLowerCase().includes('invalid') || errorCode === 'INVALID_PRODUCT_IDENTIFIERS') {
                    toast.error("Produto não disponível no momento. Tente novamente mais tarde.");
                } else if (errorCode === 'STORE_PROBLEM') {
                    toast.error("Problema com a loja. Verifique se você está logado na App Store.");
                } else {
                    toast.error("Erro ao processar a compra. Tente novamente.");
                }
            }
        } finally {
            setPurchasing(false);
        }
    };

    // Função para abrir links externos
    const openExternalLink = async (url: string) => {
        try {
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url });
            } else {
                window.open(url, '_blank', 'noreferrer');
            }
        } catch (error) {
            console.error("[PaywallModal] Erro ao abrir link:", error);
            window.open(url, '_blank', 'noreferrer');
        }
    };

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">Carregando ofertas...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

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
                        {currentOffering?.availablePackages.map((pkg) => {
                            const { duration, period } = getSubscriptionDuration(pkg.packageType);

                            return (
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
                                            <span>{pkg.product.title}</span>
                                            <span className="text-xl font-bold text-primary">
                                                {pkg.product.priceString}
                                                <span className="text-sm font-normal text-muted-foreground">{period}</span>
                                            </span>
                                        </CardTitle>
                                        <CardDescription>
                                            {pkg.packageType === 'LIFETIME'
                                                ? 'Pagamento único, acesso vitalício'
                                                : `Assinatura de ${duration}, renovada automaticamente`
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}

                        {(!currentOffering || currentOffering.availablePackages.length === 0) && (
                            <div className="text-center p-4 text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <AlertCircle className="w-6 h-6" />
                                <span>Nenhuma oferta disponível no momento.</span>
                                <span className="text-xs">Verifique sua conexão e tente novamente.</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2 items-center">
                    <div className="w-full text-center text-xs text-muted-foreground space-y-2">
                        <p>
                            A assinatura renova automaticamente a menos que seja cancelada pelo menos 24h antes do fim do período atual.
                        </p>
                        <p className="text-[10px]">
                            O pagamento será cobrado na sua conta do iTunes na confirmação da compra. A conta será cobrada para renovação dentro de 24h antes do fim do período atual. Você pode gerenciar e cancelar suas assinaturas nas configurações da sua conta na App Store após a compra.
                        </p>
                        <div className="flex justify-center gap-4 pt-2">
                            <button
                                onClick={() => openExternalLink(EULA_URL)}
                                className="hover:underline text-primary"
                            >
                                Termos de Uso (EULA)
                            </button>
                            <button
                                onClick={() => openExternalLink(PRIVACY_POLICY_URL)}
                                className="hover:underline text-primary"
                            >
                                Política de Privacidade
                            </button>
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
