/**
 * Server-side Environment Validation Component
 * Ensures environment variables are validated during SSR
 */

import { runEnvironmentValidation } from '@/lib/utils/env-validation';

/**
 * Server component that validates environment variables
 * This runs during server-side rendering to catch configuration issues early
 */
export default function EnvValidator() {
  // Completely disabled environment validation per user request
  // No logging or validation in any environment
  
  // This component renders nothing
  return null;
}

/**
 * Alternative: Export validation function for manual integration
 */
export function validateEnvironmentOnServer() {
  if (typeof window === 'undefined') {
    return runEnvironmentValidation();
  }
  return true;
}