// Sensor Types
export interface Sensor {
  id: number;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  lastReading?: AirQualityReading;
  createdAt: string;
  updatedAt: string;
}

// Air Quality Reading Types
export interface AirQualityReading {
  id: number;
  sensorId: number;
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

// Simulation Configuration Types
export interface SimulationConfig {
  id: number;
  isActive: boolean;
  frequency: number; // in seconds
  baselineAqi: number;
  variationRange: {
    min: number;
    max: number;
  };
  patterns: SimulationPattern[];
  lastUpdated: string;
}

export type SimulationPattern = 
  | { type: 'random'; intensity: number }
  | { type: 'time-based'; morningPeak: number; eveningPeak: number }
  | { type: 'weather-based'; rainEffect: number; windEffect: number };

// Alert Configuration Types
export interface AlertThreshold {
  id: number;
  name: string; // e.g., "Good", "Moderate", "Unhealthy"
  range: {
    min: number;
    max: number;
  };
  color: string; // Hex color for UI display
  description: string;
  notifications: boolean; // Whether to show notifications for this level
  message?: string; // Custom message for notifications
}

// Admin User Types
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'monitoring_admin';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

// System Status Types
export interface SystemStatus {
  activeSensors: number;
  simulationStatus: 'running' | 'stopped';
  alertsToday: number;
  lastDataUpdate: string;
  systemHealth: 'healthy' | 'warning' | 'error';
  memoryUsage: number;
  cpuLoad: number;
} 