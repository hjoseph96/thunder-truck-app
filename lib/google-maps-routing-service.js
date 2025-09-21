// Google Maps Directions API integration via GraphQL for real-time courier routing
// Replaces Mapbox routing with Google Directions API backend service

import { calculateDistance, calculatePolylineDistance } from './animation-utils';
import { executeGraphQL } from './graphql-client';
import { decode } from '@mapbox/polyline';

/**
 * Route cache configuration
 */
const ROUTE_CACHE_CONFIG = {
  MAX_CACHE_SIZE: 100, // Maximum number of cached routes
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  DEVIATION_THRESHOLD: 50, // Meters - threshold for route deviation
  MIN_REFETCH_INTERVAL: 60 * 1000, // 1 minute minimum between API calls
};

/**
 * GraphQL query for fetching navigation routes
 */
const FETCH_NAVIGATION_ROUTE_QUERY = `
  query fetchNavigationRoute($input: NavigationRouteInput!) {
    fetchNavigationRoute(params: $input) {
      id
      orderId
      polyline
      distanceMeters
      routeLegs {
        id
        distanceMeters
        startPoint
        endPoint
        polyline
        staticDuration
        distance
        navigationInstructions
      }
    }
  }
`;

/**
 * Route cache implementation
 */
class RouteCache {
  constructor() {
    this.cache = new Map();
    this.lastFetchTimes = new Map();
  }

