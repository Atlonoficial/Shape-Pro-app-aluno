import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const LoadingScreen = () => {
  const [showError, setShowError] = useState(false);
  const [countdown, setCountdown] = useState(15);
  
  useEffect(() => {
    // Countdown visual
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Timeout de 15s para mostrar erro
    const timeout = setTimeout(() => {
      setShowError(true);
    }, 15000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(countdownInterval);
    };
  }, []);
  
  if (showError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Carregamento Demorado</h1>
          <p className="text-gray-400 text-sm">
            O app está demorando mais que o esperado para carregar.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            🔄 Tentar Novamente
          </Button>
          <Button 
            onClick={async () => {
              // Limpar TUDO
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
              }
              localStorage.clear();
              
              // Se nativo, limpar Preferences também
              try {
                const { Capacitor } = await import('@capacitor/core');
                if (Capacitor.isNativePlatform()) {
                  const { Preferences } = await import('@capacitor/preferences');
                  await Preferences.clear();
                }
              } catch (e) {
                // Ignorar erro
              }
              
              window.location.reload();
            }}
            variant="outline"
            className="w-full text-white border-gray-700"
          >
            🗑️ Limpar Cache e Reiniciar
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ backgroundColor: '#000000' }}
    >
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/11efc078-c8bc-4ac4-9d94-1e18b4e6a54d.png" 
            alt="Shape Pro"
            className="h-20 w-auto mx-auto"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent mx-auto"></div>
        <p className="text-white mt-6 text-lg font-semibold">Carregando...</p>
        <p className="text-gray-400 mt-2 text-sm">Inicializando aplicativo...</p>
        {countdown > 0 && countdown < 15 && (
          <p className="text-gray-500 mt-4 text-xs">
            {countdown}s restantes...
          </p>
        )}
      </div>
    </div>
  );
};
