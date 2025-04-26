import React, { useEffect, useRef, useState } from 'react';
import { SensorLocation } from '@/types/air-quality';
import { getAqiColor } from '@/utils/air-quality';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from 'lucide-react';
import { AirQualityService } from '@/services/air-quality-service';

interface AirQualityMapProps {
  sensorData: SensorLocation[];
  loading?: boolean;
  onSensorSelect: (sensorId: number) => void;
}

// Type for advanced marker elements
interface AdvancedMarkerElement {
  map: google.maps.Map | null;
  position?: google.maps.LatLngLiteral;
  content?: HTMLElement;
  title?: string;
  addListener(event: string, handler: Function): void;
}

// Extend the Google Maps namespace to include advanced markers
declare global {
  namespace google.maps {
    namespace marker {
      class AdvancedMarkerElement {
        constructor(options: {
          map?: google.maps.Map;
          position?: google.maps.LatLngLiteral;
          content?: HTMLElement;
          title?: string;
        });
        map: google.maps.Map | null;
        addListener(event: string, handler: Function): void;
      }
    }
  }
}

export function AirQualityMap({ sensorData, loading = false, onSensorSelect }: AirQualityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<(google.maps.Marker | google.maps.marker.AdvancedMarkerElement)[]>([]);
  
  // Initialize the map when the component mounts
  useEffect(() => {
    // Create a handler for map initialization
    const initializeMap = () => {
      try {
        if (mapRef.current && !googleMapRef.current) {
          // Create a new map instance
          googleMapRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: 6.9271, lng: 79.8612 }, // Colombo
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          
          // Immediately update markers after map is created
          if (!loading && sensorData.length > 0) {
            updateMapMarkers();
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize Google Maps. Please try again later.');
      }
    };

    // Check if Google Maps API is already loaded
    if (window.google?.maps) {
      initializeMap();
    } else {
      setMapError('Google Maps API is not available.');
    }
  }, [sensorData, loading]);

  // Update map markers when sensor data changes
  useEffect(() => {
    if (googleMapRef.current && !loading) {
      updateMapMarkers();
    }
  }, [sensorData, loading]);

  // Function to update the markers on the map
  const updateMapMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker instanceof google.maps.Marker) {
        marker.setMap(null);
      } else {
        marker.map = null;
      }
    });
    markersRef.current = [];

    try {
      // Add new markers for each sensor
      sensorData.forEach((sensor) => {
        if (googleMapRef.current) {
          const aqiColor = getAqiColor(sensor.currentAqi);
          
          // Create a custom marker element
          const sensorMarkerElement = document.createElement('div');
          sensorMarkerElement.className = 'custom-marker';
          sensorMarkerElement.style.width = '40px';
          sensorMarkerElement.style.height = '40px';
          sensorMarkerElement.style.borderRadius = '50%';
          sensorMarkerElement.style.backgroundColor = aqiColor;
          sensorMarkerElement.style.border = '3px solid white';
          sensorMarkerElement.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.3)';
          sensorMarkerElement.style.display = 'flex';
          sensorMarkerElement.style.alignItems = 'center';
          sensorMarkerElement.style.justifyContent = 'center';
          sensorMarkerElement.style.color = 'white';
          sensorMarkerElement.style.fontWeight = 'bold';
          sensorMarkerElement.style.fontSize = '14px';
          sensorMarkerElement.textContent = `${sensor.currentAqi}`;
          
          // Use a normal marker as fallback if Advanced Marker is not available
          let marker;
          
          // Check if the advanced marker API is available
          if (window.google.maps.marker && 'AdvancedMarkerElement' in window.google.maps.marker) {
            // Use the newer AdvancedMarkerElement
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              map: googleMapRef.current,
              position: { lat: sensor.lat, lng: sensor.lng },
              content: sensorMarkerElement,
              title: `${sensor.name}: AQI ${sensor.currentAqi}`,
            });
            
            // Add click listener to the advanced marker
            marker.addListener('click', () => {
              onSensorSelect(sensor.id);
            });
          } else {
            // Fallback to legacy Marker
            marker = new window.google.maps.Marker({
              map: googleMapRef.current,
              position: { lat: sensor.lat, lng: sensor.lng },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: aqiColor,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
                scale: 12,
              },
              title: `${sensor.name}: AQI ${sensor.currentAqi}`,
            });
            
            // Add click listener to the legacy marker
            marker.addListener('click', () => {
              onSensorSelect(sensor.id);
            });
          }
          
          markersRef.current.push(marker);
        }
      });
    } catch (error) {
      console.error('Error updating map markers:', error);
      setMapError('Failed to update sensor markers on the map.');
    }
  };

  // If there's an error loading the map
  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted rounded-lg p-4">
        <AlertTriangleIcon size={64} className="text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
        <p className="text-center text-muted-foreground mb-4">{mapError}</p>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
        
        {/* Still show sensor list when map fails */}
        <div className="w-full max-w-md mt-6">
          <h4 className="text-md font-medium mb-2">Available Sensors:</h4>
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2">
              {sensorData.map(sensor => (
                <Button 
                  key={sensor.id}
                  variant="ghost" 
                  className="w-full justify-start mb-1"
                  onClick={() => onSensorSelect(sensor.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: getAqiColor(sensor.currentAqi) }}
                  />
                  {sensor.name} - AQI: {sensor.currentAqi}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Render the map
  return (
    <div className="relative h-[500px]">
      <div ref={mapRef} className="w-full h-full"></div>
      
      {/* Sensor List Overlay */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md max-h-[300px] w-64 opacity-90 hover:opacity-100 transition-opacity">
        <h4 className="text-sm font-medium mb-2 px-2">Sensor Locations</h4>
        <ScrollArea className="h-[260px]">
          <div className="space-y-1 p-2">
            {sensorData.map(sensor => (
              <Button 
                key={sensor.id}
                variant="ghost" 
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => onSensorSelect(sensor.id)}
              >
                <div 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: getAqiColor(sensor.currentAqi) }}
                />
                {sensor.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}