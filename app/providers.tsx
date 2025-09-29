/**
 * App Providers Setup
 * Configures React Query and other providers for the application
 */

"use client";

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/cache/query-client';
import { DEV_CONFIG } from '@/lib/utils/constants';
import { AnalyticsProvider } from '@/lib/analytics/analytics-provider';
import PWAManager from '@/components/pwa/PWAManager';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <PWAManager>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </PWAManager>
        
        {/* Show React Query DevTools in development */}
        {DEV_CONFIG.debugMode && (
          <ReactQueryDevtools 
            initialIsOpen={false}
          />
        )}
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}