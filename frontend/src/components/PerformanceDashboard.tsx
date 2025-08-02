import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Cpu, Database, Server, Zap } from 'lucide-react';

interface PerformanceMetrics {
  uptime_seconds: number;
  total_requests: number;
  requests_per_minute: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  avg_cpu_percent: number;
  avg_memory_mb: number;
  memory_trace: {
    total_blocks: number;
    total_size_mb: number;
    top_consumers: Array<{
      file: string;
      size_mb: number;
      count: number;
    }>;
  };
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch performance metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/performance/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Update every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <div className="text-center py-8">Loading metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No performance data available
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 100) return 'text-green-600';
    if (ms < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCpuColor = (percent: number) => {
    if (percent < 50) return 'text-green-600';
    if (percent < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.uptime_seconds)}</div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_requests}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.requests_per_minute.toFixed(1)} req/min
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(metrics.avg_response_time_ms)}`}>
              {metrics.avg_response_time_ms.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Min: {metrics.min_response_time_ms.toFixed(0)}ms | Max: {metrics.max_response_time_ms.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCpuColor(metrics.avg_cpu_percent)}`}>
              {metrics.avg_cpu_percent.toFixed(1)}%
            </div>
            <Progress value={metrics.avg_cpu_percent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Process Memory</span>
              <span className="text-lg font-bold">{metrics.avg_memory_mb.toFixed(1)} MB</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Blocks</span>
                <span>{metrics.memory_trace.total_blocks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Memory Trace</span>
                <span>{metrics.memory_trace.total_size_mb.toFixed(1)} MB</span>
              </div>
            </div>

            {metrics.memory_trace.top_consumers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Memory Consumers</h4>
                {metrics.memory_trace.top_consumers.map((consumer, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate max-w-[200px]" title={consumer.file}>
                      {consumer.file.split('/').pop() || 'unknown'}
                    </span>
                    <span>{consumer.size_mb.toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Health */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Response Time</span>
                <Badge 
                  variant={metrics.avg_response_time_ms < 200 ? "default" : 
                          metrics.avg_response_time_ms < 500 ? "secondary" : "destructive"}
                >
                  {metrics.avg_response_time_ms < 200 ? "Excellent" :
                   metrics.avg_response_time_ms < 500 ? "Good" : "Needs Attention"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">CPU Load</span>
                <Badge 
                  variant={metrics.avg_cpu_percent < 50 ? "default" : 
                          metrics.avg_cpu_percent < 80 ? "secondary" : "destructive"}
                >
                  {metrics.avg_cpu_percent < 50 ? "Low" :
                   metrics.avg_cpu_percent < 80 ? "Medium" : "High"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Request Rate</span>
                <Badge variant="outline">
                  {metrics.requests_per_minute.toFixed(1)} req/min
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Usage</span>
                <Badge 
                  variant={metrics.avg_memory_mb < 500 ? "default" : 
                          metrics.avg_memory_mb < 1000 ? "secondary" : "destructive"}
                >
                  {metrics.avg_memory_mb < 500 ? "Normal" :
                   metrics.avg_memory_mb < 1000 ? "Elevated" : "High"}
                </Badge>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Optimization Tips</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {metrics.avg_response_time_ms > 500 && (
                  <li>• Consider optimizing database queries or adding caching</li>
                )}
                {metrics.avg_cpu_percent > 80 && (
                  <li>• High CPU usage - consider scaling horizontally</li>
                )}
                {metrics.avg_memory_mb > 1000 && (
                  <li>• Memory usage is high - check for memory leaks</li>
                )}
                {metrics.requests_per_minute > 100 && (
                  <li>• High traffic - consider implementing rate limiting</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
