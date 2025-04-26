import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { aqiLevels } from '@/utils/air-quality';

/**
 * Component for displaying the AQI legend with color codes and descriptions
 */
export const AqiLegend: React.FC = () => {
  return (
    <Card className="w-full h-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center">
          <Info className="mr-2 h-5 w-5" /> 
          AQI Legend
        </CardTitle>
        <CardDescription>
          Understanding air quality index measurements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {aqiLevels.map((level) => (
            <div key={level.level} className="flex items-center">
              <div 
                className="w-5 h-5 rounded-full mr-2" 
                style={{ backgroundColor: level.color }}
              />
              <div>
                <div className="font-medium">{level.level} ({level.range})</div>
                <div className="text-xs text-muted-foreground">{level.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Data is updated every hour. AQI values are calculated based on PM2.5, PM10, O3, NO2, SO2, and CO levels.
        </p>
      </CardFooter>
    </Card>
  );
};