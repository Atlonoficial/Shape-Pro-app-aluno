import { useState, useEffect } from 'react';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

export const LoadingScreen = () => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowError(true);
      logger.error('[LoadingScreen] Timeout: App não carregou em 8s. Possível problema de rede ou auth.');
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  if (showError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-4">
            O aplicativo está demorando muito para iniciar.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/11efc078-c8bc-4ac4-9d94-1e18b4e6a54d.png" 
            alt="Shape Pro - Consultoria Online" 
            className="h-20 w-auto mx-auto"
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Carregando...</p>
      </div>
    </div>
  );
};