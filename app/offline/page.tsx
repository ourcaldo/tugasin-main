'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, Home, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Offline Card */}
        <Card className="border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <WifiOff className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Anda Sedang Offline
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Koneksi internet tidak tersedia. Beberapa fitur mungkin terbatas, 
              tetapi Anda masih dapat mengakses konten yang telah di-cache.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Mode Offline</p>
                  <p className="text-sm text-yellow-600">Menggunakan data tersimpan</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Cache Aktif</p>
                  <p className="text-sm text-green-600">Konten tersedia offline</p>
                </div>
              </div>
            </div>

            {/* Available Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">Yang Dapat Anda Lakukan:</h3>
              
              <div className="grid gap-4">
                <Link href="/" className="block">
                  <Button variant="default" className="w-full justify-start h-auto p-4">
                    <Home className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Kembali ke Beranda</div>
                      <div className="text-sm opacity-80">Akses halaman utama yang ter-cache</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/blog" className="block">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="w-5 h-5 mr-3 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      B
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Baca Blog Offline</div>
                      <div className="text-sm opacity-70">Artikel yang sudah ter-cache</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/layanan" className="block">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="w-5 h-5 mr-3 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      S
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Lihat Layanan</div>
                      <div className="text-sm opacity-70">Informasi layanan tersimpan</div>
                    </div>
                  </Button>
                </Link>

                <Button 
                  variant="secondary" 
                  className="w-full justify-start h-auto p-4"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Coba Lagi</div>
                    <div className="text-sm opacity-70">Periksa koneksi internet</div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">💡 Tips Offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 text-sm">
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <p className="text-blue-800">
                  Halaman yang sudah Anda kunjungi sebelumnya tetap dapat diakses
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <p className="text-blue-800">
                  Form kontak akan tersimpan dan dikirim otomatis saat online
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <p className="text-blue-800">
                  Aplikasi akan memberitahu Anda saat koneksi kembali tersedia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Halaman ini akan otomatis refresh saat koneksi kembali
          </p>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 font-medium">Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}