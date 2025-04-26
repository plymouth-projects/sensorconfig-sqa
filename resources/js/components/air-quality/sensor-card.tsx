import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { SensorLocation } from '@/types/air-quality';
import { getAqiColor, getAqiLevel, generateHistoricalData } from '@/utils/air-quality';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  sensor: SensorLocation;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Component for displaying sensor information in a card format
 */
export const SensorCard: React.FC<SensorCardProps> = ({ sensor, onClick, isSelected }) => {
  const aqiColor = getAqiColor(sensor.currentAqi);
  
  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer", 
        isSelected 
          ? "ring-2 ring-primary shadow-md" 
          : "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="mb-2 font-bold">{sensor.name}</div>
        <div 
          className="p-2 mb-2 text-center font-bold rounded-md" 
          style={{ backgroundColor: aqiColor, color: sensor.currentAqi > 100 ? 'white' : 'black' }}
        >
          AQI: {sensor.currentAqi} - {getAqiLevel(sensor.currentAqi)}
        </div>
        <div className="text-xs text-muted-foreground">
          Location: {sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}
        </div>
        <div className="h-24 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={generateHistoricalData(sensor.id, 1).slice(-8)}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="aqi" 
                stroke={aqiColor} 
                fill={aqiColor} 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};