  /**
   * Generate cache key for route
   * @param {Object} origin - Origin coordinates {latitude, longitude}
   * @param {Object} destination - Destination coordinates {latitude, longitude}
   * @param {string} mode - Travel mode (driving, walking, bicycling)
   * @returns {string} Cache key
   */
  generateKey(origin, destination, mode = 'driving') {
    const originKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;
    const destKey = `${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
    return `${originKey}-${destKey}-${mode}`;
  }

  /**
   * Get cached route if valid
   * @param {string} key - Cache key
   * @returns {Object|null} Cached route or null
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > ROUTE_CACHE_CONFIG.CACHE_DURATION) {
      this.cache.delete(key);
      this.lastFetchTimes.delete(key);
      return null;
    }

    return cached.route;
  }

  /**
   * Store route in cache
   * @param {string} key - Cache key
   * @param {Object} route - Route data
   */
  set(key, route) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= ROUTE_CACHE_CONFIG.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.lastFetchTimes.delete(firstKey);
    }

    this.cache.set(key, {
      route,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if we can fetch a new route (rate limiting)
   * @param {string} key - Cache key
   * @returns {boolean} True if fetch is allowed
   */
  canFetch(key) {
    const lastFetch = this.lastFetchTimes.get(key);
    if (!lastFetch) return true;

    return Date.now() - lastFetch > ROUTE_CACHE_CONFIG.MIN_REFETCH_INTERVAL;
  }

  /**
   * Record fetch time for rate limiting
   * @param {string} key - Cache key
   */
  recordFetch(key) {
    this.lastFetchTimes.set(key, Date.now());
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > ROUTE_CACHE_CONFIG.CACHE_DURATION) {
        this.cache.delete(key);
        this.lastFetchTimes.delete(key);
      }
    }
  }
}

/**
 * Google Maps Directions API service via GraphQL
 */
export class GoogleMapsRoutingService {
  constructor() {
    this.cache = new RouteCache();

    // Cleanup cache periodically
    setInterval(
      () => {
        this.cache.cleanup();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  /**
   * Fetch route from Google Directions API via GraphQL backend
   * @param {Object} origin - Origin coordinates {latitude, longitude}
   * @param {Object} destination - Destination coordinates {latitude, longitude}
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Route data with coordinates and metadata
   */
  async fetchRoute(origin, destination, options = {}) {
    const {
      profile = 'driving', // driving, walking, bicycling (mapped to Google travel modes)
    } = options;

    // Check cache first
    const cacheKey = this.cache.generateKey(origin, destination, profile);
    const cachedRoute = this.cache.get(cacheKey);
    if (cachedRoute) {
      console.log('GoogleMaps Routing: Using cached route for', cacheKey);
      return cachedRoute;
    }

    // Check rate limiting
    if (!this.cache.canFetch(cacheKey)) {
      console.warn('GoogleMaps Routing: Rate limited, using cached route or fallback');
      return cachedRoute || this.generateFallbackRoute(origin, destination);
    }

    try {
      this.cache.recordFetch(cacheKey);

      // Map profile to Google travel mode
      const travelMode = this.mapProfileToTravelMode(profile);

      // Prepare GraphQL variables - support both coordinates and addresses
      // Based on schema: travelMode goes inside origin and destination objects
      const variables = {
        input: {
          destinationType: destination.address ? 'address' : 'coordinates',
          destination: destination.address
            ? { address: destination.address, travelMode }
            : { latitude: destination.latitude, longitude: destination.longitude, travelMode },
          origin: origin.address
            ? { address: origin.address, travelMode }
            : { latitude: origin.latitude, longitude: origin.longitude, travelMode },
        },
      };

      console.log('GoogleMaps Routing: Fetching route via GraphQL:', variables);

      // Execute GraphQL query
      const data = await executeGraphQL(FETCH_NAVIGATION_ROUTE_QUERY, variables);

      if (!data.fetchNavigationRoute) {
        console.error('GoogleMaps Routing: No route data returned from GraphQL');
        return this.generateFallbackRoute(origin, destination);
      }

      const route = this.processGoogleMapsResponse(data.fetchNavigationRoute, origin, destination);

      // Cache the successful route
      this.cache.set(cacheKey, route);

      console.log('GoogleMaps Routing: Fetched new route via GraphQL backend');
      return route;
    } catch (error) {
      console.error('GoogleMaps Routing: Failed to fetch route via GraphQL:', error);
      return this.generateFallbackRoute(origin, destination);
    }
  }

  /**
   * Map routing profile to Google travel mode
   * @param {string} profile - Routing profile (driving, walking, cycling)
   * @returns {string} Google travel mode
   */
  mapProfileToTravelMode(profile) {
    const profileMap = {
      driving: 'DRIVE',
      'driving-traffic': 'DRIVE',
      walking: 'WALK',
      cycling: 'BICYCLE',
      bicycling: 'BICYCLE',
    };

    return profileMap[profile] || 'DRIVE';
  }

  /**
   * Process Google Maps response from GraphQL
   * @param {Object} routeData - Route data from GraphQL response
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @returns {Object} Processed route data
   */
  processGoogleMapsResponse(routeData, origin, destination) {
    const { polyline, distanceMeters, routeLegs } = routeData;

    // Decode polyline to coordinates
    let coordinates = [];
    if (polyline) {
      try {
        coordinates = decode(polyline).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
      } catch (error) {
        console.error('GoogleMaps Routing: Failed to decode polyline:', error);
        coordinates = [origin, destination];
      }
    } else {
      coordinates = [origin, destination];
    }

    // Calculate duration estimate from distance (fallback if not provided)
    const estimatedDuration = this.estimateDuration(distanceMeters, 'driving');

    // Process route legs for additional metadata
    const processedLegs =
      routeLegs?.map((leg) => ({
        ...leg,
        // Decode leg polyline if available
        coordinates: leg.polyline ? this.decodePolylineSafely(leg.polyline) : [],
        // Parse PostGIS POINT format if available
        startCoordinates: leg.startPoint ? this.parsePostGISPoint(leg.startPoint) : null,
        endCoordinates: leg.endPoint ? this.parsePostGISPoint(leg.endPoint) : null,
      })) || [];

    return {
      coordinates,
      distance: distanceMeters, // Already in meters
      duration: estimatedDuration, // Estimated duration in seconds
      summary: `${(distanceMeters / 1000).toFixed(1)}km, ${Math.round(estimatedDuration / 60)}min`,
      origin,
      destination,
      polyline,
      fetchedAt: Date.now(),
      source: 'google_directions_graphql',
      // Google-specific data
      id: routeData.id,
      orderId: routeData.orderId,
      routeLegs: processedLegs,
    };
  }

  /**
   * Safely decode polyline with error handling
   * @param {string} polylineString - Encoded polyline string
   * @returns {Array} Array of coordinates or empty array
   */
  decodePolylineSafely(polylineString) {
    try {
      return decode(polylineString).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
    } catch (error) {
      console.warn('GoogleMaps Routing: Failed to decode polyline segment:', error);
      return [];
    }
  }

  /**
   * Parse PostGIS POINT format to coordinates
   * @param {string} pointString - PostGIS POINT string like "POINT (40.632776 -73.9585965)"
   * @returns {Object|null} Coordinate object {latitude, longitude} or null
   */
  parsePostGISPoint(pointString) {
    try {
      if (!pointString || typeof pointString !== 'string') return null;

      // Match PostGIS POINT format: "POINT (lat lng)"
      const match = pointString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
      }

      console.warn('GoogleMaps Routing: Invalid PostGIS POINT format:', pointString);
      return null;
    } catch (error) {
      console.warn('GoogleMaps Routing: Failed to parse PostGIS POINT:', error);
      return null;
    }
  }

  /**
   * Estimate duration based on distance and travel mode
   * @param {number} distanceMeters - Distance in meters
   * @param {string} travelMode - Travel mode
   * @returns {number} Estimated duration in seconds
   */
  estimateDuration(distanceMeters, travelMode = 'driving') {
    // Average speeds in m/s for different travel modes
    const averageSpeeds = {
      driving: 13.89, // ~50 km/h in urban areas
      'driving-traffic': 11.11, // ~40 km/h with traffic
      walking: 1.39, // ~5 km/h
      cycling: 4.17, // ~15 km/h
      bicycling: 4.17,
    };

    const speed = averageSpeeds[travelMode] || averageSpeeds.driving;
    return Math.round(distanceMeters / speed);
  }

  /**
   * Generate fallback route (straight line) when API fails
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @returns {Object} Fallback route data
   */
  generateFallbackRoute(origin, destination) {
    const coordinates = [origin, destination];
    const distance = calculateDistance(origin, destination);
    const duration = this.estimateDuration(distance, 'driving');

    return {
      coordinates,
      distance,
      duration,
      summary: `${(distance / 1000).toFixed(1)}km, ${Math.round(duration / 60)}min (direct)`,
      origin,
      destination,
      polyline: null,
      fetchedAt: Date.now(),
      source: 'fallback',
    };
  }

  /**
   * Check if courier has deviated significantly from route
   * @param {Object} currentLocation - Current courier location
   * @param {Array} routeCoordinates - Route coordinates
   * @param {number} progress - Current progress along route (0-1)
   * @returns {boolean} True if courier has deviated significantly
   */
  hasDeviatedFromRoute(currentLocation, routeCoordinates, progress) {
    if (!routeCoordinates || routeCoordinates.length < 2) return false;

    // Find expected position on route
    const expectedIndex = Math.floor(progress * (routeCoordinates.length - 1));
    const expectedPosition = routeCoordinates[expectedIndex];

    if (!expectedPosition) return false;

    // Calculate distance from expected position
    const deviation = calculateDistance(currentLocation, expectedPosition);

    return deviation > ROUTE_CACHE_CONFIG.DEVIATION_THRESHOLD;
  }

  /**
   * Get route cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.cache.size,
      maxSize: ROUTE_CACHE_CONFIG.MAX_CACHE_SIZE,
      // Note: hit/miss tracking would need to be added to cache implementation
    };
  }
}

// Export singleton instance
export const googleMapsRoutingService = new GoogleMapsRoutingService();
export default googleMapsRoutingService;
