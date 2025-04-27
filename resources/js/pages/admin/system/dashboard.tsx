import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Gauge, Server, RefreshCw, Archive, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { SystemService } from '@/services/SystemService';
import { SystemStatus } from '@/types/sensor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
  },
  {
    title: 'System Dashboard',
    href: '/admin/system/dashboard',
  }
];

export default function SystemDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<{
    timestamps: string[];
    cpu: number[];
    memory: number[];
    activeUsers: number[];
    apiRequests: number[];
  } | null>(null);
  const [logs, setLogs] = useState<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsTimespan, setMetricsTimespan] = useState<'hour' | 'day' | 'week'>('day');
  const [logsLevel, setLogsLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', description: '', variant: 'default' as 'default' | 'destructive' });

  useEffect(() => {
    loadSystemData();
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [metricsTimespan]);

  useEffect(() => {
    loadLogs();
  }, [logsLevel]);

  const showAlert = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setAlertMessage({ title, description, variant });
    setAlertOpen(true);
  };

  const loadSystemData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSystemStatus(),
        loadMetrics(),
        loadLogs()
      ]);
    } catch (error) {
      console.error('Failed to load system data:', error);
      showAlert('Error', 'Failed to load system data', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const data = await SystemService.getSystemStatus();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await SystemService.getMetrics(metricsTimespan);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await SystemService.getLogs(100, logsLevel);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleMaintenanceClick = async () => {
    try {
      const response = await SystemService.performMaintenance();
      showAlert('Maintenance Complete', response.message);
      loadSystemData();
    } catch (error) {
      console.error('Failed to perform maintenance:', error);
      showAlert('Error', 'Failed to perform system maintenance', 'destructive');
    }
  };

  const handleRestartService = async (service: 'simulation' | 'alerts' | 'all') => {
    try {
      const response = await SystemService.restartServices(service);
      showAlert('Service Restarted', response.message);
      loadSystemStatus();
    } catch (error) {
      console.error(`Failed to restart ${service} service:`, error);
      showAlert('Error', `Failed to restart ${service} service`, 'destructive');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !systemStatus) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="System Dashboard" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="System Dashboard" />
      {/* Alert Dialog for important notifications */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gauge className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">System Dashboard</h2>
          </div>
          <Button onClick={loadSystemData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {systemStatus && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full ${
                    systemStatus.systemHealth === 'healthy' ? 'bg-green-500' : 
                    systemStatus.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  } mr-2`}></div>
                  <span className={`text-2xl font-bold ${getStatusColor(systemStatus.systemHealth)}`}>
                    {systemStatus.systemHealth.charAt(0).toUpperCase() + systemStatus.systemHealth.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{systemStatus.activeSensors}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Simulation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full ${
                    systemStatus.simulationStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  } mr-2`}></div>
                  <span className="text-2xl font-bold">
                    {systemStatus.simulationStatus === 'running' ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{systemStatus.alertsToday}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div className="font-medium">Timespan</div>
                <Select value={metricsTimespan} onValueChange={(value: 'hour' | 'day' | 'week') => setMetricsTimespan(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select timespan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Last Hour</SelectItem>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {metrics ? (
                <div className="space-y-8">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">CPU Usage</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {metrics.cpu[metrics.cpu.length - 1]}%
                      </div>
                    </div>
                    <div className="h-[60px] w-full">
                      {/* This would be a chart component in a real implementation */}
                      <div className="flex h-full items-end">
                        {metrics.cpu.map((value, i) => (
                          <div
                            key={`cpu-${i}`}
                            className="bg-primary/80 w-full mx-[1px]"
                            style={{ height: `${value}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">Memory Usage</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {metrics.memory[metrics.memory.length - 1]}%
                      </div>
                    </div>
                    <div className="h-[60px] w-full">
                      {/* This would be a chart component in a real implementation */}
                      <div className="flex h-full items-end">
                        {metrics.memory.map((value, i) => (
                          <div
                            key={`memory-${i}`}
                            className="bg-blue-500/80 w-full mx-[1px]"
                            style={{ height: `${value}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">API Requests</div>
                      <div className="text-sm text-muted-foreground">
                        Total: {metrics.apiRequests.reduce((sum, val) => sum + val, 0)}
                      </div>
                    </div>
                    <div className="h-[60px] w-full">
                      {/* This would be a chart component in a real implementation */}
                      <div className="flex h-full items-end">
                        {metrics.apiRequests.map((value, i) => (
                          <div
                            key={`api-${i}`}
                            className="bg-green-500/80 w-full mx-[1px]"
                            style={{ height: `${Math.min(100, (value / Math.max(...metrics.apiRequests)) * 100)}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Recent system activity logs</CardDescription>
                </div>
                <Select value={logsLevel} onValueChange={(value: 'all' | 'info' | 'warning' | 'error') => setLogsLevel(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info Only</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Server className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No logs found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try changing the filter or refreshing the data
                    </p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={`log-${index}`} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="ml-2 text-sm font-medium">{log.source}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="outline" size="sm" className="w-full" onClick={loadLogs}>
                Load More Logs
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
            <CardDescription>Perform system maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Clean Old Data</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove old historical data to free up system resources
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleMaintenanceClick}>
                    <Archive className="mr-2 h-4 w-4" /> Run Cleanup
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Restart Simulation</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Restart the simulation service if it's not functioning properly
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleRestartService('simulation')}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Restart Service
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Restart Alert System</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Restart the alert notification service
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => handleRestartService('alerts')}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Restart Service
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 