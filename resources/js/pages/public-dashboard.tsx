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

const initialSensors: SensorLocation[] = [
  {
    id: 1,
    name: 'Colombo Fort',
    lat: 6.9271,
    lng: 79.8612,
    currentAqi: 70,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Galle Face',
    lat: 6.9293,
    lng: 79.8431,
    currentAqi: 60,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Bambalapitiya',
    lat: 6.8912,
    lng: 79.8562,
    currentAqi: 85,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Kollupitiya',
    lat: 6.9018,
    lng: 79.8507,
    currentAqi: 50,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Dehiwala',
    lat: 6.8541,
    lng: 79.8657,
    currentAqi: 45,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 6,
    name: 'Borella',
    lat: 6.9146,
    lng: 79.8782,
    currentAqi: 95,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 7,
    name: 'Wellawatte',
    lat: 6.8790,
    lng: 79.8594,
    currentAqi: 55,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 8,
    name: 'Pettah',
    lat: 6.9362,
    lng: 79.8487,
    currentAqi: 110,
    mainPollutant: 'PM2.5',
    temperature: 30,
    humidity: 65,
    windSpeed: 4.2,
    lastUpdated: new Date().toISOString()
  }
];

const generateMockHistoricalData = (timeRange: string, sensorId: number): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const selectedSensor = initialSensors.find(sensor => sensor.id === sensorId) || initialSensors[0];
  
  // Calculate base AQI from current sensor data or use default
  const currentAqi = selectedSensor.currentAqi || 50;
  
  // Get actual pollutant data if available from Google API
  const hasRealData = selectedSensor.pollutantData && Object.keys(selectedSensor.pollutantData).length > 0;
  
  // Generate based on time range
  if (timeRange === 'day') {
    // Last 24 hours, hourly data
    for (let i = 0; i < 24; i++) {
      const hour = 23 - i;
      const hourFormatted = hour.toString().padStart(2, '0') + ':00';
      
      // More realistic hourly pattern with:
      // - Higher pollution in morning and evening rush hours (7-9am and 5-7pm)
      // - Lower pollution in middle of night (1-4am)
      let hourlyPattern = 1.0;
      if (hour >= 7 && hour <= 9) hourlyPattern = 1.3; // Morning rush
      else if (hour >= 17 && hour <= 19) hourlyPattern = 1.25; // Evening rush
      else if (hour >= 1 && hour <= 4) hourlyPattern = 0.7; // Middle of night
      else if (hour >= 11 && hour <= 14) hourlyPattern = 0.9; // Midday
      
      // Base AQI that fluctuates based on current AQI and hourly pattern
      const baseAqi = currentAqi * hourlyPattern;
      const variation = Math.sin(hour / 6 * Math.PI) * (currentAqi * 0.15); // Sine wave pattern
      const randomVariation = hasRealData ? (Math.random() * currentAqi * 0.1) : (Math.random() * 15);
      const aqi = Math.max(20, Math.min(350, Math.round(baseAqi + variation + randomVariation)));
      
      data.push({
        time: hourFormatted,
        aqi: aqi,
        pollutant: selectedSensor.mainPollutant || 'PM2.5',
        temperature: Math.round((selectedSensor.temperature || 30) + (Math.random() * 2 - 1)),
        humidity: Math.round((selectedSensor.humidity || 65) + (Math.random() * 5 - 2.5)),
        windSpeed: parseFloat(((selectedSensor.windSpeed || 4) + (Math.random() * 1.5 - 0.75)).toFixed(1))
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
      
      // Base AQI with more realistic variations based on current AQI and day of week
      const baseAqi = currentAqi * dayPattern;
      const variation = Math.sin(i / 7 * Math.PI * 2) * (currentAqi * 0.12); // Sinusoidal pattern
      const randomVariation = hasRealData ? (Math.random() * currentAqi * 0.08) : (Math.random() * 12);
      const aqi = Math.max(20, Math.min(350, Math.round(baseAqi + variation + randomVariation)));
      
      data.push({
        date: dateStr,
        aqi: aqi,
        pollutant: selectedSensor.mainPollutant || 'PM2.5',
        temperature: Math.round((selectedSensor.temperature || 30) + (Math.random() * 4 - 2)),
        humidity: Math.round((selectedSensor.humidity || 65) + (Math.random() * 10 - 5)),
        windSpeed: parseFloat(((selectedSensor.windSpeed || 4) + (Math.random() * 3 - 1.5)).toFixed(1))
      });
    }
  } else { // month
    // Last 30 days, data every 3 days
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 3);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Monthly pattern with weather influence
      // - More pollution in middle of month (work time)
      // - Slightly less at beginning/end (common vacation periods)
      const dayOfMonth = date.getDate();
      let monthPattern = 1.0;
      if (dayOfMonth > 7 && dayOfMonth < 22) monthPattern = 1.1;
      else if (dayOfMonth < 5 || dayOfMonth > 25) monthPattern = 0.9;
      
      // Base AQI with monthly pattern and seasonal influences
      const baseAqi = currentAqi * monthPattern;
      const seasonalFactor = 1 + (Math.sin(date.getMonth() / 6 * Math.PI) * 0.2); // Seasonal variations
      const randomVariation = hasRealData ? (Math.random() * currentAqi * 0.06) : (Math.random() * 15);
      const aqi = Math.max(20, Math.min(350, Math.round(baseAqi * seasonalFactor + randomVariation)));
      
      data.push({
        date: dateStr,
        aqi: aqi,
        pollutant: selectedSensor.mainPollutant || 'PM2.5',
        temperature: Math.round((selectedSensor.temperature || 30) + (Math.random() * 6 - 3)),
        humidity: Math.round((selectedSensor.humidity || 65) + (Math.random() * 15 - 7.5)),
        windSpeed: parseFloat(((selectedSensor.windSpeed || 4) + (Math.random() * 4 - 2)).toFixed(1))
      });
    }
  }
  
  return data;
};

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorLocation[]>(initialSensors);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<number>(1);
  const [timeRange, setTimeRange] = useState<string>('day');
  const [usingRealData, setUsingRealData] = useState<boolean>(true);
  const [mapLoadingStarted, setMapLoadingStarted] = useState<boolean>(false);
  
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
    
    // Fetch air quality data when component mounts
    fetchAirQualityData();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchAirQualityData, 5 * 60 * 1000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);
  
  const fetchAirQualityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Map through each sensor and fetch updated data
      const updatedSensors = await Promise.all(
        sensors.map(async (sensor) => {
          try {
            return await AirQualityService.fetchSensorData(sensor);
          } catch (err) {
            console.error(`Error fetching data for sensor ${sensor.name}:`, err);
            // Return the original sensor but mark we're using simulated data
            setUsingRealData(false);
            return AirQualityService.generateSimulatedSensorData(sensor);
          }
        })
      );
      
      setSensors(updatedSensors);
    } catch (err) {
      console.error('Error updating air quality data:', err);
      setError('Unable to fetch the latest air quality data. Using simulated data instead.');
      // Generate simulated data for all sensors
      const simulatedSensors = sensors.map(sensor => 
        AirQualityService.generateSimulatedSensorData(sensor)
      );
      setSensors(simulatedSensors);
      setUsingRealData(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Get the currently selected sensor
  const selectedSensor = sensors.find(sensor => sensor.id === selectedSensorId) || sensors[0];

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
            <Card className="md:col-span-12 lg:col-span-4">
              <CardHeader className="p-4">
                <CardTitle>{selectedSensor.name} - Current Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <AirQualityStats sensor={selectedSensor} loading={loading} />
              </CardContent>
            </Card>
            
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
            
            {/* Charts */}
            <Card className="md:col-span-12">
              <CardHeader className="p-4">
                <CardTitle>Historical Data</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Add the HistoricalDataSection component */}
                <HistoricalDataSection 
                  selectedSensor={selectedSensorId}
                  timeRange={timeRange}
                  historicalData={generateMockHistoricalData(timeRange, selectedSensorId)}
                  sensorData={sensors}
                  onSensorSelect={setSelectedSensorId}
                  onTimeRangeChange={(range) => {
                    setTimeRange(range);
                  }}
                />
                
                <div className="mt-4 text-xs text-muted-foreground">
                  <InfoIcon className="inline h-3 w-3 mr-1" />
                  Historical data charts are simulated for demonstration purposes.
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}