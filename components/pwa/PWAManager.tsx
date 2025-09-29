'use client';

import React, { useEffect } from 'react';

interface PWAManagerProps {
  children?: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
  console.log('🎯 PWAManager component rendering...');
  
  useEffect(() => {
    console.log('🚀 PWAManager useEffect running...');
    
    // Register service worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🔄 Attempting to register service worker...');
          const registration = await navigator.serviceWorker.register('/sw-simple.js');
          console.log('✅ Service worker registered successfully:', registration);
        } catch (error) {
          console.error('❌ Failed to register service worker:', error);
        }
      } else {
        console.log('❌ Service Worker not supported');
      }
    };
    
    // Test PWA install prompt detection
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('📲 PWA install prompt triggered!');
      e.preventDefault();
      // Show a simple alert to test after a delay
      setTimeout(() => {
        if (confirm('Install Tugasin app for a better experience?')) {
          e.prompt();
        }
      }, 3000);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Register service worker after component mounts
    registerSW();
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
}