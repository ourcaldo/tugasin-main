import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

interface CMSStatusProps {
  isConnected: boolean;
  error?: string | null;
  showAlert?: boolean;
  className?: string;
}

export default function CMSStatus({ isConnected, error, showAlert = false, className = "" }: CMSStatusProps) {
  if (showAlert && error) {
    return (
      <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>CMS Tidak Tersedia:</strong> {error}. Menampilkan konten yang telah disimpan sebelumnya.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Badge variant="outline" className={`text-orange-600 border-orange-300 ${className}`}>
        <WifiOff className="h-3 w-3 mr-1" />
        Mode Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-green-600 border-green-300 ${className}`}>
      <Wifi className="h-3 w-3 mr-1" />
      Live Content
    </Badge>
  );
}