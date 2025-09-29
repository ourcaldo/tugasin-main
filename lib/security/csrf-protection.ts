/**
 * CSRF Protection for Form Submissions
 * Provides client-side CSRF token generation and validation
 */

interface CSRFToken {
  token: string;
  timestamp: number;
  formType: string;
}

export class CSRFProtection {
  private readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
  private readonly storage = new Map<string, CSRFToken>();

  /**
   * Generate a new CSRF token for a form
   */
  generateToken(formType: string): string {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const csrfToken: CSRFToken = {
      token,
      timestamp: Date.now(),
      formType
    };

    // Store token with form type as key
    this.storage.set(formType, csrfToken);
    
    // Clean up expired tokens
    this.cleanup();
    
    return token;
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string, formType: string): boolean {
    const storedToken = this.storage.get(formType);
    
    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    if (Date.now() - storedToken.timestamp > this.TOKEN_EXPIRY) {
      this.storage.delete(formType);
      return false;
    }

    // Validate token matches
    if (storedToken.token !== token) {
      return false;
    }

    // Token is valid - remove it (one-time use)
    this.storage.delete(formType);
    return true;
  }

  /**
   * Check if a token exists and is valid for a form type
   */
  hasValidToken(formType: string): boolean {
    const storedToken = this.storage.get(formType);
    
    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    if (Date.now() - storedToken.timestamp > this.TOKEN_EXPIRY) {
      this.storage.delete(formType);
      return false;
    }

    return true;
  }

  /**
   * Get the current token for a form type (without consuming it)
   */
  getCurrentToken(formType: string): string | null {
    const storedToken = this.storage.get(formType);
    
    if (!storedToken) {
      return null;
    }

    // Check if token has expired
    if (Date.now() - storedToken.timestamp > this.TOKEN_EXPIRY) {
      this.storage.delete(formType);
      return null;
    }

    return storedToken.token;
  }

  /**
   * Refresh a token (extend its lifetime)
   */
  refreshToken(formType: string): string | null {
    const storedToken = this.storage.get(formType);
    
    if (!storedToken) {
      return null;
    }

    // Generate new token but keep same form type
    return this.generateToken(formType);
  }

  /**
   * Clean up expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [formType, token] of this.storage.entries()) {
      if (now - token.timestamp > this.TOKEN_EXPIRY) {
        this.storage.delete(formType);
      }
    }
  }

  /**
   * Clear all tokens (useful for logout)
   */
  clearAllTokens(): void {
    this.storage.clear();
  }

  /**
   * Get token expiry time for a form type
   */
  getTokenExpiry(formType: string): number | null {
    const storedToken = this.storage.get(formType);
    
    if (!storedToken) {
      return null;
    }

    return storedToken.timestamp + this.TOKEN_EXPIRY;
  }
}

// Singleton instance
export const csrfProtection = new CSRFProtection();

/**
 * Form validation with CSRF protection
 */
export function validateFormSubmission(
  formType: string,
  csrfToken: string,
  data: Record<string, any>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate CSRF token
  if (!csrfProtection.validateToken(csrfToken, formType)) {
    errors.push('Invalid security token. Please refresh the page and try again.');
  }

  // Additional security validations can be added here
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Note: React import should be at the top of files that use it
// This is a standalone utility that can be imported by React components