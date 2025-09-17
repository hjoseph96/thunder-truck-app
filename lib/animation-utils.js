// Animation utilities for marker movement along polylines
// Provides coordinate interpolation and animation helpers

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in meters
 */
const calculateDistance = (coord1, coord2) => {
  const earthRadiusMeters = 6371e3; // Earth's radius in meters
  const lat1Radians = (coord1.latitude * Math.PI) / 180;
  const lat2Radians = (coord2.latitude * Math.PI) / 180;
  const latDifferenceRadians = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const lonDifferenceRadians = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(latDifferenceRadians / 2) * Math.sin(latDifferenceRadians / 2) +
    Math.cos(lat1Radians) *
      Math.cos(lat2Radians) *
      Math.sin(lonDifferenceRadians / 2) *
      Math.sin(lonDifferenceRadians / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
};

/**
 * Interpolate between two coordinates
 * @param {Object} start - Start coordinate {latitude, longitude}
 * @param {Object} end - End coordinate {latitude, longitude}
 * @param {number} progress - Progress between 0 and 1
 * @returns {Object} Interpolated coordinate {latitude, longitude}
 */
const interpolateCoordinate = (start, end, progress) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return {
    latitude: start.latitude + (end.latitude - start.latitude) * clampedProgress,
    longitude: start.longitude + (end.longitude - start.longitude) * clampedProgress,
  };
};

/**
 * Calculate total distance of a polyline
 * @param {Array} coordinates - Array of coordinates [{latitude, longitude}, ...]
 * @returns {number} Total distance in meters
 */
const calculatePolylineDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += calculateDistance(coordinates[i - 1], coordinates[i]);
  }

  return totalDistance;
};

/**
 * Get coordinate at specific distance along polyline
 * @param {Array} coordinates - Array of coordinates [{latitude, longitude}, ...]
 * @param {number} targetDistance - Target distance in meters
 * @returns {Object} Coordinate at target distance {latitude, longitude, segmentIndex}
 */
const getCoordinateAtDistance = (coordinates, targetDistance) => {
  if (!coordinates || coordinates.length < 2) {
    return coordinates?.[0] || { latitude: 0, longitude: 0, segmentIndex: 0 };
  }

  if (targetDistance <= 0) {
    return { ...coordinates[0], segmentIndex: 0 };
  }

  let accumulatedDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const segmentDistance = calculateDistance(coordinates[i - 1], coordinates[i]);

    if (accumulatedDistance + segmentDistance >= targetDistance) {
      // Target distance is within this segment
      const remainingDistance = targetDistance - accumulatedDistance;
      const segmentProgress = remainingDistance / segmentDistance;

      const interpolated = interpolateCoordinate(
        coordinates[i - 1],
        coordinates[i],
        segmentProgress,
      );

      return {
        ...interpolated,
        segmentIndex: i - 1,
      };
    }

    accumulatedDistance += segmentDistance;
  }

  // Target distance exceeds polyline length, return last coordinate
  return {
    ...coordinates[coordinates.length - 1],
    segmentIndex: coordinates.length - 1,
  };
};

/**
 * Get coordinate at specific progress along polyline (0-1)
 * @param {Array} coordinates - Array of coordinates [{latitude, longitude}, ...]
 * @param {number} progress - Progress between 0 and 1
 * @returns {Object} Coordinate at progress {latitude, longitude, segmentIndex}
 */
const getCoordinateAtProgress = (coordinates, progress) => {
  const totalDistance = calculatePolylineDistance(coordinates);
  const targetDistance = totalDistance * Math.max(0, Math.min(1, progress));

  return getCoordinateAtDistance(coordinates, targetDistance);
};

/**
 * Calculate bearing between two coordinates
 * @param {Object} start - Start coordinate {latitude, longitude}
 * @param {Object} end - End coordinate {latitude, longitude}
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (start, end) => {
  const startLatRadians = (start.latitude * Math.PI) / 180;
  const endLatRadians = (end.latitude * Math.PI) / 180;
  const lonDifferenceRadians = ((end.longitude - start.longitude) * Math.PI) / 180;

  const y = Math.sin(lonDifferenceRadians) * Math.cos(endLatRadians);
  const x =
    Math.cos(startLatRadians) * Math.sin(endLatRadians) -
    Math.sin(startLatRadians) * Math.cos(endLatRadians) * Math.cos(lonDifferenceRadians);

  const bearingRadians = Math.atan2(y, x);

  return ((bearingRadians * 180) / Math.PI + 360) % 360;
};

/**
 * Animation configuration constants
 */
const ANIMATION_CONFIG = {
  DEFAULT_DURATION: 2000, // 2 seconds
  DEFAULT_FPS: 60,
  SMOOTH_FACTOR: 0.1, // For smooth interpolation
  MIN_DISTANCE_THRESHOLD: 1, // Minimum distance in meters to trigger animation
};

/**
 * Create animation steps for marker movement
 * @param {Array} coordinates - Polyline coordinates
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} fps - Frames per second
 * @returns {Array} Array of animation steps with coordinates and timing
 */
const createAnimationSteps = (
  coordinates,
  duration = ANIMATION_CONFIG.DEFAULT_DURATION,
  fps = ANIMATION_CONFIG.DEFAULT_FPS,
) => {
  if (!coordinates || coordinates.length < 2) return [];

  const totalSteps = Math.floor((duration / 1000) * fps);
  const steps = [];

  for (let i = 0; i <= totalSteps; i++) {
    const progress = i / totalSteps;
    const coordinate = getCoordinateAtProgress(coordinates, progress);

    steps.push({
      coordinate,
      progress,
      timestamp: (duration / totalSteps) * i,
    });
  }

  return steps;
};

// CommonJS exports
module.exports = {
  calculateDistance,
  interpolateCoordinate,
  calculatePolylineDistance,
  getCoordinateAtDistance,
  getCoordinateAtProgress,
  calculateBearing,
  ANIMATION_CONFIG,
  createAnimationSteps,
};
