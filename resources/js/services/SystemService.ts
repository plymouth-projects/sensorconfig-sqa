import axios from 'axios';
import { SystemStatus } from '@/types/sensor';

const API_URL = '/api/system';

// Initialize system status from localStorage or use defaults
const getStoredSimulationStatus = (): 'running' | 'stopped' => {
  try {
    const stored = localStorage.getItem('systemSimulationStatus');
    return stored === 'running' ? 'running' : 'stopped';
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return 'stopped'; // Default to stopped if there's an error
  }
};

// Mock data for system dashboard since API endpoints don't exist yet
const MOCK_SYSTEM_STATUS: SystemStatus = {
  systemHealth: 'healthy',
  activeSensors: 24,
  simulationStatus: getStoredSimulationStatus(),
  alertsToday: 3,
  lastDataUpdate: new Date().toISOString(),
  memoryUsage: 42,
  cpuLoad: 28
};

// Mock sensors data
const MOCK_SENSORS = Array(MOCK_SYSTEM_STATUS.activeSensors).fill(0).map((_, i) => ({
  id: i + 1,
  name: `Sensor ${i + 1}`,
  location: `Location ${i + 1}`,
  lastReading: {
    timestamp: new Date().toISOString(),
    aqi: Math.floor(20 + Math.random() * 150),
    pm25: Math.floor(10 + Math.random() * 40),
    pm10: Math.floor(20 + Math.random() * 60)
  }
}));

// Simulation interval in milliseconds (30 minutes)
const SIMULATION_INTERVAL = 30 * 60 * 1000;

// For demo purposes, we'll use a shorter interval
const DEMO_SIMULATION_INTERVAL = 60 * 1000; // 1 minute for demonstration

let simulationTimer: number | null = null;

// Function to generate new AQI readings for sensors
const generateSensorReadings = () => {
  console.log('Generating new sensor readings...');
  const currentTime = new Date().toISOString();
  
  // Update each sensor with new readings
  MOCK_SENSORS.forEach(sensor => {
    // Generate random but somewhat realistic AQI values
    const baseAqi = sensor.lastReading.aqi;
    // AQI changes by ±20 max to simulate realistic changes
    const newAqi = Math.max(0, Math.min(500, baseAqi + (Math.random() * 40 - 20)));
    
    // Update last reading
    sensor.lastReading = {
      timestamp: currentTime,
      aqi: Math.floor(newAqi),
      pm25: Math.floor(newAqi * 0.4 + Math.random() * 5),
      pm10: Math.floor(newAqi * 0.6 + Math.random() * 10)
    };
  });
  
  // Update system status
  MOCK_SYSTEM_STATUS.lastDataUpdate = currentTime;
  
  // Save to localStorage to persist the state
  localStorage.setItem('mockSensorsData', JSON.stringify(MOCK_SENSORS));
  
  return MOCK_SENSORS;
};

// Start or stop the simulation based on the status
const updateSimulationState = (status: 'running' | 'stopped') => {
  if (status === 'running') {
    // Start simulation if it's not already running
    if (!simulationTimer) {
      // Generate initial readings
      generateSensorReadings();
      
      // Set up interval for future updates
      simulationTimer = window.setInterval(() => {
        generateSensorReadings();
        // Here in a real app, we would also update UI or notify subscribers
        console.log('Simulation cycle complete');
      }, DEMO_SIMULATION_INTERVAL);
      
      console.log('Simulation started with interval:', DEMO_SIMULATION_INTERVAL);
    }
  } else {
    // Stop simulation if it's running
    if (simulationTimer) {
      window.clearInterval(simulationTimer);
      simulationTimer = null;
      console.log('Simulation stopped');
    }
  }
};

// Initial setup - check if simulation should be running
if (MOCK_SYSTEM_STATUS.simulationStatus === 'running') {
  // Start simulation on load if status is running
  updateSimulationState('running');
}

const MOCK_LOGS = Array(20).fill(0).map((_, i) => ({
  timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
  level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)] as 'info' | 'warning' | 'error',
  message: [
    'System check completed successfully',
    'Sensor data collected from all active sensors',
    'User authentication succeeded',
    'Alert triggered for sensor S-123',
    'Database backup completed',
    'Memory usage above 80%',
    'API rate limit reached',
    'Failed to connect to external service',
    'Invalid configuration detected'
  ][Math.floor(Math.random() * 9)],
  source: ['System', 'Sensor', 'Auth', 'API', 'Database'][Math.floor(Math.random() * 5)]
}));

