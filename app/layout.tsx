import React from 'react'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import '@/styles/globals.css'

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