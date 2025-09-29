// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
}

// Service types
export interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  features: string[];
  popular: boolean;
  timeframe: string;
}

export interface ServicePackage {
  name: string;
  description: string;
  multiplier: string;
  features: string[];
}

// Blog types
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  featured?: boolean;
  slug?: string;
  content?: string;
  tags?: string[];
  seo?: {
    title: string;
    description: string;
    focusKeywords: string[];
  };
}

export interface BlogCategory {
  name: string;
  count: number;
  icon: string;
}

// Testimonial types
export interface Testimonial {
  name: string;
  university: string;
  text: string;
  rating: number;
}

// Contact types
export interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string;
  action: string;
  actionLabel: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

// Subject types
export interface Subject {
  name: string;
  icon: string;
}

export interface SubjectCategory {
  category: string;
  subjects: Subject[];
}

// SEO types
export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  subject: string;
  message: string;
  deadline: string;
}