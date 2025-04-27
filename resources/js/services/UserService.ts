import axios from 'axios';
import { AdminUser } from '@/types/sensor';

const API_URL = '/api/admin/users';

export const UserService = {
  /**
   * Get all admin users
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    const response = await axios.get(API_URL);
    return response.data;
  },

  /**
   * Get a specific admin user by ID
   */
  async getAdminUserById(id: number): Promise<AdminUser> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new admin user
   */
  async createAdminUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'monitoring_admin';
    permissions: string[];
  }): Promise<AdminUser> {
    const response = await axios.post(API_URL, userData);
    return response.data;
  },

  /**
   * Update an existing admin user
   */
  async updateAdminUser(id: number, userData: Partial<AdminUser>): Promise<AdminUser> {
    const response = await axios.put(`${API_URL}/${id}`, userData);
    return response.data;
  },

  /**
   * Delete an admin user
   */
  async deleteAdminUser(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },

  /**
   * Change an admin user's password
   */
  async changePassword(id: number, password: string, confirmPassword: string): Promise<{ message: string }> {
    const response = await axios.patch(`${API_URL}/${id}/password`, {
      password,
      password_confirmation: confirmPassword
    });
    return response.data;
  },

  /**
   * Update user permissions
   */
  async updatePermissions(id: number, permissions: string[]): Promise<AdminUser> {
    const response = await axios.patch(`${API_URL}/${id}/permissions`, { permissions });
    return response.data;
  }
}; 