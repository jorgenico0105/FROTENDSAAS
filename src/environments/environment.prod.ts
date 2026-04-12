/**
 * Production Environment Configuration
 */
export const environment = {
  production: true,

  // API Configuration
  // TODO: Cambiar a la URL de producción cuando esté disponible
  apiUrl: 'https://api.koisaas.lat/api/v1',
  //apiUrl :'http://localhost:8080/api/v1',

  // App Configuration
  appName: 'Trezo',
  appVersion: '4.1.0',

  // Auth Configuration
  tokenRefreshThreshold: 60, // seconds before expiry to refresh token
  sessionTimeout: 3600, // session timeout in seconds (1 hour)

  // Feature Flags
  features: {
    enableMockAuth: false, // Disable mock authentication in production
    enableDebugLogs: false,
  }
};
