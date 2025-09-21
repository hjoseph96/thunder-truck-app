// Courier Tracking Configuration
// General configuration constants for courier tracking system

/**
 * Default routing profile for all couriers
 * Uses 'driving' which is suitable for most food delivery scenarios
 */
export const DEFAULT_ROUTING_PROFILE = 'driving';

/**
 * Route deviation threshold (in meters)
 * When couriers deviate more than this distance from their route,
 * the system will request a new route
 */
export const DEVIATION_THRESHOLDS = {
  default: 50, // 50 meters - good balance between accuracy and avoiding excessive re-routing
};

/**
 * Animation settings for courier markers
 * Optimized for smooth real-time tracking experience
 */
export const ANIMATION_SETTINGS = {
  default: {
    smoothingFactor: 0.25, // Responsive animation for real-time updates
    animationDuration: 600, // Smooth marker animation (0.6 seconds)
    minUpdateInterval: 800, // Update frequency (0.8 seconds) for real-time tracking
  },
  cycling: {
    smoothingFactor: 0.3, // Slightly smoother for cycling movement
    animationDuration: 800, // Slower animation for cycling
    minUpdateInterval: 1000, // Cycling updates can be less frequent
  },
  walking: {
    smoothingFactor: 0.35, // Smoothest for walking
    animationDuration: 1000, // Slowest animation for walking
    minUpdateInterval: 1200, // Walking updates less frequent
  },
};
