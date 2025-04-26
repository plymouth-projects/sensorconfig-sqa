import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs,TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { HistoricalDataPoint, SensorLocation } from '@/types/air-quality';

interface HistoricalDataSectionProps {
  selectedSensor: number | null;
  timeRange: string;
  historicalData: HistoricalDataPoint[];
  sensorData: SensorLocation[];
  onSensorSelect: (sensorId: number) => void;
  onTimeRangeChange: (range: string) => void;
}

/**
 * Component for the historical data section
 */
export const HistoricalDataSection: React.FC<HistoricalDataSectionProps> = ({
  selectedSensor,
  timeRange,
  historicalData,
  sensorData,
  onSensorSelect,
  onTimeRangeChange
}) => {
  return (
    <Card className="mt-6">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center">
          <TrendingUp className="mr-2 h-5 w-5" /> 
          Historical Data
        </CardTitle>
        <CardDescription>
          View historical air quality trends for specific locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Sensor Location
            </label>
            <Select
              value={selectedSensor?.toString() || ''}
              onValueChange={(value) => onSensorSelect(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {sensorData.map(sensor => (
                  <SelectItem key={sensor.id} value={sensor.id.toString()}>
                    {sensor.name} (Current AQI: {sensor.currentAqi})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedSensor && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Time Range
              </label>
              <Tabs value={timeRange} onValueChange={onTimeRangeChange} className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="day">Last 24 Hours</TabsTrigger>
                  <TabsTrigger value="week">Last Week</TabsTrigger>
                  <TabsTrigger value="month">Last Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
        
        {selectedSensor ? (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">
              {sensorData.find(s => s.id === selectedSensor)?.name} - Historical AQI Data
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={timeRange === 'day' ? 'time' : 'date'} 
                    tick={{ fontSize: 12 }}
                    interval={timeRange === 'day' ? 1 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    label={{ value: 'AQI Value', angle: -90, position: 'insideLeft' }}
                    domain={[0, 'dataMax + 50']}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} AQI`, 'Air Quality']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aqi" 
                    name="Air Quality Index" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Download Data
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download historical data (CSV)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 bg-muted/20 rounded-lg mt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-muted-foreground h-10 w-10 mb-2" />
              <h3 className="text-lg font-medium">No Sensor Selected</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                Please select a sensor location from the dropdown menu to view historical data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};