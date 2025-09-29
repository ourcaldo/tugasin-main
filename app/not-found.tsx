import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Halaman Tidak Ditemukan</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau URL salah.
      </p>
      <div className="space-x-4">
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Hubungi Kami</Link>
        </Button>
      </div>
    </div>
  )
}