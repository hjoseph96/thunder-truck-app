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
 * Optimized for 5fps performance (200ms intervals) for controlled, resource-efficient animations
 */
export const ANIMATION_SETTINGS = {
  default: {
    smoothingFactor: 0.25, // Responsive animation for real-time updates
    animationDuration: 5000, // 5 seconds for slower, more realistic movement
    minUpdateInterval: 200, // 5fps = 200ms intervals for controlled animation
    frameRate: 5, // Explicit 5fps setting
  },
  cycling: {
    smoothingFactor: 0.3, // Slightly smoother for cycling movement
    animationDuration: 5000, // 5 seconds for slower, more realistic movement
    minUpdateInterval: 200, // 5fps = 200ms intervals for controlled animation
    frameRate: 5, // Explicit 5fps setting
  },
  walking: {
    smoothingFactor: 0.35, // Smoothest for walking
    animationDuration: 6000, // 6 seconds for slower walking speed
    minUpdateInterval: 200, // 5fps = 200ms intervals for controlled animation
    frameRate: 5, // Explicit 5fps setting
  },
};
