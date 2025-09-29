'use client';

import React, { useEffect, useState } from 'react';
import { getServiceWorkerManager, ServiceWorkerUpdate } from '@/lib/pwa/service-worker-manager';
import { setPWAInstallDismissed, isPWAInstallDismissed } from '@/lib/utils/cookies';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdateNotification from './PWAUpdateNotification';
import PWAOfflineIndicator from './PWAOfflineIndicator';

interface PWAManagerProps {
  children?: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerUpdate | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    const swManager = getServiceWorkerManager();
    
    // Initialize online status
    setIsOnline(swManager.isOnline);

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await swManager.register();
        setSwRegistered(!!registration);
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    };

    // Set up event listeners
    swManager.onNetworkChange((online) => {
      setIsOnline(online);
      
      // Auto-reload when coming back online to sync data
      if (online && !isOnline) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });

    swManager.onUpdate((update) => {
      setUpdateAvailable(update);
    });

    swManager.onInstallPrompt((event) => {
      // Only set install prompt if user hasn't dismissed it recently
      if (!isPWAInstallDismissed()) {
        setInstallPrompt(event);
      }
    });

    // Listen for service worker notifications
    const handleSWNotification = (event: CustomEvent) => {
      // You can integrate with your notification system here
      console.log('SW Notification:', event.detail);
    };

    window.addEventListener('sw-notification', handleSWNotification);

    // Register service worker
    registerSW();

    return () => {
      window.removeEventListener('sw-notification', handleSWNotification);
    };
  }, [isOnline]);

  // Pre-cache important pages when the app loads
  useEffect(() => {
    if (swRegistered) {
      const preCache = async () => {
        try {
          const swManager = getServiceWorkerManager();
          await swManager.cacheUrls([
            '/',
            '/blog',
            '/layanan', 
            '/contact',
            '/offline'
          ]);
        } catch (error) {
          console.error('Failed to pre-cache pages:', error);
        }
      };

      // Pre-cache after a short delay to not block initial load
      setTimeout(preCache, 2000);
    }
  }, [swRegistered]);

  return (
    <>
      {children}
      
      {/* PWA Components */}
      <PWAOfflineIndicator isOnline={isOnline} />
      
      {updateAvailable && (
        <PWAUpdateNotification
          updateInfo={updateAvailable}
          onDismiss={() => setUpdateAvailable(null)}
        />
      )}
      
      {installPrompt && !isPWAInstallDismissed() && (
        <PWAInstallPrompt
          onInstall={async () => {
            const swManager = getServiceWorkerManager();
            const installed = await swManager.promptInstall();
            if (installed) {
              setInstallPrompt(null);
            }
          }}
          onDismiss={() => {
            // Set cookie to remember dismissal for 24 hours
            setPWAInstallDismissed();
            setInstallPrompt(null);
          }}
        />
      )}
    </>
  );
}