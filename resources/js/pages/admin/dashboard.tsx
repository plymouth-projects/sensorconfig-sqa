import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, MapPin, Activity, Bell, Users, Gauge } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { SystemService } from '@/services/SystemService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminProps {
    role: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    }
];

export default function AdminDashboard({ role }: AdminProps) {
    const [systemStatus, setSystemStatus] = useState({
        activeSensors: 12,
        simulationStatus: 'stopped' as 'running' | 'stopped',
        alertsToday: 3,
    });
    const [loading, setLoading] = useState(true);
    const [alertState, setAlertState] = useState<{
        open: boolean;
        title: string;
        description: string;
    }>({
        open: false,
        title: '',
        description: ''
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // In a real implementation, would fetch data from API
            // For demo purposes, using SystemService with localStorage for persistence
            const status = await SystemService.getSystemStatus();
            setSystemStatus({
                activeSensors: status.activeSensors,
                simulationStatus: status.simulationStatus,
                alertsToday: status.alertsToday
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulationToggle = async () => {
        try {
            setLoading(true);
            
            if (systemStatus.simulationStatus === 'running') {
                // Stop simulation
                const response = await SystemService.stopSimulation();
                setSystemStatus(prev => ({
                    ...prev,
                    simulationStatus: 'stopped'
                }));
                showAlert('Simulation Stopped', response.message);
            } else {
                // Start simulation
                const response = await SystemService.startSimulation();
                setSystemStatus(prev => ({
                    ...prev,
                    simulationStatus: 'running'
                }));
                showAlert('Simulation Started', response.message);
            }
        } catch (error) {
            console.error('Failed to toggle simulation:', error);
            showAlert('Error', 'Failed to change simulation status');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (title: string, description: string) => {
        setAlertState({
            open: true,
            title,
            description
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-6 p-8">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Air Quality Monitoring System</h2>
                </div>
                <p className="text-muted-foreground">
                    Welcome to the admin dashboard. Manage sensors, simulations, alerts, and users from this central hub.
                </p>
                
                {/* System Status Overview */}
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle>System Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-sm">Active Sensors</span>
                                <span className="text-2xl font-bold">{systemStatus.activeSensors}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-sm">Simulation Status</span>
                                <span className="text-green-500 font-medium">
                                    {systemStatus.simulationStatus === 'running' ? 'Running' : 'Stopped'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-sm">Alerts Today</span>
                                <span className="text-2xl font-bold">{systemStatus.alertsToday}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-sm">Your Role</span>
                                <span className="text-primary font-medium">Admin</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Sensor Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <CardTitle>Sensor Management</CardTitle>
                            </div>
                            <CardDescription>Register and manage sensors in Colombo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p>Manage your network of air quality sensors across Colombo.</p>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Button className="w-full" asChild>
                                        <Link href="/admin/sensors/create">Register New Sensor</Link>
                                    </Button>
                                    <Button className="w-full" variant="outline" asChild>
                                        <Link href="/admin/sensors">View All Sensors</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Data Simulation Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Activity className="h-5 w-5 text-primary" />
                                <CardTitle>Data Simulation</CardTitle>
                            </div>
                            <CardDescription>Configure and control AQI data simulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p>Set parameters for data generation and control simulation status.</p>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Button className="w-full" asChild>
                                        <Link href="/admin/simulation/config">Configure Parameters</Link>
                                    </Button>
                                    <Button 
                                        className="w-full"
                                        variant={systemStatus.simulationStatus === 'running' ? 'destructive' : 'default'}
                                        onClick={handleSimulationToggle}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Processing...
                                            </>
                                        ) : (
                                            systemStatus.simulationStatus === 'running' ? 'Stop Simulation' : 'Start Simulation'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Alert Configuration */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Bell className="h-5 w-5 text-primary" />
                                <CardTitle>Alert Configuration</CardTitle>
                            </div>
                            <CardDescription>Set thresholds for AQI level alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p>Define AQI thresholds for different alert categories and manage notifications.</p>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Button className="w-full" asChild>
                                        <Link href="/admin/alerts/thresholds">Set Thresholds</Link>
                                    </Button>
                                    <Button className="w-full" variant="outline" asChild>
                                        <Link href="/admin/alerts/notifications">Manage Notifications</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* System Dashboard */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Gauge className="h-5 w-5 text-primary" />
                                <CardTitle>System Dashboard</CardTitle>
                            </div>
                            <CardDescription>View detailed system metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p>Access detailed system status, logs, and performance metrics.</p>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Button className="w-full" asChild>
                                        <Link href="/admin/system/dashboard">View Dashboard</Link>
                                    </Button>
                                    <Button className="w-full" variant="outline" asChild>
                                        <Link href="/admin/system/logs">System Logs</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks and shortcuts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Button className="w-full justify-start text-sm sm:text-base py-3" variant="ghost" asChild>
                                    <Link href="/admin/sensors/map">
                                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" /> Map View
                                    </Link>
                                </Button>
                                <Button className="w-full justify-start text-sm sm:text-base py-3" variant="ghost" asChild>
                                    <Link href="/admin/reports">
                                        <Activity className="h-4 w-4 mr-2 flex-shrink-0" /> Generate Reports
                                    </Link>
                                </Button>
                                <Button className="w-full justify-start text-sm sm:text-base py-3" variant="ghost" asChild>
                                    <Link href="/admin/alerts/history">
                                        <Bell className="h-4 w-4 mr-2 flex-shrink-0" /> Alert History
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Alert Dialog */}
            <AlertDialog open={alertState.open} onOpenChange={(open) => setAlertState(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertState.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
} 