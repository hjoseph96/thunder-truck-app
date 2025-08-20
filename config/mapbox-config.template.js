// Mapbox Configuration Template
// Copy this file to mapbox-config.js and add your actual Mapbox token
// This template file is safe to commit to version control

export const MAPBOX_CONFIG = {
  // Public access token for Mapbox services
  // Get your token from: https://account.mapbox.com/access-tokens/
  // This token is safe to use in client-side code as it has restricted permissions
  PUBLIC_ACCESS_TOKEN: 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE',
  
  // Map style configuration
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
  
  // Default map center (Noida, India - based on the location in your app)
  DEFAULT_CENTER: {
    longitude: 77.3910,
    latitude: 28.5355,
    zoom: 14
  },
  
  // Map configuration
  MAP_CONFIG: {
    scrollEnabled: true,
    zoomEnabled: true,
    pitchEnabled: true,
    rotateEnabled: true,
    attributionEnabled: true,
    logoEnabled: false,
    compassEnabled: true
  }
};

// Helper function to get the access token
export const getMapboxAccessToken = () => MAPBOX_CONFIG.PUBLIC_ACCESS_TOKEN;

// Helper function to get map configuration
export const getMapConfig = () => MAPBOX_CONFIG.MAP_CONFIG;

// Helper function to get default center
export const getDefaultCenter = () => MAPBOX_CONFIG.DEFAULT_CENTER;
