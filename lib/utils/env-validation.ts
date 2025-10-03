/**
 * Runtime Environment Variable Validation System
 * Ensures proper application configuration at startup with clear error reporting
 */

interface EnvValidationRule {
  name: string;
  required: boolean;
  type: 'string' | 'url' | 'email' | 'phone' | 'boolean' | 'number';
  description: string;
  defaultValue?: string;
  pattern?: RegExp;
  validate?: (value: string) => boolean;
}

/**
 * Environment variable validation rules
 * Add new environment variables here with their validation requirements
 */
const ENV_VALIDATION_RULES: EnvValidationRule[] = [
  // Site Configuration
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    type: 'url',
    description: 'Main site URL for canonical links and SEO',
    defaultValue: 'https://tugasin.com'
  },

  // CMS Configuration
  {
    name: 'NEXT_PUBLIC_CMS_ENDPOINT',
    required: false,
    type: 'url',
    description: 'API endpoint for content management system',
    defaultValue: 'https://cms.tugasin.me'
  },
  {
    name: 'CMS_USERNAME',
    required: false,
    type: 'string',
    description: 'CMS authentication username (server-side only)'
  },
  {
    name: 'CMS_PASSWORD',
    required: false,
    type: 'string',
    description: 'CMS authentication password (server-side only)'
  },
  {
    name: 'CMS_TIMEOUT',
    required: false,
    type: 'number',
    description: 'CMS request timeout in milliseconds',
    defaultValue: '10000'
  },

  // Contact Information
  {
    name: 'NEXT_PUBLIC_CONTACT_PHONE',
    required: true,
    type: 'phone',
    description: 'Contact phone number with country code',
    defaultValue: '+6281234567890',
    pattern: /^\+[1-9]\d{1,14}$/
  },
  {
    name: 'NEXT_PUBLIC_CONTACT_EMAIL',
    required: true,
    type: 'email',
    description: 'Contact email address',
    defaultValue: 'info@tugasin.com'
  },
  {
    name: 'NEXT_PUBLIC_WHATSAPP_URL',
    required: true,
    type: 'url',
    description: 'WhatsApp contact URL',
    defaultValue: 'https://wa.me/6281234567890',
    pattern: /^https:\/\/wa\.me\/\d+$/
  },
  {
    name: 'NEXT_PUBLIC_CONTACT_ADDRESS',
    required: true,
    type: 'string',
    description: 'Business address or location',
    defaultValue: 'Jakarta, Indonesia'
  },
  {
    name: 'NEXT_PUBLIC_BUSINESS_HOURS',
    required: true,
    type: 'string',
    description: 'Business operating hours',
    defaultValue: '24/7'
  },

  // Image Configuration
  {
    name: 'NEXT_PUBLIC_FALLBACK_IMAGE_URL',
    required: false,
    type: 'url',
    description: 'Default fallback image URL for blog posts and services'
  },
  {
    name: 'NEXT_PUBLIC_FALLBACK_IMAGE_DOMAINS',
    required: false,
    type: 'string',
    description: 'Comma-separated list of allowed fallback image domains',
    defaultValue: 'images.unsplash.com'
  },
  {
    name: 'NEXT_PUBLIC_CMS_IMAGE_DOMAINS',
    required: false,
    type: 'string',
    description: 'Comma-separated list of CMS image domains',
    defaultValue: 'cms.tugasin.me'
  },

  // Development Configuration
  {
    name: 'NEXT_PUBLIC_ENABLE_CMS',
    required: false,
    type: 'boolean',
    description: 'Enable CMS integration (true/false)',
    defaultValue: 'true'
  },
  {
    name: 'NEXT_PUBLIC_DEBUG_MODE',
    required: false,
    type: 'boolean',
    description: 'Enable debug logging (true/false)',
    defaultValue: 'false'
  },
  {
    name: 'NEXT_PUBLIC_USE_FALLBACK_DATA',
    required: false,
    type: 'boolean',
    description: 'Use fallback data when CMS is unavailable (true/false)',
    defaultValue: 'false'
  },

  // SEO Configuration
  {
    name: 'NEXT_PUBLIC_DEFAULT_OG_IMAGE',
    required: false,
    type: 'string',
    description: 'Default Open Graph image path',
    defaultValue: '/og-default.jpg'
  },

  // Analytics Configuration
  {
    name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    required: false,
    type: 'string',
    description: 'Google Analytics 4 Measurement ID (G-XXXXXXXXXX)',
    pattern: /^G-[A-Z0-9]{10}$/
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    type: 'url',
    description: 'Sentry DSN for error monitoring'
  },

  // Security Configuration
  {
    name: 'REVALIDATION_SECRET',
    required: false,
    type: 'string',
    description: 'Secret key for ISR revalidation endpoint security',
    defaultValue: 'dev-revalidation-secret'
  },

  // Cache Configuration
  {
    name: 'MEMORY_CACHE_MAX_SIZE_MB',
    required: false,
    type: 'number',
    description: 'Maximum memory cache size in megabytes',
    defaultValue: '50'
  },
  {
    name: 'MEMORY_CACHE_MAX_ENTRIES',
    required: false,
    type: 'number',
    description: 'Maximum number of memory cache entries',
    defaultValue: '1000'
  },
  {
    name: 'MEMORY_CACHE_DEFAULT_TTL_MINUTES',
    required: false,
    type: 'number',
    description: 'Default TTL for memory cache entries in minutes',
    defaultValue: '5'
  },

  // Revalidation Configuration
  {
    name: 'REVALIDATION_HOMEPAGE_INTERVAL',
    required: false,
    type: 'number',
    description: 'Homepage revalidation interval in seconds',
    defaultValue: '3600'
  },
  {
    name: 'REVALIDATION_BLOG_POST_INTERVAL',
    required: false,
    type: 'number',
    description: 'Blog post revalidation interval in seconds',
    defaultValue: '300'
  },
  {
    name: 'REVALIDATION_BLOG_LISTING_INTERVAL',
    required: false,
    type: 'number',
    description: 'Blog listing revalidation interval in seconds',
    defaultValue: '300'
  },

  // Social Media URLs
  {
    name: 'NEXT_PUBLIC_INSTAGRAM_URL',
    required: false,
    type: 'url',
    description: 'Instagram profile URL'
  },
  {
    name: 'NEXT_PUBLIC_TWITTER_URL',
    required: false,
    type: 'url',
    description: 'Twitter profile URL'
  },
  {
    name: 'NEXT_PUBLIC_LINKEDIN_URL',
    required: false,
    type: 'url',
    description: 'LinkedIn profile URL'
  }
];

/**
 * Validation error details
 */
interface ValidationError {
  variable: string;
  error: string;
  suggestion: string;
  required: boolean;
}

/**
 * Environment validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate individual environment variable
 */
function validateEnvironmentVariable(rule: EnvValidationRule): ValidationError | null {
  const value = process.env[rule.name];
  
  // Check if required variable is missing
  if (rule.required && (!value || value.trim() === '')) {
    return {
      variable: rule.name,
      error: `Required environment variable is missing or empty`,
      suggestion: `Set ${rule.name}=${rule.defaultValue || 'your_value_here'} in your .env file`,
      required: true
    };
  }

  // Skip validation if optional variable is not set
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  // Type-specific validation
  switch (rule.type) {
    case 'url':
      try {
        const url = new URL(trimmedValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        return {
          variable: rule.name,
          error: `Invalid URL format`,
          suggestion: `Use a valid URL like: https://example.com`,
          required: rule.required
        };
      }
      break;

    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedValue)) {
        return {
          variable: rule.name,
          error: `Invalid email format`,
          suggestion: `Use a valid email like: user@example.com`,
          required: rule.required
        };
      }
      break;

    case 'phone':
      if (rule.pattern && !rule.pattern.test(trimmedValue)) {
        return {
          variable: rule.name,
          error: `Invalid phone number format`,
          suggestion: `Use international format like: +6281234567890`,
          required: rule.required
        };
      }
      break;

    case 'boolean':
      if (!['true', 'false'].includes(trimmedValue.toLowerCase())) {
        return {
          variable: rule.name,
          error: `Invalid boolean value`,
          suggestion: `Use either 'true' or 'false'`,
          required: rule.required
        };
      }
      break;

    case 'number':
      if (isNaN(Number(trimmedValue))) {
        return {
          variable: rule.name,
          error: `Invalid number format`,
          suggestion: `Use a valid number like: 10000`,
          required: rule.required
        };
      }
      break;
  }

  // Custom pattern validation
  if (rule.pattern && !rule.pattern.test(trimmedValue)) {
    return {
      variable: rule.name,
      error: `Value does not match required pattern`,
      suggestion: `Check the format requirement for ${rule.name}`,
      required: rule.required
    };
  }

  // Custom validation function
  if (rule.validate && !rule.validate(trimmedValue)) {
    return {
      variable: rule.name,
      error: `Custom validation failed`,
      suggestion: `Check the value for ${rule.name}`,
      required: rule.required
    };
  }

  return null;
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const rule of ENV_VALIDATION_RULES) {
    const error = validateEnvironmentVariable(rule);
    if (error) {
      if (error.required) {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ Environment validation passed successfully');
    
    if (result.warnings.length > 0) {
      lines.push('\n⚠️  Warnings:');
      result.warnings.forEach(warning => {
        lines.push(`  • ${warning.variable}: ${warning.error}`);
        lines.push(`    💡 ${warning.suggestion}`);
      });
    }
  } else {
    lines.push('❌ Environment validation failed');
    lines.push('\n🚨 Errors:');
    result.errors.forEach(error => {
      lines.push(`  • ${error.variable}: ${error.error}`);
      lines.push(`    💡 ${error.suggestion}`);
    });

    if (result.warnings.length > 0) {
      lines.push('\n⚠️  Additional warnings:');
      result.warnings.forEach(warning => {
        lines.push(`  • ${warning.variable}: ${warning.error}`);
        lines.push(`    💡 ${warning.suggestion}`);
      });
    }

    lines.push('\n📋 To fix these issues:');
    lines.push('1. Create or update your .env file');
    lines.push('2. Copy .env.example as a starting point if needed');
    lines.push('3. Set the required environment variables');
    lines.push('4. Restart the application');
  }

  return lines.join('\n');
}

/**
 * Run environment validation and handle results
 * Call this during application startup
 */
export function runEnvironmentValidation(): boolean {
  const result = validateEnvironment();

  // Only validate server-side (Node.js environment) without logging
  if (typeof window === 'undefined') {
    // In production, fail fast on validation errors
    if (!result.valid && process.env.NODE_ENV === 'production') {
      console.error('💥 Application startup failed due to environment validation errors');
      throw new Error('Environment validation failed. Check the logs above for details.');
    }
  }

  return result.valid;
}

/**
 * Get environment variable with validation
 * Provides type-safe access to validated environment variables
 */
export function getValidatedEnv(name: string): string | undefined {
  const rule = ENV_VALIDATION_RULES.find(r => r.name === name);
  if (!rule) {
    console.warn(`Environment variable ${name} is not in validation rules`);
    return process.env[name];
  }

  const error = validateEnvironmentVariable(rule);
  if (error && rule.required) {
    throw new Error(`Invalid required environment variable ${name}: ${error.error}`);
  }

  return process.env[name] || rule.defaultValue;
}