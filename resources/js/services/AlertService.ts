import axios from 'axios';
import { AlertThreshold } from '@/types/sensor';

const API_URL = '/api/alerts';

export const AlertService = {
  /**
   * Get all alert thresholds
   */
  async getAllThresholds(): Promise<AlertThreshold[]> {
    const response = await axios.get(`${API_URL}/thresholds`);
    return response.data;
  },

  /**
   * Get a specific alert threshold by ID
   */
  async getThresholdById(id: number): Promise<AlertThreshold> {
    const response = await axios.get(`${API_URL}/thresholds/${id}`);
    return response.data;
  },

  /**
   * Create a new alert threshold
   */
  async createThreshold(threshold: Omit<AlertThreshold, 'id'>): Promise<AlertThreshold> {
    const response = await axios.post(`${API_URL}/thresholds`, threshold);
    return response.data;
  },

  /**
   * Update an existing alert threshold
   */
  async updateThreshold(id: number, threshold: Partial<AlertThreshold>): Promise<AlertThreshold> {
    const response = await axios.put(`${API_URL}/thresholds/${id}`, threshold);
    return response.data;
  },

  /**
   * Delete an alert threshold
   */
  async deleteThreshold(id: number): Promise<void> {
    await axios.delete(`${API_URL}/thresholds/${id}`);
  },

  /**
   * Enable notifications for a threshold
   */
  async enableNotifications(id: number): Promise<AlertThreshold> {
    const response = await axios.patch(`${API_URL}/thresholds/${id}/notifications/enable`, {});
    return response.data;
  },

  /**
   * Disable notifications for a threshold
   */
  async disableNotifications(id: number): Promise<AlertThreshold> {
    const response = await axios.patch(`${API_URL}/thresholds/${id}/notifications/disable`, {});
    return response.data;
  },

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 10): Promise<{
    id: number;
    sensorId: number;
    sensorName: string;
    threshold: string;
    aqi: number;
    timestamp: string;
    message: string;
  }[]> {
    const response = await axios.get(`${API_URL}/recent`, {
      params: { limit }
    });
    return response.data;
  }
}; 