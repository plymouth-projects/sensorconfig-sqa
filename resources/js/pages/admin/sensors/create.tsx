import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Save, ArrowLeft, Search, Check, AlertTriangle, Crosshair } from 'lucide-react';
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
  const [userInputAddress, setUserInputAddress] = useState('');
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
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
        
        // Update form data with the new coordinates immediately
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            lat,
            lng,
          }
        }));
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
        
        // Update form data with the new coordinates immediately
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            lat,
            lng,
          }
        }));
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
      // Show loading state immediately
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          lat,
          lng,
          address: 'Fetching location...'
        }
      }));
      
      const geocoder = new (window.google.maps as any).Geocoder();
      const latlng = { lat, lng };
      
      // Use promise-based approach for cleaner code
      const getGeocodedAddress = () => {
        return new Promise((resolve, reject) => {
          geocoder.geocode({ location: latlng }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed with status: ${status}`));
            }
          });
        });
      };
      
      try {
        const results = await getGeocodedAddress() as any[];
        const result = results[0];
        
        // Extract location components (locality, administrative areas, country)
        let locationName = '';
        
        // Function to find address component by type
        const getAddressComponent = (type: string) => {
          const component = result.address_components.find((c: any) => 
            c.types.includes(type)
          );
          return component ? component.long_name : '';
        };
        
        // Get various location components
        const locality = getAddressComponent('locality'); // city
        const sublocality = getAddressComponent('sublocality');
        const adminArea1 = getAddressComponent('administrative_area_level_1'); // state/province
        const adminArea2 = getAddressComponent('administrative_area_level_2'); // county/district
        const country = getAddressComponent('country');
        
        // Build location name in priority order
        if (locality) {
          locationName = locality;
        } else if (sublocality) {
          locationName = sublocality;
        } else if (adminArea2) {
          locationName = adminArea2;
        }
        
        // Add state/province if available
        if (adminArea1 && adminArea1 !== locationName) {
          locationName = locationName ? `${locationName}, ${adminArea1}` : adminArea1;
        }
        
        // Add country if available
        if (country && country !== locationName && country !== adminArea1) {
          locationName = locationName ? `${locationName}, ${country}` : country;
        }
        
        // If we couldn't build a good location name, use the formatted address
        if (!locationName) {
          locationName = result.formatted_address;
        }
        
        // Store both the location name and full address
        setFormData(prev => ({
          ...prev,
          location: {
            lat,
            lng,
            address: locationName,
            fullAddress: result.formatted_address // Keep full address for reference
          }
        }));
      } catch (geocodeError) {
        console.warn('Geocoding issue:', geocodeError);
        
        // Use the user's input address if available, otherwise use a fallback
        if (userInputAddress) {
          setFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              address: userInputAddress,
              userProvided: true
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              address: `Unknown location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error in address lookup process:', error);
      
      // Use the user's input address if available, otherwise use a fallback
      if (userInputAddress) {
        setFormData(prev => ({
          ...prev,
          location: {
            lat,
            lng,
            address: userInputAddress,
            userProvided: true
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          location: {
            lat,
            lng,
            address: `Unknown location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          }
        }));
      }
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
          
          // Store the user's input address
          setUserInputAddress(formData.location.address);
          
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorAlert({
        visible: true,
        message: 'Geolocation is not supported by your browser'
      });
      return;
    }
    
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
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
          const newPosition = new (window.google.maps as any).LatLng(lat, lng);
          (marker as any).setPosition(newPosition);
          (map as any).setCenter(newPosition);
          (map as any).setZoom(15); // Zoom in closer
        }
        
        // Get address for the coordinates
        updateLocationAddress(lat, lng);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = 'Unable to retrieve your location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access was denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get your location timed out.';
            break;
        }
        
        setErrorAlert({
          visible: true,
          message
        });
        
        setTimeout(() => {
          setErrorAlert({ visible: false, message: '' });
        }, 5000);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
      // Structure the data to match the API expectations
      // Backend expects location as a string and separate lat/lng fields
      const sensorData = {
        name: formData.name,
        status: formData.status,
        location: formData.location.address, // Send address as string
        latitude: formData.location.lat,     // Send latitude as separate field
        longitude: formData.location.lng     // Send longitude as separate field
      };
      
      // Store sensor in database using the SensorService
      const sensor = await SensorService.createSensor(sensorData);
      
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
                  <Label htmlFor="address">Location</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="address"
                      placeholder="Search for an address"
                      value={formData.location.address}
                      onChange={(e) => {
                        // Store user's input for potential fallback use
                        const inputValue = e.target.value;
                        setUserInputAddress(inputValue);
                        
                        // Update the form data
                        setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            address: inputValue
                          }
                        }));
                      }}
                    />
                    <Button type="button" onClick={handleAddressSearch} variant="secondary">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                      Search for an address or click on the map to set the location
                    </p>
                    <Button 
                      type="button" 
                      onClick={handleGetCurrentLocation} 
                      variant="outline" 
                      size="sm"
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <Crosshair className="mr-2 h-3 w-3" /> Use My Location
                        </>
                      )}
                    </Button>
                  </div>
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