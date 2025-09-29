/**
 * Performance Monitoring Dashboard Component
 * Displays real-time performance metrics and alerts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Monitor,
  Wifi
} from 'lucide-react';
import { useAnalytics } from '@/lib/analytics/analytics-provider';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
  description: string;
}

interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

const performanceMetrics: Record<string, Omit<PerformanceMetric, 'value' | 'rating'>> = {
  LCP: {
    name: 'Largest Contentful Paint',
    threshold: { good: 2500, poor: 4000 },
    unit: 'ms',
    description: 'Time until the largest element is rendered',
  },
  FID: {
    name: 'First Input Delay',
    threshold: { good: 100, poor: 300 },
    unit: 'ms',
    description: 'Delay before the first user interaction is processed',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    threshold: { good: 0.1, poor: 0.25 },
    unit: '',
    description: 'Visual stability measure of unexpected layout shifts',
  },
  FCP: {
    name: 'First Contentful Paint',
    threshold: { good: 1800, poor: 3000 },
    unit: 'ms',
    description: 'Time until the first content element is rendered',
  },
  TTFB: {
    name: 'Time to First Byte',
    threshold: { good: 800, poor: 1800 },
    unit: 'ms',
    description: 'Time until the first byte is received from the server',
  },
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({});
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'error'; message: string; timestamp: number }>>([]);
  const { isInitialized, addBreadcrumb } = useAnalytics();

  useEffect(() => {
    if (!isInitialized) return;

    // Get connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setConnectionInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }

    // Performance metrics collection using web-vitals v5
    const collectMetrics = () => {
      import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        const newMetrics: PerformanceMetric[] = [];

        // Collect LCP
        onLCP((metric) => {
          const rating = metric.value <= 2500 ? 'good' : metric.value <= 4000 ? 'needs-improvement' : 'poor';
          newMetrics.push({
            ...performanceMetrics.LCP,
            value: metric.value,
            rating,
          });
        });

        // Collect INP (replaces FID in web-vitals v5)
        onINP((metric) => {
          const rating = metric.value <= 200 ? 'good' : metric.value <= 500 ? 'needs-improvement' : 'poor';
          newMetrics.push({
            name: 'Interaction to Next Paint',
            threshold: { good: 200, poor: 500 },
            unit: 'ms',
            description: 'Responsiveness measure for user interactions',
            value: metric.value,
            rating,
          });
        });

        // Collect CLS
        onCLS((metric) => {
          const rating = metric.value <= 0.1 ? 'good' : metric.value <= 0.25 ? 'needs-improvement' : 'poor';
          newMetrics.push({
            ...performanceMetrics.CLS,
            value: metric.value,
            rating,
          });
        });

        // Collect FCP
        onFCP((metric) => {
          const rating = metric.value <= 1800 ? 'good' : metric.value <= 3000 ? 'needs-improvement' : 'poor';
          newMetrics.push({
            ...performanceMetrics.FCP,
            value: metric.value,
            rating,
          });
        });

        // Collect TTFB
        onTTFB((metric) => {
          const rating = metric.value <= 800 ? 'good' : metric.value <= 1800 ? 'needs-improvement' : 'poor';
          newMetrics.push({
            ...performanceMetrics.TTFB,
            value: metric.value,
            rating,
          });
        });

        // Update metrics after a delay to allow all metrics to be collected
        setTimeout(() => {
          setMetrics(newMetrics);
          
          // Check for performance issues and create alerts
          const poorMetrics = newMetrics.filter(m => m.rating === 'poor');
          if (poorMetrics.length > 0) {
            const alert = {
              type: 'error' as const,
              message: `Performance issues detected: ${poorMetrics.map(m => m.name).join(', ')}`,
              timestamp: Date.now(),
            };
            setAlerts(prev => [alert, ...prev.slice(0, 4)]);
          }

          addBreadcrumb('Performance metrics collected', { metricsCount: newMetrics.length });
        }, 1000);
      });
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 2000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 2000);
      });
    }
  }, [isInitialized, addBreadcrumb]);

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'Largest Contentful Paint': return <Monitor className="h-4 w-4" />;
      case 'First Input Delay': return <Zap className="h-4 w-4" />;
      case 'Cumulative Layout Shift': return <Activity className="h-4 w-4" />;
      case 'First Contentful Paint': return <Clock className="h-4 w-4" />;
      case 'Time to First Byte': return <Wifi className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMetricBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good': return 'default';
      case 'needs-improvement': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    return `${value.toFixed(3)}${unit}`;
  };

  const calculateOverallScore = () => {
    if (metrics.length === 0) return 0;
    const scores = metrics.map(m => {
      if (m.rating === 'good') return 100;
      if (m.rating === 'needs-improvement') return 60;
      return 20;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const overallScore = calculateOverallScore();
  const scoreColor = overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>
            Initializing performance monitoring...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading performance metrics...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={`${alert.timestamp}-${index}`} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              {alert.type === 'error' ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Score
            </span>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {overallScore}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallScore} className="mb-4" />
          <div className="text-sm text-muted-foreground">
            Based on Core Web Vitals and performance metrics
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="connection">Connection Info</TabsTrigger>
          <TabsTrigger value="resources">Resource Loading</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {metrics.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Collecting performance metrics...</p>
                <p className="text-sm mt-1">Please wait while we measure your page performance</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.name.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                    {getMetricIcon(metric.name)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-2xl font-bold ${getMetricColor(metric.rating)}`}>
                        {formatMetricValue(metric.value, metric.unit)}
                      </div>
                      <Badge variant={getMetricBadgeVariant(metric.rating)}>
                        {metric.rating.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Good: &lt; {formatMetricValue(metric.threshold.good, metric.unit)}</span>
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>Poor: &gt; {formatMetricValue(metric.threshold.poor, metric.unit)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Connection Type</div>
                  <div className="text-2xl font-bold">
                    {connectionInfo.effectiveType || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Data Saver</div>
                  <div className="text-2xl font-bold">
                    {connectionInfo.saveData ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                {connectionInfo.downlink && (
                  <div>
                    <div className="text-sm font-medium mb-1">Downlink</div>
                    <div className="text-2xl font-bold">
                      {connectionInfo.downlink} Mbps
                    </div>
                  </div>
                )}
                {connectionInfo.rtt && (
                  <div>
                    <div className="text-sm font-medium mb-1">Round Trip Time</div>
                    <div className="text-2xl font-bold">
                      {connectionInfo.rtt} ms
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Loading Performance</CardTitle>
              <CardDescription>
                Analysis of resource loading times and bottlenecks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Resource loading analysis is available after page load completion.
                    Check the browser dev tools Network tab for detailed resource timing information.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm text-muted-foreground">
                  <h4 className="font-medium mb-2">Tips for Better Performance:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Optimize images with proper formats (WebP, AVIF)</li>
                    <li>Use lazy loading for below-the-fold content</li>
                    <li>Minimize JavaScript bundle size</li>
                    <li>Enable compression (gzip/brotli)</li>
                    <li>Use a Content Delivery Network (CDN)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceMonitor;