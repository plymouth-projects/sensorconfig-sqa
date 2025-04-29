// Admin-related type definitions

export interface SuperAdmin {
  id: number;
  name: string;
  email: string;
  role: 'super_admin';
  lastLogin?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: number;
  key: string;
  value: string;
  group: 'general' | 'notifications' | 'security' | 'appearance' | 'integrations';
  type: 'string' | 'boolean' | 'integer' | 'float' | 'array' | 'object';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'monitoring_admin' | 'user';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalSensors: number;
  totalReadings: number;
  averageAqi: number;
  systemHealth: string;
  diskUsage: number;
  cpuLoad: number;
  memoryUsage: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity: string;
  entity_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface BackupInfo {
  id: number;
  filename: string;
  size: number;
  created_at: string;
}

export interface EnvironmentInfo {
  phpVersion: string;
  laravelVersion: string;
  databaseType: string;
  serverInfo: string;
  appMode: string;
  diskFree: number;
  diskTotal: number;
}