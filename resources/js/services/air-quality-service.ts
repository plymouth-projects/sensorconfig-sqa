import axios from 'axios';
import { SensorLocation } from '@/types/air-quality';

// Define interfaces for Google Air Quality API responses
interface GoogleAirQualityPollutant {
  code: string;
  displayName?: string;
  fullName?: string;
  concentration?: {
    value: number;
    units: string;
  };
  additionalInfo?: Record<string, any>;
}

interface GoogleAirQualityIndex {
  code?: string;
  displayName?: string;
  aqi: number;
  aqiDisplay?: string;
  color?: {
    hex: string;
    rgb?: {
      red: number;
      green: number;
      blue: number;
    }
  };
  category?: string;
}

interface GoogleAirQualityResponse {
  dateTime?: string;
  regionCode?: string;
  indexes?: GoogleAirQualityIndex[];
  pollutants?: GoogleAirQualityPollutant[];
  dominantPollutant?: GoogleAirQualityPollutant;
  healthRecommendations?: Record<string, string>;
  regionalAqis?: GoogleAirQualityIndex[];
  weather?: {
    temperature?: {
      value: number;
      units: string;
    };
    humidity?: {
      value: number;
      units: string;
    };
    windSpeed?: {
      value: number;
      units: string;
    };
  };
}

/**
 * Service layer for air quality data
 */
export class AirQualityService {
  /**
   * Fetch air quality data from Google Air Quality API
   * @param sensor The sensor location to fetch data for
   * @returns Updated sensor with real data or simulated fallback
   */
  static async fetchSensorData(sensor: SensorLocation): Promise<SensorLocation> {
    try {
      // Using Google Air Quality API
      const apiKey = import.meta.env.VITE_GOOGLE_AIR_QUALITY_API_KEY;
      
      // Build the API request URL for Google Air Quality API
      const baseUrl = 'https://airquality.googleapis.com/v1/currentConditions:lookup';
      
      // Prepare the request body according to Google API specifications
      const requestBody = {
        location: {
          latitude: sensor.lat,
          longitude: sensor.lng
        },
        extraComputations: ["POLLUTANT_CONCENTRATION", "HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION", "LOCAL_AQI", "POLLUTANT_ADDITIONAL_INFO"],
        languageCode: "en"
      };
      
      const response = await axios.post(`${baseUrl}?key=${apiKey}`, requestBody);
      
      // If we get a successful response
      if (response.data) {
        const data: GoogleAirQualityResponse = response.data;
        
        // Extract main AQI value
        const aqiInfo = data.indexes && data.indexes.length > 0 
          ? data.indexes[0] 
          : null;
          
        // Get the AQI value, defaulting to current value if not available
        const aqi = aqiInfo?.aqi || sensor.currentAqi;
        
        // Get the AQI category and color
        const aqiCategory = aqiInfo?.category || '';
        const aqiColor = aqiInfo?.color?.hex || '';
        
        // Extract all pollutant data
        const pollutants = data.pollutants || [];
        const pollutantData: Record<string, { concentration: number; units: string; additionalInfo?: Record<string, any> }> = {};
        
        // Process each pollutant and store their values
        pollutants.forEach((pollutant: GoogleAirQualityPollutant) => {
          const code = this.formatPollutantCode(pollutant.code);
          pollutantData[code] = {
            concentration: pollutant.concentration?.value || 0,
            units: pollutant.concentration?.units || '',
            additionalInfo: pollutant.additionalInfo || {}
          };
        });
        
        // Extract dominant pollutant information
        const dominantPollutantInfo = data.dominantPollutant || null;
        const mainPollutant = dominantPollutantInfo 
          ? this.formatPollutantCode(dominantPollutantInfo.code)
          : pollutants.length > 0 
            ? this.formatPollutantCode(pollutants[0].code) 
            : 'PM2.5';
            
        // Extract health recommendations if available
        const healthRecommendations = data.healthRecommendations || {};
        
        // Get local AQI information (region-specific standards)
        const localAqi = data.regionalAqis || [];
        const localAqiData: Record<string, { aqi: number; displayName?: string; aqiDisplay?: string }> = {};
        
        localAqi.forEach((item: GoogleAirQualityIndex) => {
          if (item.code) {
            localAqiData[item.code] = {
              aqi: item.aqi,
              displayName: item.displayName || '',  // Default to empty string if undefined
              aqiDisplay: item.aqiDisplay || ''     // Default to empty string if undefined
            };
          }
        });
        
        // Extract or generate weather data
        // In a production app, you would likely get this from a dedicated weather API
        let temperature = sensor.temperature;
        let humidity = sensor.humidity;
        let windSpeed = sensor.windSpeed;
        
        // If the API response includes weather data, use that
        if (data.weather) {
          temperature = data.weather.temperature?.value || temperature;
          humidity = data.weather.humidity?.value || humidity;
          windSpeed = data.weather.windSpeed?.value || windSpeed;
        } else {
          // Otherwise generate reasonable values
          temperature = Math.round(27 + (Math.random() * 6) - 3); // 24-33°C
          humidity = Math.round(60 + (Math.random() * 20) - 10); // 50-80%
          windSpeed = Math.round((Math.random() * 20) * 10) / 10; // 0-20 km/h
        }
        
        // Create enriched sensor data with all available information
        return {
          ...sensor,
          currentAqi: Math.round(aqi),
          mainPollutant,
          temperature,
          humidity,
          windSpeed,
          lastUpdated: new Date().toISOString(),
          // Add additional data that can be used elsewhere in the application
          aqiCategory,
          aqiColor,
          pollutantData,
          healthRecommendations,
          localAqiData
        };
      } else {
        // If the API response isn't successful, fall back to simulated data
        console.warn('Google Air Quality API response missing expected data, using simulated data');
        return this.generateSimulatedSensorData(sensor);
      }
    } catch (err) {
      console.error(`Error fetching data for sensor ${sensor.name} from Google Air Quality API:`, err);
      
      // Fallback to simulated data if API call fails
      return this.generateSimulatedSensorData(sensor);
    }
  }
  
