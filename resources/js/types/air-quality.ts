// Air Quality API interfaces
export interface AirQualityData {
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  current: {
    pollution: {
      aqius: number; // US AQI
      mainus: string; // Main pollutant in US AQI
      aqicn: number; // China AQI
      maincn: string; // Main pollutant in China AQI
      timestamp: string;
    };
    weather: {
      temperature: number;
      humidity: number;
      wind_speed: number;
      wind_direction: number;
      timestamp: string;
    };
  };
}

/**
 * Type definitions for air quality related data
 */

export interface SensorLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  currentAqi: number;
  mainPollutant?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  lastUpdated?: string;
  // New fields for enhanced Google Air Quality API data
  aqiCategory?: string;
  aqiColor?: string;
  pollutantData?: {
    [key: string]: {
      concentration: number;
      units: string;
      additionalInfo?: any;
    }
  };
  healthRecommendations?: {
    generalPopulation?: string;
    elderly?: string;
    children?: string;
    respiratoryConditions?: string;
    heartDiseaseConditions?: string;
    athletes?: string;
    pregnantWomen?: string;
  };
  localAqiData?: Record<string, {
    aqi: number;
    displayName?: string;
    aqiDisplay?: string;
  }>;
}

export interface HistoricalDataPoint {
  time?: string;
  date?: string;
  aqi: number;
  pollutant?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number | string;
}

export interface AqiLevel {
  level: string;
  range: string;
  color: string;
  description: string;
}

// Google Maps types
declare global {
  interface Window {
    initMap: () => void;
    google: typeof google;
  }
  
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      
      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(latLng: LatLng | LatLngLiteral): void;
        addListener(event: string, handler: Function): void;
      }
      
      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        open(map?: Map, anchor?: Marker): void;
        setContent(content: string | Element): void;
      }
      
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }
      
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        streetViewControl?: boolean;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
        zoomControl?: boolean;
      }
      
      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        icon?: string | Symbol;
      }
      
      interface InfoWindowOptions {
        content?: string | Element;
        position?: LatLng | LatLngLiteral;
      }
      
      interface Symbol {
        path: SymbolPath | string;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
        scale?: number;
      }
      
      enum SymbolPath {
        CIRCLE,
        FORWARD_CLOSED_ARROW,
        FORWARD_OPEN_ARROW,
        BACKWARD_CLOSED_ARROW,
        BACKWARD_OPEN_ARROW
      }
      
      enum MapTypeId {
        ROADMAP,
        SATELLITE,
        HYBRID,
        TERRAIN
      }
    }
  }
}