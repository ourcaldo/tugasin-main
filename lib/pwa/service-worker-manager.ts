'use client';

import { Workbox } from 'workbox-window';

export interface ServiceWorkerUpdate {
  isUpdateAvailable: boolean;
  updateServiceWorker: () => Promise<void>;
}

export interface ServiceWorkerManager {
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  getUpdateStatus: () => ServiceWorkerUpdate;
  onUpdate: (callback: (update: ServiceWorkerUpdate) => void) => void;
  onInstallPrompt: (callback: (event: BeforeInstallPromptEvent) => void) => void;
  promptInstall: () => Promise<boolean>;
  isOnline: boolean;
  onNetworkChange: (callback: (online: boolean) => void) => void;
  clearCache: (cacheName?: string) => Promise<void>;
  cacheUrls: (urls: string[]) => Promise<void>;
  getVersion: () => Promise<string>;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private wb: Workbox | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private updateCallbacks: Set<(update: ServiceWorkerUpdate) => void> = new Set();
  private installPromptCallbacks: Set<(event: BeforeInstallPromptEvent) => void> = new Set();
  private networkCallbacks: Set<(online: boolean) => void> = new Set();
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeNetworkListeners();
      this.initializeInstallPromptListener();
    }
  }

  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.notifyNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.notifyNetworkChange(false);
    });
  }

  private initializeInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallPrompt(this.deferredPrompt);
    });
  }

  private notifyNetworkChange(online: boolean): void {
    this.networkCallbacks.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Error in network change callback:', error);
      }
    });
  }

  private notifyInstallPrompt(event: BeforeInstallPromptEvent): void {
    this.installPromptCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in install prompt callback:', error);
      }
    });
  }

  private notifyUpdate(): void {
    const updateInfo = this.getUpdateStatus();
    this.updateCallbacks.forEach(callback => {
      try {
        callback(updateInfo);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      // Create Workbox instance
      this.wb = new Workbox('/sw-simple.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Set up event listeners
      this.wb.addEventListener('installed', (event) => {
        console.log('Service Worker installed', event);
        if (!event.isUpdate) {
          // Show installation success message
          this.showNotification('App installed successfully!', 'success');
        }
      });

      this.wb.addEventListener('waiting', () => {
        console.log('Service Worker update available');
        this.updateAvailable = true;
        this.notifyUpdate();
      });

      this.wb.addEventListener('controlling', () => {
        console.log('Service Worker is controlling');
        // Reload to ensure all resources are from the new service worker
        window.location.reload();
      });

      this.wb.addEventListener('activated', (event) => {
        console.log('Service Worker activated', event);
        if (event.isUpdate) {
          this.showNotification('App updated successfully!', 'success');
        }
      });

      // Register the service worker
      this.registration = await this.wb.register() || null;
      
      // Check for updates periodically
      this.startPeriodicUpdateCheck();

      console.log('Service Worker registered successfully');
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      this.wb = null;
      console.log('Service Worker unregistered successfully');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.wb) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Skip waiting and take control
      this.wb.messageSkipWaiting();
      this.updateAvailable = false;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  getUpdateStatus(): ServiceWorkerUpdate {
    return {
      isUpdateAvailable: this.updateAvailable,
      updateServiceWorker: () => this.update()
    };
  }

  onUpdate(callback: (update: ServiceWorkerUpdate) => void): void {
    this.updateCallbacks.add(callback);
  }

  onNetworkChange(callback: (online: boolean) => void): void {
    this.networkCallbacks.add(callback);
  }

  onInstallPrompt(callback: (event: BeforeInstallPromptEvent) => void): void {
    this.installPromptCallbacks.add(callback);
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`Install prompt outcome: ${outcome}`);
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  private startPeriodicUpdateCheck(): void {
    // Check for updates every 30 minutes
    setInterval(() => {
      if (this.wb && this.isOnline) {
        this.wb.update();
      }
    }, 30 * 60 * 1000);
  }

  private showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
    // Trigger custom event for notification display
    window.dispatchEvent(new CustomEvent('sw-notification', {
      detail: { message, type }
    }));
  }

  // Cache management methods
  async clearCache(cacheName?: string): Promise<void> {
    if (!this.wb) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.wb.messageSW({
        type: 'CLEAR_CACHE',
        payload: { cacheName }
      });
      console.log('Cache cleared:', cacheName || 'default');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.wb) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.wb.messageSW({
        type: 'CACHE_URLS',
        payload: { urls }
      });
      console.log('URLs cached:', urls);
    } catch (error) {
      console.error('Failed to cache URLs:', error);
      throw error;
    }
  }

  async getVersion(): Promise<string> {
    if (!this.wb) {
      throw new Error('Service Worker not registered');
    }

    try {
      const response = await this.wb.messageSW({
        type: 'GET_VERSION'
      });
      return response.payload.version;
    } catch (error) {
      console.error('Failed to get version:', error);
      throw error;
    }
  }
}

// Global types for better TypeScript support
declare global {
  interface WindowEventMap {
    'sw-notification': CustomEvent<{
      message: string;
      type: 'success' | 'info' | 'warning' | 'error';
    }>;
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }
}

// Singleton instance
let serviceWorkerManager: ServiceWorkerManager | null = null;

export function getServiceWorkerManager(): ServiceWorkerManager {
  if (!serviceWorkerManager) {
    serviceWorkerManager = new ServiceWorkerManagerImpl();
  }
  return serviceWorkerManager;
}