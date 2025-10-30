import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-6">
            <img 
              src="/lovable-uploads/11efc078-c8bc-4ac4-9d94-1e18b4e6a54d.png" 
              alt="Shape Pro - Consultoria Online" 
              className="h-16 w-auto mx-auto"
            />
          </div>
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
};