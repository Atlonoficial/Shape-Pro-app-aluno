import { z } from 'zod';

// Security-focused validation utilities
export class SecurityValidator {
  // SQL Injection prevention patterns
  private static SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(;|\|\||&&|--|\/\*|\*\/)/,
    /(\b(xp_|sp_|sys\.))/i,
    /(char\(|ascii\(|substring\()/i
  ];

  // XSS prevention patterns
  private static XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];

  // Path traversal patterns
  private static PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.\%2f/gi,
    /\.\.\%5c/gi
  ];

  /**
   * Validates and sanitizes text input against various attack vectors
   */
  static validateTextInput(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    strictMode?: boolean;
  } = {}): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input;

    // Length validation
    if (options.maxLength && input.length > options.maxLength) {
      errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
    }

    // SQL Injection check
    if (this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
      errors.push('Input contains potentially dangerous SQL patterns');
      if (options.strictMode) {
        return { isValid: false, sanitized: '', errors };
      }
    }

    // XSS check
    if (!options.allowHtml && this.XSS_PATTERNS.some(pattern => pattern.test(input))) {
      errors.push('Input contains potentially dangerous scripts');
      // Sanitize by removing dangerous patterns
      this.XSS_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // Path traversal check
    if (this.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))) {
      errors.push('Input contains path traversal patterns');
      // Remove path traversal patterns
      this.PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // Basic HTML encoding if HTML not allowed
    if (!options.allowHtml) {
      sanitized = this.htmlEncode(sanitized);
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validates UUID format
   */
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validates email format with strict regex
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validates phone number format
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validates URL format with security checks
   */
  static validateURL(url: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const parsedUrl = new URL(url);
      
      // Check for dangerous protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.push('Only HTTP and HTTPS protocols are allowed');
      }

      // Check for localhost/private IPs in production
      const hostname = parsedUrl.hostname.toLowerCase();
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) || 
          hostname.startsWith('192.168.') || 
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
        errors.push('Private/localhost URLs are not allowed');
      }

      // Check for suspicious patterns
      if (url.includes('javascript:') || url.includes('data:')) {
        errors.push('Suspicious URL patterns detected');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates file upload security
   */
  static validateFileUpload(file: { name: string; size: number; type: string }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // File size validation (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB limit');
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    // File name validation
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
    const hasExt = dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (hasExt) {
      errors.push('Dangerous file extension detected');
    }

    // File name length and characters
    if (file.name.length > 255) {
      errors.push('File name too long');
    }

    if (!/^[a-zA-Z0-9._\-\s]+$/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * HTML encoding for XSS prevention
   */
  private static htmlEncode(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Password strength validation
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add uppercase letters (A-Z)');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add lowercase letters (a-z)');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add numbers (0-9)');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
      suggestions.push('Add special characters (@$!%*?&)');
    } else {
      score += 1;
    }

    // Common password check
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', '12345678', '1234567890', 'admin'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      suggestions.push('Use a unique password');
      score = Math.max(0, score - 2);
    }

    // Length bonus
    if (password.length >= 12) {
      score += 1;
    }
    if (password.length >= 16) {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      score: Math.min(score, 5),
      errors,
      suggestions
    };
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(
    attempts: number,
    timeWindow: number,
    maxAttempts: number
  ): { isAllowed: boolean; resetTime?: number } {
    if (attempts >= maxAttempts) {
      return {
        isAllowed: false,
        resetTime: Date.now() + timeWindow
      };
    }

    return { isAllowed: true };
  }
}

// Validation middleware for API calls
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: boolean; data?: T; errors?: string[] } => {
    try {
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  };
};

// Security headers for responses
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
  };
};