// Google Maps Configuration
// Web: Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY from .env
// Native (iOS/Android): Uses app.json config (ios.config.googleMapsApiKey / android.config.googleMaps.apiKey)
export const GOOGLE_MAPS_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
  'AIzaSyCyPj7XRPG-53Q9C4QFdFXgtgTE7ODidGM'; // Fallback if .env not loaded

// Default map center coordinates (Williamsburg, Brooklyn)
export const DEFAULT_MAP_CENTER = {
  latitude: 40.7081,
  longitude: -73.9571,
  zoom: 14,
};
