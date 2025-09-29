import { Metadata } from 'next'

export const generateMetadata = (
  title: string,
  description: string,
  canonical?: string,
  ogImage?: string,
  pageType?: 'homepage' | 'page' | 'blog-post'
): Metadata => {
  // Title formatting based on page type
  let formattedTitle: string;
  switch (pageType) {
    case 'homepage':
      formattedTitle = 'Tugasin - Solusi Joki Tugas & Skripsi Murah dan Terpercaya';
      break;
    case 'blog-post':
      formattedTitle = `${title} - Tugasin`;
      break;
    case 'page':
    default:
      formattedTitle = `${title} - Tugasin`;
      break;
  }

  return {
    title: formattedTitle,
    description,
    keywords: ['joki tugas', 'jasa skripsi', 'bantuan akademik'],
    authors: [{ name: 'Tugasin' }],
    creator: 'Tugasin',
    publisher: 'Tugasin',
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: canonical,
      title: formattedTitle,
      description,
      siteName: 'Tugasin',
      images: [{ url: ogImage || process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/og-default.jpg' }]
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle,
      description,
      images: [ogImage || process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/og-default.jpg']
    }
  }
}

// Usage examples:
// Homepage: generateMetadata('', 'Description...', 'https://tugasin.com', '/og-default.jpg', 'homepage')
// Blog page: generateMetadata('Blog', 'Description...', 'https://tugasin.com/blog', '/og-default.jpg', 'page')  
// Blog post: generateMetadata('How to Write Essays', 'Description...', 'https://tugasin.com/blog/how-to-write-essays', '/og-default.jpg', 'blog-post')
// Service page: generateMetadata('Layanan', 'Description...', 'https://tugasin.com/layanan', '/og-default.jpg', 'page')