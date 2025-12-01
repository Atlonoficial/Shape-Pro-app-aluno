import React, { useEffect, useState } from 'react';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { getUserProfile } from '@/lib/supabase';

interface SubscriptionGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, fallback }) => {
    const { hasActiveSubscription, loading, status, planName, teacherId } = useActiveSubscription();
    const navigate = useNavigate();
    const [teacherPhone, setTeacherPhone] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeacherPhone = async () => {
            if (teacherId) {
                const profile = await getUserProfile(teacherId);
                if (profile?.phone) {
                    setTeacherPhone(profile.phone);
                }
            }
        };
        fetchTeacherPhone();
    }, [teacherId]);

    const handleContactTeacher = () => {
        if (teacherPhone) {
            // Neutral message for support only - Unified for all platforms
            const message = status === 'expired'
                ? 'Olá, preciso de ajuda com meu acesso.'
                : 'Olá, gostaria de solicitar meu plano de treino.';

            const whatsappUrl = `https://wa.me/${teacherPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            navigate('/chat');
        }
    };

    if (loading) {
        return <>{children}</>; // Show content (skeleton usually handles loading) or null
    }

    if (hasActiveSubscription) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // CASE 1: Free Plan / No Plan (Active but not paid)
    // User requested a "subtle" message similar to Nutrition section, without button
    if (status === 'active' && planName === 'free') {
        return (
            <div className="p-4 pt-8 pb-safe-4xl">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Nenhum plano encontrado</h2>
                    <p className="text-muted-foreground mb-4">
                        Entre em contato com o seu professor para receber o seu plano de treino e dieta.
                    </p>
                </div>
            </div>
        );
    }

    // CASE 2: Expired Plan
    // Keep the "Blocked" format but update the button action
    return (
        <div className="p-4 pt-8 pb-safe-4xl flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md p-6 text-center space-y-6 border-destructive/20 bg-destructive/5">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Acesso Bloqueado</h2>
                    <p className="text-muted-foreground">
                        Seu acesso a este conteúdo não está ativo. Entre em contato com seu treinador para mais informações.
                    </p>
                </div>

                <div className="space-y-3">
                    {/* Unified behavior: Always show neutral contact info, never "Renew" buttons */}

                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground">
                            Para regularizar seu acesso, entre em contato diretamente com seu treinador.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleContactTeacher}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Falar com Treinador
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                    <AlertCircle className="w-3 h-3" />
                    <span>Dúvidas? Entre em contato com o suporte.</span>
                </div>
            </Card>
        </div>
    );
};
