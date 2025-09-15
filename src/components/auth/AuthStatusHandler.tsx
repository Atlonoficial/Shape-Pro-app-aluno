import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthStatusHandlerProps {
  status: 'loading' | 'success' | 'error';
  successMessage?: string;
  errorMessage?: string;
  redirectPath?: string;
  redirectDelay?: number;
  onRetry?: () => void;
}

export const AuthStatusHandler = ({
  status,
  successMessage = 'Operação realizada com sucesso!',
  errorMessage = 'Ocorreu um erro. Tente novamente.',
  redirectPath = '/',
  redirectDelay = 3000,
  onRetry
}: AuthStatusHandlerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    if (status === 'success') {
      toast({
        title: "Sucesso!",
        description: successMessage,
      });

      // Auto redirect após delay configurado
      const timeoutId = setTimeout(() => {
        navigate(redirectPath);
      }, redirectDelay);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }

    if (status === 'error') {
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [status, successMessage, errorMessage, redirectPath, navigate, toast, redirectDelay]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">Processando...</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center">{successMessage}</p>
            <p className="text-sm text-muted-foreground">
              Redirecionando em {countdown} segundos...
            </p>
            <Button 
              onClick={() => navigate(redirectPath)}
              className="w-full"
            >
              Continuar Agora
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-destructive">{errorMessage}</p>
            <div className="flex flex-col w-full space-y-2">
              {onRetry && (
                <Button onClick={onRetry} className="w-full">
                  Tentar Novamente
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};