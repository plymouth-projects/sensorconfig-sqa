import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import air quality components individually
import { AirQualityMap } from '@/components/air-quality/air-quality-map';
import { AirQualityStats } from '@/components/air-quality/air-quality-stats';
import { HistoricalDataSection } from '@/components/air-quality/historical-data-section';
import { AqiLegend } from '@/components/air-quality/aqi-legend';
import { SensorCard } from '@/components/air-quality/sensor-card';

import { LightRays } from '@/components/bg-lightrays';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangleIcon } from 'lucide-react'; 
import { SensorLocation, HistoricalDataPoint } from '@/types/air-quality';
import { AirQualityService } from '@/services/air-quality-service';
import { SensorService } from '@/services/SensorService';
import axios from 'axios';

// Add this function to fetch historical readings from the database
const fetchHistoricalReadings = async (sensorId: number, timeRange: string): Promise<HistoricalDataPoint[]> => {
  try {
    // Define the time range in hours or days
    let timeUnit = 'hours';
    let timeValue = 24;
    
    if (timeRange === 'week') {
      timeUnit = 'days';
      timeValue = 7;
    } else if (timeRange === 'month') {
      timeUnit = 'days';
      timeValue = 30;
    }
    
    // Call API to get historical readings for this sensor
    const response = await axios.get(`/api/sensors/${sensorId}/readings/historical`, {
      params: { 
        time_unit: timeUnit,
        time_value: timeValue
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid historical data format received:', response.data);
      return [];
    }
    
    // Transform API response to match HistoricalDataPoint format
    return response.data.map((reading: any) => {
      const timestamp = new Date(reading.timestamp);
      let dataPoint: HistoricalDataPoint = {
        aqi: reading.aqi,
        pollutant: 'PM2.5' // Default pollutant since we don't have this in basic readings
      };
      
      // Format date or time based on the time range
      if (timeRange === 'day') {
        dataPoint.time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        dataPoint.date = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      return dataPoint;
    });
  } catch (error) {
    console.error(`Error fetching historical data for sensor ${sensorId}:`, error);
    return [];
  }
};

// Function to transform database sensor readings to SensorLocation format needed by components
const transformDatabaseSensor = (sensorData: any): SensorLocation => {
  // Handle location properly whether it's an object or string
  let lat = 0, lng = 0, locationAddress = '';
  
  if (sensorData.location && typeof sensorData.location === 'object') {
    lat = sensorData.location.lat || 0;
    lng = sensorData.location.lng || 0;
    locationAddress = sensorData.location.address || '';
  } else {
    // If the sensor record has separate latitude/longitude fields
    lat = sensorData.latitude || 0;
    lng = sensorData.longitude || 0;
    locationAddress = typeof sensorData.location === 'string' ? sensorData.location : 'Unknown location';
  }
  
  // Extract the reading values or use defaults
  const aqi = sensorData.lastReading?.aqi || 0;
  const timestamp = sensorData.lastReading?.timestamp || new Date().toISOString();
  
  // Create a normalized SensorLocation object
  return {
    id: sensorData.id,
    name: sensorData.name,
    lat: lat,
    lng: lng,
    currentAqi: aqi,
    mainPollutant: 'PM2.5', // Default since many sensors don't track this specifically
    temperature: 30, // Default values when not available from DB
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: timestamp
  };
};

// Generate mock historical data as a fallback when no real data is available
const generateMockHistoricalData = (timeRange: string, sensorId: number): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();
  // Base AQI on the sensor ID to get different values for different sensors
  const baseAqi = 50 + (sensorId % 10) * 5;
  
  if (timeRange === 'day') {
    // Last 24 hours, hourly data
    for (let i = 0; i < 24; i++) {
      const hour = 23 - i;
      const hourFormatted = hour.toString().padStart(2, '0') + ':00';
      
      // More realistic variations based on time of day
      let variation = 0;
      // Morning peak (7-9 AM)
      if (hour >= 7 && hour <= 9) {
        variation = 15 + Math.random() * 10;
      } 
      // Evening peak (5-8 PM)
      else if (hour >= 17 && hour <= 20) {
        variation = 20 + Math.random() * 10;
      }
      // Normal hours
      else {
        variation = Math.random() * 15;
      }
      
      const aqi = Math.max(20, Math.min(300, Math.round(baseAqi + variation)));
      
      data.push({
        time: hourFormatted,
        aqi: aqi,
        pollutant: 'PM2.5'
      });
    }
  } else if (timeRange === 'week') {
    // Last 7 days, daily data
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Weekend vs weekday pattern
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayPattern = isWeekend ? 0.85 : 1.1; // Less pollution on weekends
      
      const variation = Math.sin(i / 7 * Math.PI * 2) * (baseAqi * 0.12);
      const randomVariation = Math.random() * baseAqi * 0.08;
      const aqi = Math.max(20, Math.min(300, Math.round(baseAqi * dayPattern + variation + randomVariation)));
      
      data.push({
        date: dateStr,
        aqi: aqi,
        pollutant: 'PM2.5'
      });
    }
  } else { // month
    // Last 30 days, data every 3 days
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 3);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Monthly pattern with weather influence
      const dayOfMonth = date.getDate();
      const monthFactor = dayOfMonth < 10 ? 0.9 : (dayOfMonth > 20 ? 0.95 : 1.1);
      
      const variation = Math.sin(i / 10 * Math.PI * 2) * (baseAqi * 0.15);
      const randomVariation = Math.random() * baseAqi * 0.1;
      const aqi = Math.max(20, Math.min(300, Math.round(baseAqi * monthFactor + variation + randomVariation)));
      
      data.push({
        date: dateStr,
        aqi: aqi,
        pollutant: 'PM2.5'
      });
    }
  }
  
  return data;
};

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<string>('day');
  const [usingRealData, setUsingRealData] = useState<boolean>(true);
  const [mapLoadingStarted, setMapLoadingStarted] = useState<boolean>(false);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [historicalDataLoading, setHistoricalDataLoading] = useState(false);
  
  // Preload Google Maps API as soon as the component mounts
  useEffect(() => {
    // Start loading the Google Maps API
    if (!mapLoadingStarted) {
      setMapLoadingStarted(true);
      
      // Pre-initialize Maps API
      AirQualityService.loadGoogleMapsAPI(() => {
        console.log('Google Maps API pre-loaded');
      });
    }
    
    // Fetch sensors from database when component mounts
    fetchSensorsFromDatabase();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchSensorsFromDatabase, 5 * 60 * 1000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    if (selectedSensorId) {
      loadHistoricalData(selectedSensorId, timeRange);
    }
  }, [selectedSensorId, timeRange]);

  // Fetch sensors from database
  const fetchSensorsFromDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all sensors from database using SensorService
      const latestReadingsData = await SensorService.getLatestReadings();
      
      if (latestReadingsData && Array.isArray(latestReadingsData) && latestReadingsData.length > 0) {
        // Transform the database sensor format to SensorLocation format for our components
        const transformedSensors = latestReadingsData.map(item => {
          const sensorLocation: SensorLocation = {
            id: item.sensor_id,
            name: item.sensor_name,
            lat: item.sensor_location.lat,
            lng: item.sensor_location.lng,
            currentAqi: item.reading ? item.reading.aqi : 0,
            mainPollutant: 'PM2.5', // Default since we don't have this info
            temperature: 30, // Default values
            humidity: 65,
            windSpeed: 4.2,
            lastUpdated: item.reading ? item.reading.timestamp : new Date().toISOString()
          };
          return sensorLocation;
        });
        
        setSensors(transformedSensors);
        setUsingRealData(true);
        
        // Set default selected sensor if none is selected yet
        if (!selectedSensorId && transformedSensors.length > 0) {
          setSelectedSensorId(transformedSensors[0].id);
        }
      } else {
        throw new Error('No sensor data received from the database');
      }
    } catch (err) {
      console.error('Error fetching sensors from database:', err);
      setError('Unable to fetch sensors from the database. Ensure the database contains sensor data.');
      setUsingRealData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async (sensorId: number, range: string) => {
    setHistoricalDataLoading(true);
    try {
      const data = await fetchHistoricalReadings(sensorId, range);
      if (data.length > 0) {
        setHistoricalData(data);
      } else {
        // Fallback to simulated data if no historical data is available
        setHistoricalData(generateMockHistoricalData(range, sensorId));
      }
    } catch (err) {
      console.error('Error loading historical data:', err);
      // Fallback to simulated data
      setHistoricalData(generateMockHistoricalData(range, sensorId));
    } finally {
      setHistoricalDataLoading(false);
    }
  };
  
  // Get the currently selected sensor
  const selectedSensor = selectedSensorId 
    ? sensors.find(sensor => sensor.id === selectedSensorId) 
    : sensors.length > 0 ? sensors[0] : null;

  return (
    <>
      <Head title="Air Quality Dashboard" />
      <div className="relative">
        <LightRays colorScheme="cool" intensity="low" interactive={true} className="fixed inset-0 -z-10" />
        <AppHeader breadcrumbs={[{ title: 'Air Quality', href: '#' }]} />
        
        <main className="container mx-auto p-4 pt-6 md:p-6">
          <h1 className="text-3xl font-bold mb-6">Colombo Air Quality Dashboard</h1>
          
          {!usingRealData && (
            <Alert variant="default" className="mb-6">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Using Simulated Data</AlertTitle>
              <AlertDescription>
                Unable to connect to the live air quality service. Displaying simulated data for demonstration purposes.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-12">
              <Card className="md:col-span-12 lg:col-span-8 h-96">
                <CardHeader className="p-4">
                  <CardTitle>Loading Air Quality Map...</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </CardContent>
              </Card>
            </div>
          ) : sensors.length === 0 ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>No Sensors Found</AlertTitle>
              <AlertDescription>
                No air quality sensors found in the database. Please add sensors through the admin panel.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6 md:grid-cols-12">
              {/* Map */}
              <Card className="md:col-span-12 lg:col-span-8 overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle>Air Quality Map</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <AirQualityMap 
                    sensorData={sensors} 
                    loading={loading}
                    onSensorSelect={setSelectedSensorId}
                  />
                </CardContent>
              </Card>
              
              {/* Stats */}
              {selectedSensor && (
                <Card className="md:col-span-12 lg:col-span-4">
                  <CardHeader className="p-4">
                    <CardTitle>{selectedSensor.name} - Current Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AirQualityStats sensor={selectedSensor} loading={loading} />
                  </CardContent>
                </Card>
              )}
              
              {/* Legend */}
              <Card className="md:col-span-12 lg:col-span-4">
                <CardHeader className="p-4">
                  <CardTitle>Air Quality Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <AqiLegend />
                </CardContent>
              </Card>
              
              {/* Sensor Cards - Top 3 Sensors by AQI */}
              <div className="md:col-span-12 lg:col-span-8 grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-1">
                {sensors
                  .sort((a, b) => b.currentAqi - a.currentAqi)
                  .slice(0, 3)
                  .map((sensor) => (
                    <SensorCard 
                      key={sensor.id}
                      sensor={sensor}
                      onClick={() => setSelectedSensorId(sensor.id)}
                      isSelected={sensor.id === selectedSensorId}
                    />
                  ))
                }
              </div>
              
              {/* Historical Charts */}
              <Card className="md:col-span-12">
                <CardHeader className="p-4">
                  <CardTitle>Historical Data</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedSensor ? (
                    <HistoricalDataSection 
                      selectedSensor={selectedSensorId || 0}
                      timeRange={timeRange}
                      historicalData={historicalData}
                      sensorData={sensors}
                      onSensorSelect={setSelectedSensorId}
                      onTimeRangeChange={(range) => {
                        setTimeRange(range);
                      }}
                      loading={historicalDataLoading}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p>No sensor data available for historical charts</p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    <InfoIcon className="inline h-3 w-3 mr-1" />
                    {historicalData.length === 0 
                      ? "Historical data charts are simulated for demonstration purposes."
                      : "Historical data charts are based on actual sensor readings from the database."}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}