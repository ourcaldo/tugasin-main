"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Alert className="border-red-200 bg-red-50 my-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Terjadi Kesalahan:</strong> Komponen tidak dapat dimuat. Silakan refresh halaman atau coba lagi nanti.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export const DynamicComponentError: React.FC<{ error: Error }> = ({ error }) => (
  <Alert className="border-red-200 bg-red-50 my-4">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-red-800">
      <strong>Gagal memuat komponen:</strong> {error.message}. Silakan refresh halaman.
    </AlertDescription>
  </Alert>
);