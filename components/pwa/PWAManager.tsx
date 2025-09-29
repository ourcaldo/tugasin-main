'use client';

import React, { useEffect, useState } from 'react';
import { setPWAInstallDismissed, isPWAInstallDismissed } from '@/lib/utils/cookies';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAOfflineIndicator from './PWAOfflineIndicator';

interface PWAManagerProps {
  children?: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
  console.log('🎯 PWAManager component rendering...');
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistered, setSwRegistered] = useState(false);
  
  useEffect(() => {
    console.log('🚀 PWAManager useEffect running...');
    
    // Initialize online status
    setIsOnline(navigator.onLine);
    console.log('📡 Initial online status:', navigator.onLine);
    
    // Register service worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🔄 Attempting to register service worker...');
          const registration = await navigator.serviceWorker.register('/sw-simple.js');
          console.log('✅ Service worker registered successfully:', registration);
          setSwRegistered(true);
        } catch (error) {
          console.error('❌ Failed to register service worker:', error);
        }
      } else {
        console.log('❌ Service Worker not supported');
      }
    };
    
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('📲 Install prompt available, dismissed?', isPWAInstallDismissed());
      e.preventDefault();
      
      // Only show if user hasn't dismissed it recently
      if (!isPWAInstallDismissed()) {
        console.log('✨ Setting install prompt');
        setInstallPrompt(e);
      } else {
        console.log('❌ Install prompt dismissed, not showing');
      }
    };
    
    // Handle network changes
    const handleOnline = () => {
      console.log('🌐 Back online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('📡 Gone offline');
      setIsOnline(false);
    };
    
    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register service worker
    registerSW();
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Pre-cache important pages when SW is registered
  useEffect(() => {
    if (swRegistered) {
      const preCache = async () => {
        try {
          const cache = await caches.open('tugasin-pwa-v1.0.0');
          await cache.addAll([
            '/',
            '/blog',
            '/layanan', 
            '/contact',
            '/offline'
          ]);
          console.log('📦 Pre-cached important pages');
        } catch (error) {
          console.error('❌ Failed to pre-cache pages:', error);
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
      
      {installPrompt && !isPWAInstallDismissed() && (
        <PWAInstallPrompt
          onInstall={async () => {
            try {
              installPrompt.prompt();
              const { outcome } = await installPrompt.userChoice;
              console.log(`Install prompt outcome: ${outcome}`);
              setInstallPrompt(null);
            } catch (error) {
              console.error('Install prompt failed:', error);
            }
          }}
          onDismiss={() => {
            console.log('🔒 Setting PWA install dismissed cookie (24h)');
            setPWAInstallDismissed();
            setInstallPrompt(null);
          }}
        />
      )}
    </>
  );
}

// Global types for better TypeScript support
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }
}