import { AqiLevel, HistoricalDataPoint, SensorLocation } from '@/types/air-quality';

/**
 * Get color for AQI value
 * @param aqi Air Quality Index value
 * @returns Color code corresponding to AQI level
 */
export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'; // Good - Green
  if (aqi <= 100) return '#ffff00'; // Moderate - Yellow
  if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups - Orange
  if (aqi <= 200) return '#ff0000'; // Unhealthy - Red
  if (aqi <= 300) return '#99004c'; // Very Unhealthy - Purple
  return '#7e0023'; // Hazardous - Maroon
}

/**
 * Get text description for AQI value
 * @param aqi Air Quality Index value
 * @returns Text describing air quality level
 */
export function getAqiLevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Get health implications for AQI value
 * @param aqi Air Quality Index value
 * @returns Text describing health implications
 */
export function getAqiHealthImplications(aqi: number): string {
  if (aqi <= 50) {
    return 'Air quality is satisfactory, and air pollution poses little or no risk.';
  }
  if (aqi <= 100) {
    return 'Air quality is acceptable. However, some pollutants may be a moderate health concern for a very small number of individuals.';
  }
  if (aqi <= 150) {
    return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  }
  if (aqi <= 200) {
    return 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
  }
  if (aqi <= 300) {
    return 'Health alert: The risk of health effects is increased for everyone.';
  }
  return 'Health warning of emergency conditions: everyone is more likely to be affected.';
}

/**
 * Get cautionary statement for AQI value
 * @param aqi Air Quality Index value
 * @returns Text with cautionary advice
 */
export function getAqiCautionaryStatement(aqi: number): string {
  if (aqi <= 50) {
    return 'None';
  }
  if (aqi <= 100) {
    return 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.';
  }
  if (aqi <= 150) {
    return 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.';
  }
  if (aqi <= 200) {
    return 'Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion.';
  }
  if (aqi <= 300) {
    return 'Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion.';
  }
  return 'Everyone should avoid all outdoor exertion.';
}

/**
 * Generate historical data for demonstration purposes
 * @param sensorId ID of the sensor
 * @param days Number of days to generate data for
 * @returns Array of historical data points
 */
export function generateHistoricalData(sensorId: number, days: number): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();
  const baseAqi = 30 + (sensorId % 8) * 10; // Different base AQI for each sensor
  
  // Generate data points
  for (let i = 0; i < days * 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Go back by hours
    
    // Add some variation to AQI
    // Morning and evening peaks, with some randomness
    const hourOfDay = timestamp.getHours();
    let variation = 0;
    
    // Morning peak (7-9 AM)
    if (hourOfDay >= 7 && hourOfDay <= 9) {
      variation = 20 + Math.random() * 15;
    } 
    // Evening peak (5-8 PM)
    else if (hourOfDay >= 17 && hourOfDay <= 20) {
      variation = 25 + Math.random() * 20;
    }
    // Normal hours with less pollution
    else {
      variation = Math.random() * 15;
    }
    
    // Add some weekly patterns
    const dayOfWeek = timestamp.getDay();
    // Weekdays have higher pollution
    const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.8;
    
    // Calculate final AQI with randomness
    const finalAqi = Math.max(10, Math.min(350, Math.round(baseAqi + variation * weekdayFactor)));
    
    // Generate temperature with day/night cycle
    const baseTempDay = 28 + (Math.random() * 4) - 2; // 26-32°C during day
    const baseTempNight = 22 + (Math.random() * 4) - 2; // 20-26°C during night
    const isDayTime = hourOfDay >= 6 && hourOfDay <= 18;
    const temperature = isDayTime ? baseTempDay : baseTempNight;
    
    // Generate humidity (higher at night and early morning)
    const isHighHumidityTime = hourOfDay >= 18 || hourOfDay <= 8;
    const humidity = isHighHumidityTime 
      ? 70 + (Math.random() * 15) 
      : 50 + (Math.random() * 15);
    
    // Generate wind speed (higher during day)
    const windSpeed = isDayTime 
      ? 5 + (Math.random() * 10) 
      : 2 + (Math.random() * 5);
    
    data.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      aqi: finalAqi,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10
    });
  }
  
  return data;
}

/**
 * AQI levels information for reference
 */
export const aqiLevels: AqiLevel[] = [
  {
    level: 'Good',
    range: '0-50',
    color: '#00e400',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.'
  },
  {
    level: 'Moderate',
    range: '51-100',
    color: '#ffff00',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'
  },
  {
    level: 'Unhealthy for Sensitive Groups',
    range: '101-150',
    color: '#ff7e00',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'
  },
  {
    level: 'Unhealthy',
    range: '151-200',
    color: '#ff0000',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'
  },
  {
    level: 'Very Unhealthy',
    range: '201-300',
    color: '#99004c',
    description: 'Health alert: The risk of health effects is increased for everyone.'
  },
  {
    level: 'Hazardous',
    range: '301+',
    color: '#7e0023',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.'
  }
];