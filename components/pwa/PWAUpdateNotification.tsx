'use client';

import React, { useState } from 'react';
import { Download, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceWorkerUpdate } from '@/lib/pwa/service-worker-manager';

interface PWAUpdateNotificationProps {
  updateInfo: ServiceWorkerUpdate;
  onDismiss: () => void;
}

export default function PWAUpdateNotification({ 
  updateInfo, 
  onDismiss 
}: PWAUpdateNotificationProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateInfo.updateServiceWorker();
      // The page will reload automatically after update
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      // You might want to show an error message here
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <Card className="bg-blue-50 border-blue-200 shadow-lg max-w-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-blue-900">
                  Update Tersedia
                </CardTitle>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                  Versi Baru
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <CardDescription className="text-sm text-blue-700">
            Versi terbaru Tugasin tersedia dengan fitur dan perbaikan baru.
          </CardDescription>
          
          <div className="bg-blue-100 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-medium">Yang Baru:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Performa yang lebih cepat</li>
                  <li>Fitur offline yang ditingkatkan</li>
                  <li>Perbaikan bug dan stabilitas</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Update Sekarang
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              size="sm"
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              Nanti
            </Button>
          </div>
          
          <p className="text-xs text-blue-600 text-center">
            Aplikasi akan restart otomatis setelah update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}