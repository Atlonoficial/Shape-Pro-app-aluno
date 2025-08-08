import { ShapeProLogo } from '@/components/ui/ShapeProLogo';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/44934fca-7868-4c3b-ac23-e51f6e1619f0.png" 
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