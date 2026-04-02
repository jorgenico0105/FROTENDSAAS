/**
 * Development Environment Configuration
 */
export const environment = {
  production: false,

  // API Configuration
  apiUrl: 'http://localhost:8080/api/v1',

  // App Configuration
  appName: 'Trezo',
  appVersion: '4.1.0',

  // Auth Configuration
  tokenRefreshThreshold: 60, // seconds before expiry to refresh token
  sessionTimeout: 3600, // session timeout in seconds (1 hour)

  // Feature Flags
  features: {
    enableMockAuth: false, // Enable mock authentication for development
    enableDebugLogs: true,
  }
};
