import axios from 'axios';
import { SuperAdmin, SystemSettings, SystemStats, UserWithRole, ActivityLog, BackupInfo, EnvironmentInfo } from '@/types/admin';

const API_URL = '/api/super-admin';

export const SuperAdminService = {
  /**
   * Get all system users (including admins and regular users)
   */
  async getAllUsers(): Promise<UserWithRole[]> {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  },

  /**
   * Get a specific user by ID
   */
  async getUserById(id: number): Promise<UserWithRole> {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user with any role
   */
  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'monitoring_admin' | 'user';
    permissions?: string[];
  }): Promise<UserWithRole> {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  },

  /**
   * Update an existing user
   */
  async updateUser(id: number, userData: Partial<UserWithRole>): Promise<UserWithRole> {
    const response = await axios.put(`${API_URL}/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/users/${id}`);
    return response.data;
  },

  /**
   * Change a user's password (super admin can change any user's password)
   */
  async changeUserPassword(id: number, password: string, password_confirmation: string): Promise<{ message: string }> {
    const response = await axios.patch(`${API_URL}/users/${id}/password`, {
      password,
      password_confirmation
    });
    return response.data;
  },

  /**
   * Assign roles to a user
   */
  async assignRoles(id: number, roles: string[]): Promise<{ message: string, user: UserWithRole }> {
    const response = await axios.patch(`${API_URL}/users/${id}/roles`, { roles });
    return response.data;
  },

  /**
   * Update permissions for a user
   */
  async updatePermissions(id: number, permissions: string[]): Promise<{ message: string }> {
    const response = await axios.patch(`${API_URL}/users/${id}/permissions`, { permissions });
    return response.data;
  },

  /**
   * Get system-wide statistics 
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  },

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings[]> {
    const response = await axios.get(`${API_URL}/settings`);
    return response.data;
  },

  /**
   * Update a system setting
   */
  async updateSystemSetting(setting: {
    key: string;
    value: any;
    group: 'general' | 'notifications' | 'security' | 'appearance' | 'integrations';
    type: 'string' | 'boolean' | 'integer' | 'float' | 'array' | 'object';
    description?: string;
  }): Promise<SystemSettings> {
    const response = await axios.put(`${API_URL}/settings`, setting);
    return response.data;
  },

  /**
   * Get system activity logs
   */
  async getActivityLogs(page: number = 1, limit: number = 20): Promise<{
    logs: ActivityLog[];
    total: number;
    currentPage: number;
    lastPage: number;
  }> {
    const response = await axios.get(`${API_URL}/logs`, {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Backup system data
   */
  async createBackup(): Promise<BackupInfo & { message: string }> {
    const response = await axios.post(`${API_URL}/backup`);
    return response.data;
  },

  /**
   * Restore system from backup
   */
  async restoreBackup(backupId: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${API_URL}/restore/${backupId}`);
    return response.data;
  },

  /**
   * Get list of available backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    const response = await axios.get(`${API_URL}/backups`);
    return response.data;
  },

  /**
   * Run system maintenance operations
   */
  async runMaintenance(operations: Array<'clear_cache' | 'optimize' | 'clear_logs' | 'rebuild_index'>): Promise<{
    success: boolean;
    message: string;
    details: Record<string, string>;
  }> {
    const response = await axios.post(`${API_URL}/maintenance`, { operations });
    return response.data;
  },

  /**
   * Get application environment information
   */
  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    const response = await axios.get(`${API_URL}/environment`);
    return response.data;
  }
};