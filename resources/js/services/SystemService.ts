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
  activeSensors: 6,  // Updated from 24 to 6 to match actual DB count
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
    aqi: 50, // Use a fixed default value instead of random generation
    pm25: 20, // Use a fixed default value instead of random generation
    pm10: 30  // Use a fixed default value instead of random generation
  }
}));

// Simulation interval is now managed by SimulationService.ts
// We don't need separate intervals here
let simulationTimer: number | null = null;

// This function just updates the timestamps, but no longer generates AQI readings
// Actual AQI generation will be handled only by SimulationService.ts
const generateSensorReadings = () => {
  console.log('SystemService: Updating sensor timestamps only...');
  const currentTime = new Date().toISOString();
  
  // Only update timestamps, not the actual readings
  MOCK_SENSORS.forEach(sensor => {
    sensor.lastReading.timestamp = currentTime;
  });
  
  // Update system status
  MOCK_SYSTEM_STATUS.lastDataUpdate = currentTime;
  
  // Save to localStorage to persist the state
  localStorage.setItem('mockSensorsData', JSON.stringify(MOCK_SENSORS));
  
  return MOCK_SENSORS;
};

// Start or stop the simulation based on the status, but don't set intervals
// Let SimulationService handle the timing according to configuration
const updateSimulationState = (status: 'running' | 'stopped') => {
  if (status === 'running') {
    // Just update timestamps once when starting, 
    // but don't set an interval, let SimulationService handle that
    generateSensorReadings();
    console.log('SystemService: Simulation marked as running. Actual timing managed by SimulationService.');
  } else {
    // Stop any legacy timer if it exists (cleanup only)
    if (simulationTimer) {
      window.clearInterval(simulationTimer);
      simulationTimer = null;
      console.log('SystemService: Simulation stopped');
    }
  }
};

// Initial setup - check if simulation should be running
if (MOCK_SYSTEM_STATUS.simulationStatus === 'running') {
  // Mark simulation as running, but don't start a timer
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
    try {
      // Make an explicit call to the backend API endpoint
      const response = await axios.get(`${API_URL}/status`);
      
      // Check if we received a valid response with activeSensors
      if (response.data && typeof response.data.activeSensors === 'number') {
        // Get simulation status from the server rather than just from localStorage
        const serverSimulationStatus = response.data.simulationStatus || 'stopped';
        
        // Update the localStorage status to match the server
        if (serverSimulationStatus !== getStoredSimulationStatus()) {
          saveSimulationStatus(serverSimulationStatus);
        }
        
        // Update the mock state with the real data from database
        MOCK_SYSTEM_STATUS.activeSensors = response.data.activeSensors;
        
        // Return the complete system status with real-time database values
        return {
          systemHealth: response.data.systemHealth || 'healthy',
          activeSensors: response.data.activeSensors,
          simulationStatus: serverSimulationStatus,
          alertsToday: response.data.alertsToday || 0,
          lastDataUpdate: response.data.lastDataUpdate || new Date().toISOString(),
          memoryUsage: response.data.memoryUsage || 42,
          cpuLoad: response.data.cpuLoad || 28
        };
      } else {
        console.warn('API response missing activeSensors value, using mock data');
        const storedStatus = getStoredSimulationStatus();
        return {
          ...MOCK_SYSTEM_STATUS,
          simulationStatus: storedStatus
        };
      }
    } catch (error) {
      console.error('Error getting system status from API:', error);
      
      // If API fails, return mock data with the correct simulation status
      const storedStatus = getStoredSimulationStatus();
      return {
        ...MOCK_SYSTEM_STATUS,
        simulationStatus: storedStatus
      };
    }
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
    try {
      const response = await axios.post(`/api/simulation/stop`);
      
      // Set status to stopped in localStorage
      MOCK_SYSTEM_STATUS.simulationStatus = 'stopped';
      saveSimulationStatus('stopped');
      
      return response.data;
    } catch (error) {
      console.error('Error stopping simulation:', error);
      return {
        status: 'error',
        message: 'Failed to stop simulation service'
      };
    }
  },

  /**
   * Start simulation service
   */
  async startSimulation(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post(`/api/simulation/start`);
      
      // Set status to running in localStorage
      MOCK_SYSTEM_STATUS.simulationStatus = 'running';
      saveSimulationStatus('running');
      
      return response.data;
    } catch (error) {
      console.error('Error starting simulation:', error);
      return {
        status: 'error',
        message: 'Failed to start simulation service'
      };
    }
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