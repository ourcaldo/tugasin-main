/**
 * React Hooks for Security Features
 * Provides React hooks for CSRF protection and rate limiting
 */

import { useState, useEffect, useCallback } from 'react';
import { csrfProtection } from './csrf-protection';
import { formRateLimiter, generateClientId, RATE_LIMIT_CONFIGS } from './rate-limiter';

/**
 * React hook for CSRF protection
 */
export function useCSRFProtection(formType: string) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Generate token on mount
    const newToken = csrfProtection.generateToken(formType);
    setToken(newToken);

    // Set up token refresh interval (refresh every 25 minutes)
    const interval = setInterval(() => {
      const refreshedToken = csrfProtection.refreshToken(formType);
      if (refreshedToken) {
        setToken(refreshedToken);
      }
    }, 25 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [formType]);

  const validateSubmission = useCallback((submittedToken: string): boolean => {
    return csrfProtection.validateToken(submittedToken, formType);
  }, [formType]);

  return {
    token,
    validateSubmission,
    refreshToken: () => {
      const newToken = csrfProtection.refreshToken(formType);
      setToken(newToken);
      return newToken;
    }
  };
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(formType: keyof typeof RATE_LIMIT_CONFIGS) {
  const [status, setStatus] = useState<{
    canSubmit: boolean;
    retryAfter: number;
    remaining: number;
  }>({
    canSubmit: true,
    retryAfter: 0,
    remaining: RATE_LIMIT_CONFIGS[formType].maxAttempts
  });

  const checkLimit = useCallback(() => {
    const clientId = generateClientId();
    const key = `${formType}_${clientId}`;
    const result = formRateLimiter.checkLimit(key, RATE_LIMIT_CONFIGS[formType]);
    
    setStatus({
      canSubmit: result.allowed,
      retryAfter: result.retryAfter || 0,
      remaining: result.remaining
    });

    return result;
  }, [formType]);

  const resetLimit = useCallback(() => {
    const clientId = generateClientId();
    const key = `${formType}_${clientId}`;
    formRateLimiter.reset(key);
    
    setStatus({
      canSubmit: true,
      retryAfter: 0,
      remaining: RATE_LIMIT_CONFIGS[formType].maxAttempts
    });
  }, [formType]);

  return {
    ...status,
    checkLimit,
    resetLimit
  };
}

/**
 * Combined hook for form security (CSRF + Rate Limiting)
 */
export function useFormSecurity(formType: keyof typeof RATE_LIMIT_CONFIGS) {
  const csrf = useCSRFProtection(formType);
  const rateLimit = useRateLimit(formType);

  const validateSubmission = useCallback((submittedToken: string) => {
    // Check rate limit first
    const rateLimitResult = rateLimit.checkLimit();
    if (!rateLimitResult.allowed) {
      return {
        valid: false,
        error: `Too many submissions. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`,
        type: 'rate_limit' as const
      };
    }

    // Check CSRF token
    const csrfValid = csrf.validateSubmission(submittedToken);
    if (!csrfValid) {
      return {
        valid: false,
        error: 'Invalid security token. Please refresh the page and try again.',
        type: 'csrf' as const
      };
    }

    return {
      valid: true,
      type: 'success' as const
    };
  }, [csrf, rateLimit]);

  return {
    csrfToken: csrf.token,
    canSubmit: rateLimit.canSubmit,
    retryAfter: rateLimit.retryAfter,
    remaining: rateLimit.remaining,
    validateSubmission,
    refreshCSRF: csrf.refreshToken,
    resetRateLimit: rateLimit.resetLimit
  };
}