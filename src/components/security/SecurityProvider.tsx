import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { SecurityValidator } from '@/lib/security/inputValidation';

interface SecurityContextType {
  validateInput: (input: string, options?: {
    maxLength?: number;
    allowHtml?: boolean;
    strictMode?: boolean;
  }) => { isValid: boolean; sanitized: string; errors: string[] };
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  };
  validateFile: (file: { name: string; size: number; type: string }) => {
    isValid: boolean;
    errors: string[];
  };
  rateLimitCheck: (action: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

// Client-side rate limiting storage
const rateLimitStorage: { [key: string]: { count: number; resetTime: number } } = {};

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize security measures
    setSecurityHeaders();
    setIsInitialized(true);
  }, []);

  const setSecurityHeaders = () => {
    // Set CSP meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:;";
      document.head.appendChild(cspMeta);
    }
  };

  const validateInput = (input: string, options = {}) => {
    return SecurityValidator.validateTextInput(input, options);
  };

  const validateEmail = (email: string): boolean => {
    return SecurityValidator.validateEmail(email);
  };

  const validatePassword = (password: string) => {
    return SecurityValidator.validatePassword(password);
  };

  const validateFile = (file: { name: string; size: number; type: string }) => {
    return SecurityValidator.validateFileUpload(file);
  };

  const rateLimitCheck = async (action: string): Promise<boolean> => {
    const key = `${action}_${Date.now()}`;
    const now = Date.now();
    
    // Clean old entries
    Object.keys(rateLimitStorage).forEach(storageKey => {
      if (rateLimitStorage[storageKey].resetTime < now) {
        delete rateLimitStorage[storageKey];
      }
    });

    // Check rate limit for this action
    const actionKeys = Object.keys(rateLimitStorage).filter(k => k.startsWith(action));
    if (actionKeys.length >= 10) { // Max 10 attempts per action per minute
      return false;
    }

    // Store this attempt
    rateLimitStorage[key] = {
      count: 1,
      resetTime: now + 60000 // 1 minute
    };

    return true;
  };

  if (!isInitialized) {
    return <div>Initializing security...</div>;
  }

  return (
    <SecurityContext.Provider value={{
      validateInput,
      validateEmail,
      validatePassword,
      validateFile,
      rateLimitCheck
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

// Security hook for components
export const useSecurity = () => {
  const context = useSecurityContext();
  
  const [securityState, setSecurityState] = useState({
    isSecure: true,
    lastCheck: Date.now()
  });

  useEffect(() => {
    // Periodic security checks
    const interval = setInterval(() => {
      performSecurityCheck();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const performSecurityCheck = () => {
    // Check for suspicious activity
    const suspiciousPatterns = [
      'eval(',
      'Function(',
      'document.write',
      'innerHTML =',
      'javascript:',
      'data:text/html'
    ];

    // Check if any suspicious code exists in global scope
    const globalKeys = Object.keys(window);
    const hasSuspiciousGlobals = globalKeys.some(key => 
      suspiciousPatterns.some(pattern => key.includes(pattern))
    );

    setSecurityState({
      isSecure: !hasSuspiciousGlobals,
      lastCheck: Date.now()
    });
  };

  return {
    ...context,
    securityState,
    performSecurityCheck
  };
};

// Component wrapper for enhanced security
export const withSecurity = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => {
    const { securityState } = useSecurity();

    if (!securityState.isSecure) {
      console.warn('Security check failed - component blocked');
      return <div>Security check failed. Please refresh the page.</div>;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withSecurity(${Component.displayName || Component.name})`;
  return WrappedComponent;
};