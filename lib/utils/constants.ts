// Contact information
export const CONTACT_INFO = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+6281234567890",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@tugasin.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/6281234567890",
  location: process.env.NEXT_PUBLIC_CONTACT_LOCATION || "Jakarta, Indonesia",
  address: process.env.NEXT_PUBLIC_CONTACT_LOCATION || "Jakarta, Indonesia",
} as const;

// Company information
export const COMPANY_INFO = {
  name: "Tugasin",
  tagline: "Solusi Akademik Terpercaya",
  description: "Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.",
} as const;

// Navigation items
export const NAVIGATION_ITEMS = [
  { name: 'Beranda', href: '/' },
  { name: 'Layanan', href: '/layanan' },
  { name: 'Blog', href: '/blog' },
  { name: 'Kontak', href: '/contact' },
] as const;

// Social media links
export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#",
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "#", 
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "#",
  whatsapp: CONTACT_INFO.whatsapp,
} as const;

// Working hours
export const WORKING_HOURS = [
  { day: "Senin - Jumat", hours: "08:00 - 22:00 WIB" },
  { day: "Sabtu - Minggu", hours: "09:00 - 21:00 WIB" },
  { day: "Hari Libur", hours: "10:00 - 20:00 WIB" }
] as const;

// Development configuration
export const DEV_CONFIG = {
  // CMS configuration 
  enableCMS: true, // Hardcoded to true since CMS is working
  cmsTimeout: 10000,
  useFallbackData: false,
  
  // Debug mode
  debugMode: true,
} as const;

// CMS configuration
export const CMS_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_CMS_ENDPOINT || 'https://cms.tugasin.me/graphql',
  username: process.env.CMS_USERNAME || '',
  password: process.env.CMS_PASSWORD || '',
} as const;