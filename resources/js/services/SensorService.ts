import axios from 'axios';
import { Sensor } from '@/types/sensor';

const API_URL = 'http://127.0.0.1:8000/api/sensors';

export const SensorService = {
  /**
   * Get all sensors
   */
  async getAllSensors(): Promise<Sensor[]> {
    const response = await axios.get(API_URL);
    return response.data;
  },

  /**
   * Get a specific sensor by ID
   */
  async getSensorById(id: number): Promise<Sensor> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new sensor
   */
  async createSensor(sensorData: Omit<Sensor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sensor> {
    const response = await axios.post(API_URL, sensorData);
    return response.data;
  },

  /**
   * Update an existing sensor
   */
  async updateSensor(id: number, sensorData: Partial<Sensor>): Promise<Sensor> {
    const response = await axios.put(`${API_URL}/${id}`, sensorData);
    return response.data;
  },

  /**
   * Delete a sensor
   */
  async deleteSensor(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },

  /**
   * Activate a sensor
   */
  async activateSensor(id: number): Promise<Sensor> {
    const response = await axios.patch(`${API_URL}/${id}/activate`, {});
    return response.data;
  },

  /**
   * Deactivate a sensor
   */
  async deactivateSensor(id: number): Promise<Sensor> {
    const response = await axios.patch(`${API_URL}/${id}/deactivate`, {});
    return response.data;
  },

  /**
   * Get sensors within a specific geographic area
   */
  async getSensorsInArea(lat: number, lng: number, radius: number): Promise<Sensor[]> {
    const response = await axios.get(`${API_URL}/area`, {
      params: { lat, lng, radius }
    });
    return response.data;
  },
  
  /**
   * Get latest readings for all sensors
   */
  async getLatestReadings() {
    console.log('Fetching latest readings from:', `${API_URL}/readings/latest`);
    try {
      const response = await axios.get(`${API_URL}/readings/latest`);
      console.log('Latest readings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      throw error;
    }
  },
  
  /**
   * Get the latest reading for a specific sensor
   */
  async getSensorLatestReading(id: number) {
    try {
      const response = await axios.get(`${API_URL}/${id}/readings/latest`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching latest reading for sensor ${id}:`, error);
      throw error;
    }
  }
}; 