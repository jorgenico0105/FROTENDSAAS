/**
 * Development Environment Configuration
 */
export const environment = {
  production: false,

  // API Configuration
  apiUrl: 'https://api.koisaas.lat/api/v1',
  //apiUrl: 'http://localhost:8080/api/v1',
  // App Configuration
  appName: 'KOI',
  appVersion: '1.1.0',

  // Auth Configuration
  tokenRefreshThreshold: 60, // seconds before expiry to refresh token
  sessionTimeout: 3600, // session timeout in seconds (1 hour)

  // Feature Flags
  features: {
    enableMockAuth: false, // Enable mock authentication for development
    enableDebugLogs: true,
  }
};

