import { ShapeProLogo } from '@/components/ui/ShapeProLogo';

export const LoadingScreen = () => {
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