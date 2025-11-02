import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      // SEMPRE mostrar algo em vez de null
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center text-white max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro ao Carregar App</h2>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white w-full"
            >
              Recarregar App
            </Button>
            {import.meta.env.DEV && (
              <details className="mt-4 text-left text-xs text-gray-500">
                <summary className="cursor-pointer">Detalhes Técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-gray-900 p-2 rounded">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}