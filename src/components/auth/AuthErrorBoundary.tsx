import React, { Component, ReactNode } from 'react';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    if (error.message.includes('useAuthContext must be used within an AuthProvider')) {
      console.error('[AuthErrorBoundary] Auth context error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <MobileContainer>
          <div className="flex flex-col items-center justify-center h-screen p-4">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro de Autenticação</h2>
            <p className="text-muted-foreground text-center mb-4">
              Houve um problema ao carregar suas informações de login.
            </p>
            <Button onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </div>
        </MobileContainer>
      );
    }

    return this.props.children;
  }
}
