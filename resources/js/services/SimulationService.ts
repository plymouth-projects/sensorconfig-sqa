import axios from 'axios';
import { SimulationConfig, SimulationPattern } from '@/types/sensor';

const API_URL = 'http://127.0.0.1:8000/api/simulation';
const SENSORS_API_URL = 'http://127.0.0.1:8000/api/sensors';

// Load simulation state from localStorage if available, or use default
const getInitialState = () => {
  const savedState = localStorage.getItem('simulationState');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Always check that isRunning is synced with systemSimulationStatus
      // to ensure consistency across the application
      const systemStatus = localStorage.getItem('systemSimulationStatus');
      if (systemStatus === 'running') {
        parsed.isRunning = true;
      } else if (systemStatus === 'stopped') {
        parsed.isRunning = false;
      }
      return parsed;
    } catch (e: any) {
      console.error('Failed to parse saved simulation state', e);
    }
  }
  
  // Default state if nothing in localStorage
  return {
    isRunning: false,
    lastRun: new Date().toISOString(),
    uptime: 0,
    sensorsAffected: 24,
    generatedReadings: 0,
    config: {
      id: 1,
      isActive: false,
      frequency: 60,
      baselineAqi: 50,
      variationRange: {
        min: 10,
        max: 30
      },
      patterns: [
        {
          type: 'random' as const,
          intensity: 5
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    // Track the database storage timer
    lastStorageTime: new Date().toISOString(),
  };
};

// Initialize mock state
let mockSimulationState = getInitialState();
let storageIntervalId: number | null = null;

// Helper to save state to localStorage
const saveState = () => {
  try {
    localStorage.setItem('simulationState', JSON.stringify(mockSimulationState));
  } catch (e: any) {
    console.error('Failed to save simulation state', e);
  }
};

// Generate a random reading for a sensor based on the simulation config
const generateSensorReading = async (sensorId: number, config: SimulationConfig) => {
  try {
    // Get the baseline AQI value (ensure it's a valid number)
    let aqi = typeof config.baselineAqi === 'number' ? config.baselineAqi : 50;
    
    // Ensure variation range has valid numbers
    const minVariation = typeof config.variationRange?.min === 'number' ? config.variationRange.min : 10;
    const maxVariation = typeof config.variationRange?.max === 'number' ? config.variationRange.max : 30;
    
    // Apply random variation within the range
    const variation = minVariation + Math.random() * (maxVariation - minVariation);
    
    // Decide if variation is positive or negative (50% chance)
    aqi += Math.random() > 0.5 ? variation : -variation;
    
    // Apply patterns from the database configuration
    if (Array.isArray(config.patterns)) {
      config.patterns.forEach(pattern => {
        if (pattern.type === 'random') {
          // Apply random intensity variation (with safety check)
          const intensity = typeof pattern.intensity === 'number' ? pattern.intensity : 5;
          aqi += (Math.random() * 2 - 1) * intensity;
        } else if (pattern.type === 'time-based') {
          // Apply time-based patterns
          const hour = new Date().getHours();
          
          // Morning peak (7-9 AM)
          if (hour >= 7 && hour <= 9) {
            const factor = (typeof pattern.morningPeak === 'number' ? pattern.morningPeak : 20) / 100;
            aqi *= (1 + factor);
          }
          // Evening peak (5-7 PM)
          else if (hour >= 17 && hour <= 19) {
            const factor = (typeof pattern.eveningPeak === 'number' ? pattern.eveningPeak : 30) / 100;
            aqi *= (1 + factor);
          }
        } else if (pattern.type === 'weather-based') {
          // Simulate weather effects (for demo purposes, use random chance)
          // In a real app, this would use actual weather data
          
          // Randomly simulate rain (10% chance)
          if (Math.random() < 0.1) {
            // Convert percentage to factor, but ensure we don't get negative AQI
            const rainFactor = (typeof pattern.rainEffect === 'number' ? pattern.rainEffect : -10) / 100;
            // Ensure the factor doesn't reduce AQI below 0 (minimum 10% of original value)
            const modifiedAqi = aqi * Math.max(0.1, 1 + rainFactor);
            aqi = modifiedAqi;
          }
          
          // Randomly simulate wind (20% chance)
          if (Math.random() < 0.2) {
            // Convert percentage to factor, but ensure we don't get negative AQI
            const windFactor = (typeof pattern.windEffect === 'number' ? pattern.windEffect : -15) / 100;
            // Ensure the factor doesn't reduce AQI below 0 (minimum 10% of original value)
            const modifiedAqi = aqi * Math.max(0.1, 1 + windFactor);
            aqi = modifiedAqi;
          }
        }
      });
    }
    
    // Ensure AQI is within reasonable bounds (0-500) and is a valid number
    aqi = Math.max(0, Math.min(500, isNaN(aqi) ? 50 : aqi));
    
    // Generate other values based on AQI with safeguards against NaN
    const pm25 = (aqi * 0.6 + Math.random() * 10) || 30; // Default to 30 if calculation results in NaN
    const pm10 = (aqi * 0.8 + Math.random() * 15) || 40; // Default to 40 if calculation results in NaN
    
    // Format timestamp in a format that PHP/Laravel prefers
    const now = new Date();
    // Format as YYYY-MM-DD HH:MM:SS format which Laravel prefers
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Create the reading object with exactly the fields expected by the API
    // Ensure all values are valid numbers (not NaN)
    const reading = {
      timestamp: formattedDate,
      aqi: Math.round(aqi * 100) / 100,
      pm25: Math.round(pm25 * 100) / 100,
      pm10: Math.round(pm10 * 100) / 100
    };

    // Double-check that no values are NaN before sending
    if (isNaN(reading.aqi) || isNaN(reading.pm25) || isNaN(reading.pm10)) {
      console.warn(`Generated invalid reading values (NaN detected): ${JSON.stringify(reading)}`);
      // Provide default values if NaN is detected
      reading.aqi = reading.aqi || 50;
      reading.pm25 = reading.pm25 || 30;
      reading.pm10 = reading.pm10 || 40;
      console.log(`Corrected values: ${JSON.stringify(reading)}`);
    }

    // Only store readings in database if simulation is running
    // First check local state and then verify with server
    if (mockSimulationState.isRunning) {
      try {
        // Double-check if simulation is still running via API
        const statusResponse = await axios.get(`${API_URL}/status`);
        if (statusResponse.data && statusResponse.data.status === 'running') {
          // Store the reading in the database since simulation is confirmed to be running
          console.log(`Sending reading for sensor ${sensorId}:`, reading);
          
          try {
            const response = await axios.post(`${SENSORS_API_URL}/${sensorId}/readings`, reading);
            console.log(`Successfully stored reading for sensor ${sensorId}:`, response.data);
            
            // Update mock state
            mockSimulationState.generatedReadings += 1;
            mockSimulationState.lastStorageTime = new Date().toISOString();
            saveState();
          } catch (apiError: any) {
            console.error(`Failed to store reading for sensor ${sensorId}:`, apiError.response?.data || apiError);
            
            // If there are validation errors, log them specifically
            if (apiError.response && apiError.response.status === 422 && apiError.response.data.errors) {
              console.error('Validation errors:', apiError.response.data.errors);
              
              // Try again with properly formatted data if it's a validation issue
              if (apiError.response.data.errors.timestamp) {
                // Try alternative timestamp format
                const altReading = {
                  ...reading,
                  timestamp: now.toISOString() // Use full ISO string format instead
                };
                
                console.log(`Retrying with alternative timestamp format for sensor ${sensorId}:`, altReading);
                
                try {
                  const retryResponse = await axios.post(`${SENSORS_API_URL}/${sensorId}/readings`, altReading);
                  console.log(`Successfully stored reading on retry for sensor ${sensorId}:`, retryResponse.data);
                  
                  // Update mock state
                  mockSimulationState.generatedReadings += 1;
                  mockSimulationState.lastStorageTime = new Date().toISOString();
                  saveState();
                } catch (retryError: any) {
                  console.error(`Failed on retry for sensor ${sensorId}:`, retryError.response?.data || retryError);
                }
              }
            }
          }
        } else {
          // Simulation is no longer running according to server
          console.log('Simulation is not running according to server. Not storing reading.');
          // Update local state to match server
          mockSimulationState.isRunning = false;
          saveState();
          localStorage.setItem('systemSimulationStatus', 'stopped');
        }
      } catch (error: any) {
        // General error handling for the status check
        console.error(`Error checking simulation status or storing reading:`, error);
      }
    } else {
      console.log(`Simulation not running. Generated but not storing reading for sensor ${sensorId}`);
    }
    
    return reading;
  } catch (error) {
    console.error(`Error generating sensor reading for sensor ${sensorId}:`, error);
    return {
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      aqi: 50,
      pm25: 30,
      pm10: 40
    };
  }
};

// Store sensor readings in the database
const storeSensorReadings = async () => {
  if (!mockSimulationState.isRunning) return;
  
  try {
    // Record the start time of this execution
    const executionStartTime = Date.now();
    
    // First, get the latest configuration from the database
    try {
      const configResponse = await axios.get(`${API_URL}/config`);
      if (configResponse.data) {
        // Update local config with the most recent settings from database
        mockSimulationState.config = {
          ...mockSimulationState.config,
          id: configResponse.data.id,
          isActive: configResponse.data.is_active,
          baselineAqi: configResponse.data.baseline_aqi,
          frequency: configResponse.data.frequency,
          variationRange: configResponse.data.variation_range,
          patterns: configResponse.data.patterns || [],
          lastUpdated: configResponse.data.last_updated
        };
        saveState();
        
        // If frequency has changed, restart the periodic storage with new frequency
        if (storageIntervalId && 
            mockSimulationState.config.frequency !== configResponse.data.frequency) {
          console.log(`Frequency changed from ${mockSimulationState.config.frequency} to ${configResponse.data.frequency} seconds. Restarting timer.`);
          restartPeriodicStorage();
        }
      }
    } catch (configError: any) {
      console.error('Failed to get latest config, using cached version:', configError);
      // Continue with the current config if we can't get the latest
    }
    
    // Get all sensors
    const response = await axios.get(SENSORS_API_URL);
    const sensors = response.data;
    
    console.log(`Generating readings for ${sensors.length} sensors at frequency of ${mockSimulationState.config.frequency} seconds`);
    
    // Generate readings for each sensor using the latest config
    for (const sensor of sensors) {
      await generateSensorReading(sensor.id, mockSimulationState.config);
    }
    
    // Update the last storage time
    mockSimulationState.lastStorageTime = new Date().toISOString();
    saveState();
    
    // Calculate how long this execution took
    const executionTime = Date.now() - executionStartTime;
    console.log(`Generated and stored readings for ${sensors.length} sensors in ${executionTime}ms at ${new Date().toISOString()}`);
    
    // If the execution took too long, log a warning
    const frequencyMs = mockSimulationState.config.frequency * 1000;
    if (executionTime > frequencyMs * 0.5) {
      console.warn(`Data generation took ${executionTime}ms, which is more than 50% of the configured frequency (${frequencyMs}ms). Consider increasing the frequency.`);
    }
  } catch (e: any) {
    console.error('Failed to store sensor readings', e);
  }
};

// Start periodic storage of sensor readings
const startPeriodicStorage = () => {
  // Clear any existing interval
  if (storageIntervalId !== null) {
    window.clearInterval(storageIntervalId);
  }
  
  // Get the configured frequency (in seconds) and convert to milliseconds
  // Default to 60 seconds (60,000ms) if not configured or invalid
  const frequency = typeof mockSimulationState.config.frequency === 'number' ? 
    Math.max(5, mockSimulationState.config.frequency) : 60; // Minimum 5 seconds, default 60
  
  const frequencyMs = frequency * 1000;
  
  // Set interval based on configuration from database
  storageIntervalId = window.setInterval(storeSensorReadings, frequencyMs);
  
  console.log(`Started periodic storage of sensor readings (every ${frequency} seconds)`);
  
  // Also run immediately on start
  storeSensorReadings();
};

// Stop periodic storage
const stopPeriodicStorage = () => {
  if (storageIntervalId !== null) {
    window.clearInterval(storageIntervalId);
    storageIntervalId = null;
    console.log('Stopped periodic storage of sensor readings');
  }
};

// Restart periodic storage with the current frequency setting
const restartPeriodicStorage = () => {
  // Stop any existing interval
  stopPeriodicStorage();
  
  // Start a new interval with the current frequency
  startPeriodicStorage();
};

export const SimulationService = {
  /**
   * Get the current simulation configuration
   */
  async getSimulationConfig(): Promise<SimulationConfig> {
    try {
      // Get configuration from the backend API
      const response = await axios.get(`${API_URL}/config`);
      
      // Update local state with server data
      if (response.data) {
        mockSimulationState.config = {
          ...response.data,
          // Convert snake_case to camelCase if needed
          id: response.data.id,
          isActive: response.data.is_active,
          baselineAqi: response.data.baseline_aqi,
          variationRange: {
            min: response.data.variation_range.min,
            max: response.data.variation_range.max
          },
          patterns: response.data.patterns || [],
          lastUpdated: response.data.last_updated
        };
        saveState(); // Save to localStorage as backup
      }
      
      return { ...mockSimulationState.config };
    } catch (error) {
      console.error('Failed to get simulation config from server:', error);
      // Fall back to local storage data
      return { ...mockSimulationState.config };
    }
  },

  /**
   * Update the simulation configuration
   */
  async updateSimulationConfig(config: Partial<SimulationConfig>): Promise<SimulationConfig> {
    try {
      // Store old frequency to check if it changed
      const oldFrequency = mockSimulationState.config.frequency;
      
      // Format the data for the backend
      const configData = {
        is_active: config.isActive ?? mockSimulationState.config.isActive,
        frequency: config.frequency ?? mockSimulationState.config.frequency,
        baseline_aqi: config.baselineAqi ?? mockSimulationState.config.baselineAqi,
        variation_range: config.variationRange ?? mockSimulationState.config.variationRange,
        patterns: config.patterns ?? mockSimulationState.config.patterns
      };
      
      // Update the config in the database
      const response = await axios.put(`${API_URL}/config`, configData);
      
      // Update local state with the response
      if (response.data) {
        mockSimulationState.config = {
          ...mockSimulationState.config,
          ...config,
          // Ensure we're using latest backend data
          id: response.data.id,
          isActive: response.data.is_active,
          baselineAqi: response.data.baseline_aqi,
          variationRange: response.data.variation_range,
          patterns: response.data.patterns || [],
          lastUpdated: response.data.last_updated
        };
        saveState(); // Save to localStorage as backup
        
        // If frequency changed and simulation is running, restart periodic storage
        if (oldFrequency !== mockSimulationState.config.frequency && 
            mockSimulationState.isRunning && 
            storageIntervalId) {
          console.log(`Frequency changed from ${oldFrequency} to ${mockSimulationState.config.frequency} seconds. Adjusting data storage timer.`);
          restartPeriodicStorage();
        }
      }
      
      return { ...mockSimulationState.config };
    } catch (error) {
      console.error('Failed to update simulation config in database:', error);
      
      // Still update local state for UI responsiveness
      mockSimulationState.config = {
        ...mockSimulationState.config,
        ...config,
        lastUpdated: new Date().toISOString()
      };
      saveState();
      
      // Return the local state
      return { ...mockSimulationState.config };
    }
  },

  /**
   * Start the simulation
   */
  async startSimulation(): Promise<{ status: string; message: string }> {
    try {
      // Tell the server to start simulation
      const response = await axios.post(`${API_URL}/start`);
      
      // Update local simulation state to running
      mockSimulationState.isRunning = true;
      mockSimulationState.lastRun = new Date().toISOString();
      saveState(); // Save to localStorage
      
      // Also save to systemSimulationStatus to ensure consistency across services
      localStorage.setItem('systemSimulationStatus', 'running');
      
      // Start periodic storage of sensor readings
      startPeriodicStorage();
      
      // Also store readings immediately when starting
      storeSensorReadings();
      
      return { 
        status: response.data.status || 'success', 
        message: response.data.message || 'Simulation started successfully' 
      };
    } catch (error) {
      console.error('Failed to start simulation:', error);
      return { status: 'error', message: 'Failed to start simulation' };
    }
  },

  /**
   * Stop the simulation
   */
  async stopSimulation(): Promise<{ status: string; message: string }> {
    try {
      // Tell the server to stop the simulation
      const response = await axios.post(`${API_URL}/stop`);
      
      // Update local simulation state to stopped
      mockSimulationState.isRunning = false;
      saveState(); // Save to localStorage
      
      // Also save to systemSimulationStatus to ensure consistency across services
      localStorage.setItem('systemSimulationStatus', 'stopped');
      
      // Stop periodic storage
      stopPeriodicStorage();
      
      return { 
        status: response.data.status || 'success', 
        message: response.data.message || 'Simulation stopped successfully' 
      };
    } catch (error) {
      console.error('Failed to stop simulation:', error);
      
      // Still update local state for UI responsiveness
      mockSimulationState.isRunning = false;
      saveState();
      localStorage.setItem('systemSimulationStatus', 'stopped');
      stopPeriodicStorage();
      
      return { status: 'error', message: 'Failed to stop simulation' };
    }
  },

  /**
   * Add a new simulation pattern
   */
  async addPattern(pattern: SimulationPattern): Promise<SimulationConfig> {
    try {
      // Format the pattern for the backend API
      const patternData = {
        type: pattern.type,
        // Include additional properties based on pattern type
        ...(pattern.type === 'random' && { intensity: pattern.intensity }),
        ...(pattern.type === 'time-based' && { 
          morning_peak: pattern.morningPeak,
          evening_peak: pattern.eveningPeak 
        }),
        ...(pattern.type === 'weather-based' && { 
          rain_effect: pattern.rainEffect,
          wind_effect: pattern.windEffect 
        })
      };
      
      // Add pattern via API
      const response = await axios.post(`${API_URL}/patterns`, patternData);
      
      // Update local state with the response
      if (response.data) {
        // Ensure the local config is updated with the latest patterns from server
        await this.getSimulationConfig();
      }
      
      return { ...mockSimulationState.config };
    } catch (error) {
      console.error('Failed to add pattern to database:', error);
      
      // Still update local state for UI responsiveness
      mockSimulationState.config = {
        ...mockSimulationState.config,
        patterns: [...mockSimulationState.config.patterns, pattern],
        lastUpdated: new Date().toISOString()
      };
      saveState();
      
      return { ...mockSimulationState.config };
    }
  },

  /**
   * Remove a simulation pattern
   */
  async removePattern(patternType: string): Promise<SimulationConfig> {
    try {
      // Remove pattern via API
      const response = await axios.delete(`${API_URL}/patterns/${patternType}`);
      
      // Update local state with the response
      if (response.data) {
        // Refresh the configuration from the server to ensure we have the latest state
        await this.getSimulationConfig();
      }
      
      return { ...mockSimulationState.config };
    } catch (error) {
      console.error('Failed to remove pattern from database:', error);
      
      // Still update local state for UI responsiveness
      mockSimulationState.config = {
        ...mockSimulationState.config,
        patterns: mockSimulationState.config.patterns.filter((p: SimulationPattern) => p.type !== patternType),
        lastUpdated: new Date().toISOString()
      };
      saveState();
      
      return { ...mockSimulationState.config };
    }
  },

  /**
   * Get simulation status
   */
  async getStatus(): Promise<{ 
    status: 'running' | 'stopped'; 
    lastRun: string;
    uptime: number;
    sensorsAffected: number;
    generatedReadings: number;
    lastStorageTime: string;
  }> {
    try {
      // Get status from the backend API
      const response = await axios.get(`${API_URL}/status`);
      
      if (response.data) {
        // Update local state with server data
        mockSimulationState.isRunning = response.data.status === 'running';
        mockSimulationState.lastRun = response.data.last_run || mockSimulationState.lastRun;
        mockSimulationState.uptime = response.data.uptime || 0;
        mockSimulationState.sensorsAffected = response.data.sensors_affected || 0;
        
        // The server may not track generated_readings directly, use local count for UI
        if (response.data.generated_readings) {
          mockSimulationState.generatedReadings = response.data.generated_readings;
        } else if (mockSimulationState.isRunning) {
          // Increment readings count for UI feedback
          mockSimulationState.generatedReadings += Math.floor(Math.random() * 10);
        }
        
        // Save updated state to localStorage
        saveState();
        
        // Also sync with systemSimulationStatus to ensure consistency
        localStorage.setItem('systemSimulationStatus', response.data.status);
        
        // Start or stop storage based on server status
        if (response.data.status === 'running' && !storageIntervalId) {
          startPeriodicStorage();
        } else if (response.data.status !== 'running' && storageIntervalId) {
          stopPeriodicStorage();
        }
        
        return {
          status: response.data.status,
          lastRun: mockSimulationState.lastRun,
          uptime: response.data.uptime || 0,
          sensorsAffected: response.data.sensors_affected || 0,
          generatedReadings: mockSimulationState.generatedReadings,
          lastStorageTime: mockSimulationState.lastStorageTime || mockSimulationState.lastRun
        };
      }
    } catch (error) {
      console.error('Failed to get simulation status from server:', error);
    }
    
    // Fall back to local state if API call fails
    return {
      status: mockSimulationState.isRunning ? 'running' : 'stopped',
      lastRun: mockSimulationState.lastRun,
      uptime: mockSimulationState.isRunning ? 
        Math.floor((Date.now() - new Date(mockSimulationState.lastRun).getTime()) / 1000) : 
        mockSimulationState.uptime,
      sensorsAffected: mockSimulationState.sensorsAffected,
      generatedReadings: mockSimulationState.generatedReadings,
      lastStorageTime: mockSimulationState.lastStorageTime || mockSimulationState.lastRun
    };
  }
};