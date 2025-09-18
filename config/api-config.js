// API Configuration
// Update these values based on your Rails server setup

export const API_CONFIG = {
  // Development - local Rails server
  development: {
    baseURL: 'https://api.thundertruck.app',
    graphqlEndpoint: '/graphql',
    websocketURL: 'wss://api.thundertruck.app/cable',
    timeout: 20000, // 20 seconds
  },

  // Staging environment
  staging: {
    baseURL: 'https://your-staging-api.com',
    graphqlEndpoint: '/graphql',
    websocketURL: 'wss://your-staging-api.com/cable',
    timeout: 15000, // 15 seconds
  },

  // Production environment
  production: {
    baseURL: 'https://api.thundertruck.app',
    graphqlEndpoint: '/graphql',
    websocketURL: 'wss://api.thundertruck.app/cable',
    timeout: 20000, // 20 seconds
  },
};

// Get current environment (default to development)
export const getCurrentEnvironment = () => {
  // You can set this via environment variables or build configuration
  return process.env.NODE_ENV || 'development';
};

// Get current API configuration
export const getCurrentApiConfig = () => {
  const env = getCurrentEnvironment();
  return API_CONFIG[env] || API_CONFIG.development;
};

// Export current config for easy access
export const CURRENT_API_CONFIG = getCurrentApiConfig();

export default CURRENT_API_CONFIG;
