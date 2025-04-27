import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash, Settings, Search, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { Sensor } from '@/types/sensor';
import { SensorService } from '@/services/SensorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
  },
  {
    title: 'Sensor Management',
    href: '/admin/sensors',
  }
];

export default function SensorManagement() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusAlert, setStatusAlert] = useState<{
    visible: boolean, 
    message: string, 
    type: 'default' | 'destructive'
  }>({
    visible: false,
    message: '',
    type: 'default'
  });

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      
      // Fetch sensors with latest readings using our new API endpoint
      const readingsData = await SensorService.getLatestReadings();
      console.log('Latest readings data:', readingsData);
      
      // Transform readings data to match the expected Sensor interface
      const transformedData = readingsData.map((item: any) => ({
        id: item.sensor_id,
        name: item.sensor_name,
        location: item.sensor_location,
        status: 'active', // Default to active since we don't have status in readings response
        lastReading: item.reading ? {
          id: item.reading.id,
          timestamp: item.reading.timestamp,
          aqi: item.reading.aqi,
          pm25: item.reading.pm25,
          pm10: item.reading.pm10
        } : undefined,
        createdAt: '', // These fields aren't used in the UI for this component
        updatedAt: ''
      }));
      
      setSensors(transformedData);
      
      // Show success dialog for successful data load
      if (transformedData.length > 0 && !showSuccessDialog) {
        setSuccessMessage(`Successfully loaded ${transformedData.length} sensors with latest readings from the database.`);
        setShowSuccessDialog(true);
      }
    } catch (error: any) {
      console.error('Failed to load sensors:', error);
      
      // Show error alert
      setStatusAlert({
        visible: true,
        message: error.response?.data?.message || 'An error occurred while fetching sensors from the database.',
        type: 'destructive'
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setStatusAlert({ visible: false, message: '', type: 'default' });
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const sensor = await SensorService.activateSensor(id);
      await loadSensors();
      
      // Show success alert
      setStatusAlert({
        visible: true,
        message: `${sensor.name} has been activated successfully.`,
        type: 'default'
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setStatusAlert({ visible: false, message: '', type: 'default' });
      }, 5000);
    } catch (error: any) {
      console.error('Failed to activate sensor:', error);
      
      // Show error alert
      setStatusAlert({
        visible: true,
        message: error.response?.data?.message || 'An error occurred while activating the sensor.',
        type: 'destructive'
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setStatusAlert({ visible: false, message: '', type: 'default' });
      }, 5000);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      const sensor = await SensorService.deactivateSensor(id);
      await loadSensors();
      
      // Show success alert
      setStatusAlert({
        visible: true,
        message: `${sensor.name} has been deactivated successfully.`,
        type: 'default'
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setStatusAlert({ visible: false, message: '', type: 'default' });
      }, 5000);
    } catch (error: any) {
      console.error('Failed to deactivate sensor:', error);
      
      // Show error alert
      setStatusAlert({
        visible: true,
        message: error.response?.data?.message || 'An error occurred while deactivating the sensor.',
        type: 'destructive'
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setStatusAlert({ visible: false, message: '', type: 'default' });
      }, 5000);
    }
  };

  const filteredSensors = searchQuery
    ? sensors.filter(sensor => 
        sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sensor.location && sensor.location.address && 
          sensor.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sensors;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600'; // Good
    if (aqi <= 100) return 'text-yellow-500'; // Moderate
    if (aqi <= 150) return 'text-orange-500'; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return 'text-red-500'; // Unhealthy
    if (aqi <= 300) return 'text-purple-600'; // Very Unhealthy
    return 'text-rose-800'; // Hazardous
  };
  
  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sensor Management" />
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Sensor Management</h2>
          </div>
          <Button asChild>
            <Link href="/admin/sensors/create">
              <Plus className="mr-2 h-4 w-4" /> Add New Sensor
            </Link>
          </Button>
        </div>

        {/* Status Alerts */}
        {statusAlert.visible && (
          <Alert variant={statusAlert.type} className="mb-4">
            {statusAlert.type === 'destructive' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>{statusAlert.type === 'destructive' ? 'Error' : 'Success'}</AlertTitle>
            <AlertDescription>{statusAlert.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sensors</CardTitle>
                <CardDescription>Manage your air quality sensors network in Colombo</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sensors..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-1/4 rounded-md bg-gray-200 animate-pulse"></div>
                    <div className="h-12 w-1/4 rounded-md bg-gray-200 animate-pulse"></div>
                    <div className="h-12 w-1/6 rounded-md bg-gray-200 animate-pulse"></div>
                    <div className="h-12 w-1/6 rounded-md bg-gray-200 animate-pulse"></div>
                    <div className="h-12 w-1/12 rounded-md bg-gray-200 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sensor Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Reading</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSensors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No sensors match your search' : 'No sensors found in database'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSensors.map((sensor) => (
                      <TableRow key={sensor.id}>
                        <TableCell className="font-medium">{sensor.name}</TableCell>
                        <TableCell>
                          {sensor.location && sensor.location.address 
                            ? sensor.location.address 
                            : (typeof sensor.location === 'string' ? sensor.location : "Unknown location")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(sensor.status)}>
                            {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sensor.lastReading ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`font-bold text-lg ${getAqiColor(sensor.lastReading.aqi)}`}>
                                  {sensor.lastReading.aqi}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getAqiColor(sensor.lastReading.aqi).replace('text-', 'bg-').replace('600', '100').replace('500', '100').replace('800', '100')}`}>
                                  {getAqiLabel(sensor.lastReading.aqi)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {new Date(sensor.lastReading.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex space-x-4 text-xs text-muted-foreground">
                                <span>PM2.5: {sensor.lastReading.pm25} μg/m³</span>
                                <span>PM10: {sensor.lastReading.pm10} μg/m³</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No data</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/sensors/${sensor.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/sensors/${sensor.id}/edit`}>Edit Sensor</Link>
                              </DropdownMenuItem>
                              {sensor.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleDeactivate(sensor.id)}>
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleActivate(sensor.id)}>
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" asChild>
                                <Link href={`/admin/sensors/${sensor.id}/delete`}>Delete</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                Showing {filteredSensors.length} of {sensors.length} sensors from database
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/sensors/map">View Map</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={loadSensors}>
                  <Database className="mr-2 h-4 w-4" /> Refresh Database
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Success Dialog for Sensors Loaded */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Database Connected</DialogTitle>
              <DialogDescription>
                {successMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Database className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 