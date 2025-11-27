import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ContentLockProps {
    title?: string;
    message?: string;
}

export const ContentLock = ({
    title = "Recurso Indisponível",
    message = "Este recurso não está disponível para sua conta atual. Seu treinador pode habilitar recursos adicionais conforme seu acompanhamento."
}: ContentLockProps) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] space-y-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                <Lock className="w-10 h-10 text-muted-foreground" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {message}
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    size="lg"
                    className="w-full font-semibold"
                    onClick={() => navigate("/assinaturas-planos")}
                >
                    Verificar Acesso
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/chat")}
                >
                    Falar com Professor
                </Button>
            </div>
        </div>
    );
};
