import React from 'react'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import '@/styles/globals.css'

// Dynamic import for Footer (below the fold)
const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded mb-4 w-2/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
});

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Tugasin - Solusi Joki Tugas dan Skripsi Murah dan Cepat',
    template: '%s | Tugasin'
  },
  description: 'Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.',
  keywords: ['joki tugas', 'jasa skripsi', 'bantuan akademik', 'tugas kuliah', 'thesis'],
  authors: [{ name: 'Tugasin' }],
  creator: 'Tugasin',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'),
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Tugasin',
    title: {
      default: 'Tugasin - Solusi Joki Tugas dan Skripsi',
      template: '%s | Tugasin'
    },
    description: 'Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.',
  },
  twitter: {
    card: 'summary',
    title: {
      default: 'Tugasin - Solusi Joki Tugas dan Skripsi',
      template: '%s | Tugasin'
    },
    description: 'Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}