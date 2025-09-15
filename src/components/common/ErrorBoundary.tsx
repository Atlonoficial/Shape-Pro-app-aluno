import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log structured error data
    console.error('🔥 ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({
      error,
      errorInfo
    });

    // Send error to analytics/monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Send to your error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') // if available
    };

    // Example: send to your analytics
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(() => {
        // Fail silently for error reporting
        console.warn('Failed to report error to analytics');
      });
    } catch {
      // Fail silently
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Algo deu errado!</p>
                  <p className="text-sm text-muted-foreground">
                    Ocorreu um erro inesperado na aplicação.
                  </p>
                  {this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-mono">
                        Detalhes técnicos
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
              >
                Recarregar Página
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}