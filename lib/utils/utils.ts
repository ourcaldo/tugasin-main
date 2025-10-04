import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONTACT_INFO } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate WhatsApp URL with message
export function generateWhatsAppUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `${CONTACT_INFO.whatsapp}?text=${encodedMessage}`;
}

// Format contact form data into WhatsApp message
export function formatContactMessage(data: {
  name: string;
  email: string;
  phone: string;
  service: string;
  subject: string;
  message: string;
  deadline: string;
}): string {
  return `Halo Tim Tugasin! 

Saya ingin konsultasi tentang:
Nama: ${data.name}
Email: ${data.email}
No. HP: ${data.phone}
Layanan: ${data.service}
Mata Kuliah: ${data.subject}
Deadline: ${data.deadline}

Detail Kebutuhan:
${data.message}

Terima kasih!`;
}

// Get category color for blog posts
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Panduan Skripsi": "bg-blue-100 text-blue-800",
    "Tips Produktivitas": "bg-green-100 text-green-800",
    "Metodologi": "bg-purple-100 text-purple-800",
    "Academic Writing": "bg-orange-100 text-orange-800",
    "Mental Health": "bg-pink-100 text-pink-800",
    "Manajemen Waktu": "bg-indigo-100 text-indigo-800",
    "Presentasi": "bg-yellow-100 text-yellow-800"
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

// Convert category name to URL-friendly slug
export function getCategorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

// Convert category slug to readable name
export function getCategoryNameFromSlug(slug: string): string {
  const categoryMap: Record<string, string> = {
    'panduan-skripsi': 'Panduan Skripsi',
    'tips-produktivitas': 'Tips Produktivitas',
    'metodologi': 'Metodologi',
    'academic-writing': 'Academic Writing',
    'mental-health': 'Mental Health',
    'manajemen-waktu': 'Manajemen Waktu',
    'presentasi': 'Presentasi',
    'edukasi': 'Edukasi',
    'belajar-bahasa-jepang': 'Belajar Bahasa Jepang'
  };
  return categoryMap[slug] || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}