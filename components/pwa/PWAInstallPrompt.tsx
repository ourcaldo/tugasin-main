'use client';

import React, { useState } from 'react';
import { Smartphone, X, Download, Star, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PWAInstallPromptProps {
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Install Tugasin
                </CardTitle>
                <Badge variant="secondary" className="mt-1">
                  Progressive Web App
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardDescription className="text-base text-gray-600">
            Install Tugasin untuk pengalaman yang lebih baik dengan akses cepat 
            dan fitur offline.
          </CardDescription>
          
          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Keuntungan Install App:</h4>
            <div className="grid gap-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900 text-sm">Akses Instan</p>
                  <p className="text-blue-700 text-xs">Buka langsung dari home screen</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm">Mode Offline</p>
                  <p className="text-green-700 text-xs">Tetap bisa digunakan tanpa internet</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900 text-sm">Performa Cepat</p>
                  <p className="text-purple-700 text-xs">Loading lebih cepat dengan cache</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* App Preview */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Tugasin</p>
                <p className="text-gray-600 text-xs">Solusi Joki Tugas & Skripsi</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Aplikasi ini akan ditambahkan ke home screen Anda dan dapat diakses seperti aplikasi native.
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isInstalling ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-pulse" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Tidak Sekarang
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Gratis • Tidak ada iklan • Data aman
          </p>
        </CardContent>
      </Card>
    </div>
  );
}