'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PWAOfflineIndicatorProps {
  isOnline: boolean;
}

export default function PWAOfflineIndicator({ isOnline }: PWAOfflineIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);
  const [lastOnlineStatus, setLastOnlineStatus] = useState(isOnline);
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);

  useEffect(() => {
    // Show indicator when going offline
    if (!isOnline && lastOnlineStatus) {
      setShowIndicator(true);
      setShowReconnectedMessage(false);
    }
    
    // Show reconnected message when coming back online
    if (isOnline && !lastOnlineStatus) {
      setShowReconnectedMessage(true);
      setShowIndicator(false);
      
      // Hide reconnected message after 5 seconds
      const timer = setTimeout(() => {
        setShowReconnectedMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }

    setLastOnlineStatus(isOnline);
  }, [isOnline, lastOnlineStatus]);

  // Don't show anything if online and never went offline
  if (isOnline && lastOnlineStatus && !showReconnectedMessage) {
    return null;
  }

  // Reconnected message
  if (showReconnectedMessage) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <Card className="bg-green-50 border-green-200 shadow-lg max-w-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">
                  Kembali Online!
                </p>
                <p className="text-sm text-green-700">
                  Koneksi internet tersedia kembali
                </p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Offline indicator
  if (!isOnline && showIndicator) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <Card className="bg-orange-50 border-orange-200 shadow-lg max-w-sm">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <WifiOff className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-900">
                    Mode Offline
                  </p>
                  <p className="text-sm text-orange-700">
                    Menggunakan data tersimpan
                  </p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  Coba Lagi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIndicator(false)}
                  className="text-orange-700 hover:bg-orange-100"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}