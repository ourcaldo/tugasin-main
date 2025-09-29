'use client';

import React, { useState } from 'react';
import { Smartphone, X, Download, Zap, Shield, Star } from 'lucide-react';
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
      <Card className="max-w-sm w-full bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Install Tugasin
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  PWA App
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
        
        <CardContent className="space-y-4">
          <CardDescription className="text-sm text-gray-600">
            Install untuk akses cepat dan fitur offline.
          </CardDescription>
          
          {/* Compact Benefits - Horizontal Layout */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <Zap className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-blue-900">Akses Instan</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <Shield className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-green-900">Mode Offline</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <Star className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-purple-900">Performa Cepat</p>
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
                  Install
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Nanti
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}