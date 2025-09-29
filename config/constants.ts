// Contact information - MUST be provided via environment variables
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  return value;
}

export const CONTACT_INFO = {
  phone: getRequiredEnv('NEXT_PUBLIC_CONTACT_PHONE'),
  email: getRequiredEnv('NEXT_PUBLIC_CONTACT_EMAIL'), 
  whatsapp: getRequiredEnv('NEXT_PUBLIC_WHATSAPP_URL'),
  address: getRequiredEnv('NEXT_PUBLIC_CONTACT_ADDRESS'),
  businessHours: getRequiredEnv('NEXT_PUBLIC_BUSINESS_HOURS'),
} as const;

export const SOCIAL_LINKS = {
  whatsapp: CONTACT_INFO.whatsapp,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || '',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
} as const;

export const DEV_CONFIG = {
  enableCMS: process.env.NEXT_PUBLIC_ENABLE_CMS === "true",
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  useFallbackData: process.env.NEXT_PUBLIC_USE_FALLBACK_DATA === "true",
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || "info",
}

export const IMAGE_CONFIG = {
  fallbackUrl: process.env.NEXT_PUBLIC_FALLBACK_IMAGE_URL || "https://images.unsplash.com/photo-1586339393565-32161f258eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
} as const;