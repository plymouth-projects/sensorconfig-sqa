import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Save, ArrowLeft, Search, Check, AlertTriangle } from 'lucide-react';
import { SensorService } from '@/services/SensorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  },
  {
    title: 'Add Sensor',
    href: '/admin/sensors/create',
  }
];

export default function CreateSensor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    location: {
      lat: 6.9271,  // Default to Colombo coordinates
      lng: 79.8612,
      address: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdSensor, setCreatedSensor] = useState<any>(null);
  const [errorAlert, setErrorAlert] = useState<{visible: boolean, message: string}>({
    visible: false,
    message: ''
  });
  const navigate = (path: string) => window.location.href = path;

  // Initialize the map
  useEffect(() => {
    // Load Google Maps API script if not already loaded
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.google && mapRef.current && !map) {
      initMap();
    }

    return () => {
      // Cleanup
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [mapRef.current]);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    const initialLocation = { lat: formData.location.lat, lng: formData.location.lng };
    
    const newMap = new (window.google.maps as any).Map(mapRef.current, {
      center: initialLocation,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const newMarker = new (window.google.maps as any).Marker({
      position: initialLocation,
      map: newMap,
      draggable: true,
      title: 'Sensor Location'
    });

    // Add listener for marker drag events
    (newMarker as any).addListener('dragend', () => {
      const position = (newMarker as any).getPosition();
      if (position) {
        const lat = position.lat();
        const lng = position.lng();
        updateLocationAddress(lat, lng);
      }
    });

    // Add listener for map click events
    (newMap as any).addListener('click', (e: any) => {
      const position = e.latLng;
      if (position && newMarker) {
        (newMarker as any).setPosition(position);
        const lat = position.lat();
        const lng = position.lng();
        updateLocationAddress(lat, lng);
      }
    });

    setMap(newMap);
    setMarker(newMarker);
    
    // Get the address for the initial location
    updateLocationAddress(initialLocation.lat, initialLocation.lng);
  };

  const updateLocationAddress = async (lat: number, lng: number) => {
    if (!window.google) return;
    
    try {
      const geocoder = new (window.google.maps as any).Geocoder();
      const latlng = { lat, lng };
      
      geocoder.geocode({ location: latlng }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;
          setFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              address
            }
          }));
        }
      });
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as 'active' | 'inactive' | 'maintenance'
    }));
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.address || !window.google) return;
    
    try {
      const geocoder = new (window.google.maps as any).Geocoder();
      
      geocoder.geocode({ address: formData.location.address }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          
          // Update form data
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              lat,
              lng
            }
          }));
          
          // Update marker and map center
          if (marker && map) {
            const position = new (window.google.maps as any).LatLng(lat, lng);
            (marker as any).setPosition(position);
            (map as any).setCenter(position);
          }
        } else {
          // Show error alert
          setErrorAlert({
            visible: true,
            message: 'Could not find the specified address. Please try a different search.'
          });
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setErrorAlert({ visible: false, message: '' });
          }, 5000);
        }
      });
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const errors = [];
    if (!formData.name.trim()) {
      errors.push('Sensor name is required');
    } else if (formData.name.length < 3) {
      errors.push('Sensor name must be at least 3 characters');
    }
    
    if (!formData.location.address) {
      errors.push('Please select a valid location on the map');
    }
    
    if (errors.length > 0) {
      // Show validation error alert
      setErrorAlert({
        visible: true,
        message: errors[0]
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setErrorAlert({ visible: false, message: '' });
      }, 5000);
      
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Store sensor in database using the SensorService
      const sensor = await SensorService.createSensor({
        name: formData.name,
        status: formData.status,
        location: formData.location
      });
      
      // Store the created sensor and show success dialog
      setCreatedSensor(sensor);
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Error creating sensor:', error);
      
      // More specific error handling with alert
      const errorMessage = error.response?.data?.message || 'Failed to create sensor. Please try again.';
      
      setErrorAlert({
        visible: true,
        message: errorMessage
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setErrorAlert({ visible: false, message: '' });
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    navigate('/admin/sensors');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Add New Sensor" />
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Add New Sensor</h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/sensors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sensors
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        {errorAlert.visible && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorAlert.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sensor Details</CardTitle>
              <CardDescription>Enter the details for the new air quality sensor</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sensor Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="E.g., Colombo Central AQI Sensor"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select value={formData.status} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Location Address</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="address"
                      placeholder="Search for an address"
                      value={formData.location.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          address: e.target.value
                        }
                      }))}
                    />
                    <Button type="button" onClick={handleAddressSearch} variant="secondary">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search for an address or click on the map to set the location
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Coordinates</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        id="lat"
                        placeholder="Latitude"
                        value={formData.location.lat.toFixed(6)}
                        readOnly
                      />
                    </div>
                    <div>
                      <Input
                        id="lng"
                        placeholder="Longitude"
                        value={formData.location.lng.toFixed(6)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Create Sensor
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sensor Location</CardTitle>
              <CardDescription>Click on the map to set the sensor location</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="h-[400px] w-full rounded-md border"
                style={{ width: '100%', height: '400px' }}
              ></div>
            </CardContent>
          </Card>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sensor Created Successfully</DialogTitle>
              <DialogDescription>
                {createdSensor && `Your new sensor "${createdSensor.name}" has been added to the database.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleDialogClose} className="w-full">
                View All Sensors
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 