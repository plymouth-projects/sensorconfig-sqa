import React from 'react';
import { SensorLocation } from '@/types/air-quality';
import { getAqiColor, getAqiLevel } from '@/utils/air-quality';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ThermometerIcon, 
  DropletIcon, 
  WindIcon, 
  ClockIcon, 
  AlertTriangleIcon 
} from 'lucide-react';

interface AirQualityStatsProps {
  sensor: SensorLocation;
  loading?: boolean;
}

export function AirQualityStats({ sensor, loading = false }: AirQualityStatsProps) {
  const aqiColor = getAqiColor(sensor.currentAqi);
  const aqiLevel = getAqiLevel(sensor.currentAqi);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* AQI Circle */}
      <div className="flex flex-col items-center justify-center p-4">
        <div 
          className="w-28 h-28 rounded-full flex items-center justify-center mb-2"
          style={{ 
            backgroundColor: aqiColor,
            boxShadow: `0 0 15px ${aqiColor}80`,
            color: sensor.currentAqi > 100 ? 'white' : 'black'
          }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold">{sensor.currentAqi}</div>
            <div className="text-xs font-medium">AQI</div>
          </div>
        </div>
        <div className="text-lg font-semibold mt-2">{aqiLevel}</div>
        
        {sensor.mainPollutant && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <AlertTriangleIcon className="w-4 h-4 mr-1" />
            Main pollutant: {sensor.mainPollutant}
          </div>
        )}
      </div>
      
      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Temperature */}
        <div className="flex items-center p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 mr-3">
            <ThermometerIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Temperature</div>
            <div className="text-lg font-medium">
              {sensor.temperature !== undefined ? `${sensor.temperature}°C` : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Humidity */}
        <div className="flex items-center p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
            <DropletIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Humidity</div>
            <div className="text-lg font-medium">
              {sensor.humidity !== undefined ? `${sensor.humidity}%` : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Wind Speed */}
        <div className="flex items-center p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/30 mr-3">
            <WindIcon className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Wind</div>
            <div className="text-lg font-medium">
              {sensor.windSpeed !== undefined ? `${sensor.windSpeed} km/h` : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="flex items-center p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
            <ClockIcon className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Updated</div>
            <div className="text-sm font-medium">
              {sensor.lastUpdated ? 
                new Date(sensor.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}