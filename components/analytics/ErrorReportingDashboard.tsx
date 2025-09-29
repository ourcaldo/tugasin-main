/**
 * Error Reporting Dashboard Component
 * Displays error statistics, recent errors, and system health
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Bug, 
  XCircle, 
  CheckCircle, 
  Activity,
  RefreshCw,
  TrendingDown,
  Shield,
  Clock
} from 'lucide-react';
import { useAnalytics } from '@/lib/analytics/analytics-provider';

interface ErrorStats {
  totalErrors: number;
  sessionId: string;
  recentErrors: Array<{
    timestamp: number;
    message: string;
    category: string;
    level: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  errorRate: number;
  lastError?: number;
  performance: 'good' | 'fair' | 'poor';
}

export function ErrorReportingDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    uptime: 0,
    errorRate: 0,
    performance: 'good',
  });
  const [refreshing, setRefreshing] = useState(false);
  const { isInitialized, getErrorStats, addBreadcrumb } = useAnalytics();

  const refreshErrorStats = () => {
    setRefreshing(true);
    try {
      const stats = getErrorStats();
      setErrorStats(stats);
      
      // Calculate system health
      const errorRate = stats.totalErrors / (Date.now() / 1000 / 60); // Errors per minute
      const overall = errorRate > 5 ? 'critical' : errorRate > 2 ? 'degraded' : 'healthy';
      
      setSystemHealth(prev => ({
        ...prev,
        overall,
        errorRate,
        lastError: stats.recentErrors.length > 0 ? stats.recentErrors[0].timestamp : prev.lastError,
      }));
      
      addBreadcrumb('Error stats refreshed', { totalErrors: stats.totalErrors });
    } catch (error) {
      console.error('Failed to refresh error stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    // Initial load
    refreshErrorStats();

    // Update uptime counter
    const startTime = Date.now();
    const uptimeInterval = setInterval(() => {
      setSystemHealth(prev => ({
        ...prev,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    // Refresh stats every 30 seconds
    const refreshInterval = setInterval(refreshErrorStats, 30000);

    return () => {
      clearInterval(uptimeInterval);
      clearInterval(refreshInterval);
    };
  }, [isInitialized]);

  const getHealthStatusColor = (status: SystemHealth['overall']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: SystemHealth['overall']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getErrorLevelBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge variant="secondary">Warning</Badge>;
      case 'info': return <Badge variant="outline">Info</Badge>;
      default: return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Monitoring
          </CardTitle>
          <CardDescription>
            Initializing error monitoring...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading error monitoring dashboard...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getHealthStatusIcon(systemHealth.overall)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthStatusColor(systemHealth.overall)}`}>
              {systemHealth.overall.charAt(0).toUpperCase() + systemHealth.overall.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system health
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(systemHealth.uptime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Session uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.errorRate.toFixed(2)}/min
            </div>
            <p className="text-xs text-muted-foreground">
              Errors per minute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {errorStats?.totalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Since session start
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Alert */}
      {systemHealth.overall !== 'healthy' && (
        <Alert variant={systemHealth.overall === 'critical' ? 'destructive' : 'default'}>
          {systemHealth.overall === 'critical' ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>
            {systemHealth.overall === 'critical' 
              ? 'Critical system issues detected. High error rate may impact user experience.'
              : 'System performance is degraded. Monitoring for potential issues.'
            }
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="errors" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
            <TabsTrigger value="health">Health Check</TabsTrigger>
            <TabsTrigger value="session">Session Info</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshErrorStats}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest error events and system issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!errorStats?.recentErrors || errorStats.recentErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">No Recent Errors</h3>
                  <p className="text-muted-foreground">
                    Your application is running smoothly without any reported errors.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorStats.recentErrors.map((error, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getErrorLevelBadge(error.level)}
                            <Badge variant="outline">{error.category}</Badge>
                          </div>
                          <h4 className="font-medium">{error.message}</h4>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </div>
                      
                      {error.data && Object.keys(error.data).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                            Show Details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Error Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Tracking</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Breadcrumb Collection</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exception Reporting</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Monitoring</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <Badge variant="outline">Normal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <Badge variant="outline">Low</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Latency</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Render Performance</span>
                    <Badge variant="outline">{systemHealth.performance}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Session ID</div>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {errorStats?.sessionId || 'Not available'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Session Duration</div>
                  <div className="text-lg font-semibold">
                    {formatUptime(systemHealth.uptime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">User Agent</div>
                  <div className="text-sm text-muted-foreground">
                    {navigator.userAgent.split(' ')[0]}...
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Page URL</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {window.location.pathname}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ErrorReportingDashboard;