/**
 * Security Headers Utility
 * Provides configurable security headers for Next.js application
 */

interface SecurityHeaderConfig {
  enableHSTS: boolean;
  hstsMaxAge: number;
  scriptSrc: string;
  styleSrc: string;
  fontSrc: string;
  connectSrc: string;
  additionalImageDomains: string[];
}

/**
 * Get security configuration from environment variables
 */
export function getSecurityConfig(): SecurityHeaderConfig {
  return {
    enableHSTS: process.env.SECURITY_ENABLE_HSTS !== 'false',
    hstsMaxAge: parseInt(process.env.SECURITY_HSTS_MAX_AGE || '63072000'),
    scriptSrc: process.env.SECURITY_CSP_SCRIPT_SRC || "'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
    styleSrc: process.env.SECURITY_CSP_STYLE_SRC || "'self' 'unsafe-inline' https://fonts.googleapis.com",
    fontSrc: process.env.SECURITY_CSP_FONT_SRC || "'self' https://fonts.gstatic.com",
    connectSrc: process.env.SECURITY_CSP_CONNECT_SRC || "'self' https://cms.tugasin.me https://va.vercel-scripts.com",
    additionalImageDomains: (process.env.NEXT_PUBLIC_ADDITIONAL_IMAGE_DOMAINS?.split(',') || []).filter(Boolean),
  };
}

/**
 * Generate Content Security Policy string
 */
export function generateCSP(config: SecurityHeaderConfig): string {
  const imageDomains = config.additionalImageDomains
    .map(domain => `https://${domain.trim()}`)
    .join(' ');

  return [
    "default-src 'self'",
    `script-src ${config.scriptSrc}`,
    `style-src ${config.styleSrc}`,
    `font-src ${config.fontSrc}`,
    `img-src 'self' blob: data: https://images.unsplash.com https://cms.tugasin.me ${imageDomains}`.trim(),
    `connect-src ${config.connectSrc}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}

/**
 * Security headers audit function
 * Validates security headers configuration
 */
export function auditSecurityHeaders(): {
  valid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const config = getSecurityConfig();
  
  // Check for common security misconfigurations
  if (config.scriptSrc.includes("'unsafe-eval'")) {
    warnings.push("script-src allows 'unsafe-eval' which may enable XSS attacks");
    recommendations.push("Consider removing 'unsafe-eval' and using webpack's 'eval-source-map' devtool instead");
  }
  
  if (config.scriptSrc.includes("'unsafe-inline'")) {
    warnings.push("script-src allows 'unsafe-inline' which may enable XSS attacks");
    recommendations.push("Consider using nonces or hashes for inline scripts");
  }
  
  if (config.styleSrc.includes("'unsafe-inline'")) {
    warnings.push("style-src allows 'unsafe-inline' which may enable CSS injection");
    recommendations.push("Consider using CSS-in-JS solutions that generate hashes");
  }
  
  if (!config.enableHSTS && process.env.NODE_ENV === 'production') {
    warnings.push("HSTS is disabled in production");
    recommendations.push("Enable HSTS for production to prevent protocol downgrade attacks");
  }
  
  if (config.hstsMaxAge < 31536000) { // Less than 1 year
    warnings.push("HSTS max-age is less than recommended 1 year (31536000 seconds)");
    recommendations.push("Consider setting HSTS max-age to at least 31536000 seconds");
  }

  return {
    valid: warnings.length === 0,
    warnings,
    recommendations
  };
}

/**
 * Log security headers audit results
 */
export function logSecurityAudit(): void {
  const audit = auditSecurityHeaders();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔒 SECURITY HEADERS AUDIT');
  console.log('='.repeat(50));
  
  if (audit.valid) {
    console.log('✅ Security headers configuration is optimal');
  } else {
    console.log('⚠️  Security headers configuration has issues');
    
    if (audit.warnings.length > 0) {
      console.log('\n🚨 Warnings:');
      audit.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
    
    if (audit.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      audit.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }
  
  console.log('='.repeat(50) + '\n');
}