const generateMetrics = (points: number) => {
  const now = Date.now();
  const timestamps = Array(points).fill(0).map((_, i) => new Date(now - (i * 3600000)).toISOString());
  
  // Generate realistic-looking metrics
  const cpu = Array(points).fill(0).map(() => Math.floor(20 + Math.random() * 50));
  const memory = Array(points).fill(0).map(() => Math.floor(30 + Math.random() * 40));
  const activeUsers = Array(points).fill(0).map(() => Math.floor(5 + Math.random() * 20));
  const apiRequests = Array(points).fill(0).map(() => Math.floor(10 + Math.random() * 90));
  
  return {
    timestamps: timestamps.reverse(),
    cpu: cpu.reverse(),
    memory: memory.reverse(),
    activeUsers: activeUsers.reverse(),
    apiRequests: apiRequests.reverse()
  };
};

const MOCK_METRICS = {
  hour: generateMetrics(12),
  day: generateMetrics(24),
  week: generateMetrics(7)
};

// Save simulation status to localStorage
const saveSimulationStatus = (status: 'running' | 'stopped') => {
  try {
    localStorage.setItem('systemSimulationStatus', status);
    // Update the simulation state based on the new status
    updateSimulationState(status);
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};

export const SystemService = {
  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await axios.get(`${API_URL}/status`);
    return response.data;
  },

  /**
   * Get system logs
   */
  async getLogs(limit: number = 100, level: 'all' | 'info' | 'warning' | 'error' = 'all'): Promise<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
  }[]> {
    const response = await axios.get(`${API_URL}/logs`, {
      params: { limit, level }
    });
    return response.data;
  },

  /**
   * Get system metrics over time
   */
  async getMetrics(timespan: 'hour' | 'day' | 'week' = 'day'): Promise<{
    timestamps: string[];
    cpu: number[];
    memory: number[];
    activeUsers: number[];
    apiRequests: number[];
  }> {
    const response = await axios.get(`${API_URL}/metrics`, {
      params: { timespan }
    });
    return response.data;
  },

  /**
   * Perform system maintenance (cleanup old data)
   */
  async performMaintenance(): Promise<{ status: string; message: string }> {
    const response = await axios.post(`${API_URL}/maintenance`);
    return response.data;
  },

  /**
   * Restart simulation services
   */
  async restartServices(service: 'simulation' | 'alerts' | 'all'): Promise<{ status: string; message: string }> {
    const response = await axios.post(`${API_URL}/restart`, { service });
    return response.data;
  },

  /**
   * Stop simulation service
   */
  async stopSimulation(): Promise<{ status: string; message: string }> {
    const response = await axios.post(`/api/simulation/stop`);
    return response.data;
  },

  /**
   * Start simulation service
   */
  async startSimulation(): Promise<{ status: string; message: string }> {
    const response = await axios.post(`/api/simulation/start`);
    return response.data;
  },

  /**
   * Get sensor data with latest AQI readings
   */
  async getSensorsData(): Promise<any[]> {
    const response = await axios.get('/api/sensors');
    return response.data;
  },

  /**
   * Set simulation interval (in minutes)
   */
  async setSimulationInterval(minutes: number): Promise<{ status: string; message: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (minutes < 1) {
          resolve({
            status: 'error',
            message: 'Simulation interval must be at least 1 minute'
          });
          return;
        }

        // In a real app, we would update the database or configuration
        // For demo, we'll just use our local variable and log it
        const milliseconds = minutes * 60 * 1000;
        console.log(`Setting simulation interval to ${minutes} minutes (${milliseconds}ms)`);
        
        // If simulation is running, restart it with new interval
        if (MOCK_SYSTEM_STATUS.simulationStatus === 'running') {
          if (simulationTimer) {
            window.clearInterval(simulationTimer);
            simulationTimer = null;
          }
          updateSimulationState('running');
        }
        
        resolve({
          status: 'success',
          message: `Simulation interval set to ${minutes} minutes`
        });
      }, 500);
    });
  }
}; 