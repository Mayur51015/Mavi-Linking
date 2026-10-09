/**
 * Environment Configuration
 * ─────────────────────────
 * Configures development, staging, and production API environments.
 * Note: Never hardcode localhost as production!
 * Android Emulator maps host machine localhost to 10.0.2.2.
 */

export type EnvironmentType =
  | 'production'
  | 'staging'
  | 'emulator'
  | 'lan'
  | 'custom';

export interface EnvironmentConfig {
  type: EnvironmentType;
  label: string;
  apiUrl: string;
  socketUrl: string;
  isProduction: boolean;
}

export const ENVIRONMENTS: Record<EnvironmentType, EnvironmentConfig> = {
  production: {
    type: 'production',
    label: 'Production (Cloud)',
    apiUrl: 'https://mavi-server-4yvl.onrender.com/api',
    socketUrl: 'https://mavi-server-4yvl.onrender.com',
    isProduction: true,
  },
  staging: {
    type: 'staging',
    label: 'Staging Preview',
    apiUrl: 'https://mavi-server-4yvl.onrender.com/api',
    socketUrl: 'https://mavi-server-4yvl.onrender.com',
    isProduction: false,
  },
  emulator: {
    type: 'emulator',
    label: 'Android Emulator (10.0.2.2:5000)',
    apiUrl: 'http://10.0.2.2:5000/api',
    socketUrl: 'http://10.0.2.2:5000',
    isProduction: false,
  },
  lan: {
    type: 'lan',
    label: 'Local Network (LAN:5000)',
    apiUrl: 'http://192.168.1.10:5000/api',
    socketUrl: 'http://192.168.1.10:5000',
    isProduction: false,
  },
  custom: {
    type: 'custom',
    label: 'Custom Server URL',
    apiUrl: 'http://10.0.2.2:5000/api',
    socketUrl: 'http://10.0.2.2:5000',
    isProduction: false,
  },
};

export const DEFAULT_ENV: EnvironmentType = 'production';