  /**
   * Format pollutant code to match the application's expected format
   * @param code The pollutant code from Google API
   * @returns Formatted pollutant code
   */
  static formatPollutantCode(code: string): string {
    // Map Google API pollutant codes to our application format
    const pollutantMap: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'O3',
      'no2': 'NO2',
      'so2': 'SO2',
      'co': 'CO'
    };
    
    return pollutantMap[code.toLowerCase()] || code;
  }
  
  /**
   * Generate simulated sensor data with random variations
   * @param sensor The base sensor to add simulated data to
   * @returns Sensor with simulated data
   */
  static generateSimulatedSensorData(sensor: SensorLocation): SensorLocation {
    const variation = Math.floor(Math.random() * 20) - 10; // Random variation of ±10
    const aqi = Math.max(10, Math.min(sensor.currentAqi + variation, 350));
    
    const pollutants = ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'];
    const mainPollutant = pollutants[Math.floor(Math.random() * pollutants.length)];
    const temperature = Math.round(27 + (Math.random() * 6) - 3); // 24-33°C
    const humidity = Math.round(60 + (Math.random() * 20) - 10); // 50-80%
    const windSpeed = Math.round((Math.random() * 20) * 10) / 10; // 0-20 km/h
    
    return {
      ...sensor,
      currentAqi: aqi,
      mainPollutant,
      temperature,
      humidity,
      windSpeed,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Load Google Maps API script dynamically using the recommended async pattern
   * @param callback Function to call when API is loaded
   */
  static loadGoogleMapsAPI(callback: () => void): void {
    if (window.google?.maps) {
      callback();
      return;
    }
    
    // Create a global callback function
    window.initMap = () => {
      // Check if we have a valid map instance or handle error gracefully
      if (window.google && window.google.maps) {
        callback();
      } else {
        console.error('Google Maps failed to load properly');
        // Continue with application in a degraded state
        callback();
      }
    };
    
    // Create script with async attribute
    const script = document.createElement('script');
    
    // Use the API key or a development fallback for demonstration
    // Note: In production, you should always use a proper API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Demo key for development only
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Add error handling
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      // Try loading with no API key as last resort for development
      if (apiKey !== '') {
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://maps.googleapis.com/maps/api/js?callback=initMap';
        fallbackScript.async = true;
        fallbackScript.defer = true;
        fallbackScript.onerror = () => {
          console.error('Failed to load Google Maps API even without key');
          callback();
        };
        document.head.appendChild(fallbackScript);
      } else {
        // Continue with application in a degraded state
        callback();
      }
    };
    
    document.head.appendChild(script);
  }
}