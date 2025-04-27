import axios from 'axios';
import { SimulationConfig, SimulationPattern } from '@/types/sensor';

const API_URL = 'http://127.0.0.1:8000/api/simulation';

// Load simulation state from localStorage if available, or use default
const getInitialState = () => {
  const savedState = localStorage.getItem('simulationState');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
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
    }
  };
};

// Initialize mock state
let mockSimulationState = getInitialState();

// Helper to save state to localStorage
const saveState = () => {
  try {
    localStorage.setItem('simulationState', JSON.stringify(mockSimulationState));
  } catch (e) {
    console.error('Failed to save simulation state', e);
  }
};

export const SimulationService = {
  /**
   * Get the current simulation configuration
   */
  async getSimulationConfig(): Promise<SimulationConfig> {
    // Return mock data instead of making API call
    return new Promise(resolve => {
      setTimeout(() => resolve({ ...mockSimulationState.config }), 300);
    });
  },

  /**
   * Update the simulation configuration
   */
  async updateSimulationConfig(config: Partial<SimulationConfig>): Promise<SimulationConfig> {
    // Update local mock state
    return new Promise(resolve => {
      setTimeout(() => {
        mockSimulationState.config = {
          ...mockSimulationState.config,
          ...config,
          lastUpdated: new Date().toISOString()
        };
        saveState(); // Save to localStorage
        resolve({ ...mockSimulationState.config });
      }, 500);
    });
  },

  /**
   * Start the simulation
   */
  async startSimulation(): Promise<{ status: string; message: string }> {
    // Update local simulation state to running
    return new Promise(resolve => {
      setTimeout(() => {
        mockSimulationState.isRunning = true;
        mockSimulationState.lastRun = new Date().toISOString();
        saveState(); // Save to localStorage
        resolve({ 
          status: 'success', 
          message: 'Simulation started successfully' 
        });
      }, 500);
    });
  },

  /**
   * Stop the simulation
   */
  async stopSimulation(): Promise<{ status: string; message: string }> {
    // Update local simulation state to stopped
    return new Promise(resolve => {
      setTimeout(() => {
        mockSimulationState.isRunning = false;
        saveState(); // Save to localStorage
        resolve({ 
          status: 'success', 
          message: 'Simulation stopped successfully' 
        });
      }, 500);
    });
  },

  /**
   * Add a new simulation pattern
   */
  async addPattern(pattern: SimulationPattern): Promise<SimulationConfig> {
    // Add pattern to mock state
    return new Promise(resolve => {
      setTimeout(() => {
        mockSimulationState.config = {
          ...mockSimulationState.config,
          patterns: [...mockSimulationState.config.patterns, pattern],
          lastUpdated: new Date().toISOString()
        };
        saveState(); // Save to localStorage
        resolve({ ...mockSimulationState.config });
      }, 500);
    });
  },

  /**
   * Remove a simulation pattern
   */
  async removePattern(patternType: string): Promise<SimulationConfig> {
    // Remove pattern from mock state
    return new Promise(resolve => {
      setTimeout(() => {
        mockSimulationState.config = {
          ...mockSimulationState.config,
          patterns: mockSimulationState.config.patterns.filter((p: SimulationPattern) => p.type !== patternType),
          lastUpdated: new Date().toISOString()
        };
        saveState(); // Save to localStorage
        resolve({ ...mockSimulationState.config });
      }, 500);
    });
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
  }> {
    // Return current simulation status from mock state
    return new Promise(resolve => {
      setTimeout(() => {
        // Ensure we're using the latest state from localStorage
        mockSimulationState = getInitialState();
        
        // For running simulations, update dynamic fields
        if (mockSimulationState.isRunning) {
          mockSimulationState.uptime = Math.floor((Date.now() - new Date(mockSimulationState.lastRun).getTime()) / 1000);
          mockSimulationState.generatedReadings += Math.floor(Math.random() * 10);
          saveState(); // Save updated counts
        }
        
        resolve({
          status: mockSimulationState.isRunning ? 'running' : 'stopped',
          lastRun: mockSimulationState.lastRun,
          uptime: mockSimulationState.uptime,
          sensorsAffected: mockSimulationState.sensorsAffected,
          generatedReadings: mockSimulationState.generatedReadings
        });
      }, 300);
    });
  }
}; 