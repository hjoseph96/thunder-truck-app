// Mapbox Directions API integration for real-time courier routing
// Provides route fetching, caching, and optimization for courier tracking

import { calculateDistance, calculatePolylineDistance } from './animation-utils';
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
 * Mapbox Directions API service
 */
export class RoutingService {
  constructor() {
    this.cache = new RouteCache();
    this.accessToken = null; // Will be set from config
    this.baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';

    // Cleanup cache periodically
    setInterval(() => {
      this.cache.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Set Mapbox access token
   * @param {string} accessToken - Mapbox access token
   */
  setAccessToken(accessToken) {
    this.accessToken = accessToken;
  }

  /**
   * Fetch route from Mapbox Directions API
   * @param {Object} origin - Origin coordinates {latitude, longitude}
   * @param {Object} destination - Destination coordinates {latitude, longitude}
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Route data with coordinates and metadata
   */
  async fetchRoute(origin, destination, options = {}) {
    const {
      profile = 'driving', // driving, walking, cycling, driving-traffic
      alternatives = false,
      steps = true,
      geometries = 'polyline',
      overview = 'full',
      exclude = [], // Array of road types to exclude: 'toll', 'motorway', 'ferry'
    } = options;

    // Check cache first
    const cacheKey = this.cache.generateKey(origin, destination, profile);
    const cachedRoute = this.cache.get(cacheKey);
    if (cachedRoute) {
      console.log('Routing: Using cached route for', cacheKey);
      return cachedRoute;
    }

    // Check rate limiting
    if (!this.cache.canFetch(cacheKey)) {
      console.warn('Routing: Rate limited, using cached route or fallback');
      return cachedRoute || this.generateFallbackRoute(origin, destination);
    }

    if (!this.accessToken) {
      console.warn('Routing: No Mapbox access token configured, using fallback route');
      return this.generateFallbackRoute(origin, destination);
    }

    try {
      this.cache.recordFetch(cacheKey);

      // Build Mapbox Directions API URL
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const params = new URLSearchParams({
        alternatives: alternatives.toString(),
        steps: steps.toString(),
        geometries: geometries,
        overview: overview,
        access_token: this.accessToken,
      });

      // Add exclusions if specified
      if (exclude.length > 0) {
        params.append('exclude', exclude.join(','));
      }

      const url = `${this.baseUrl}/${profile}/${coordinates}?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.error('Routing: Mapbox Directions API error:', data.code, data.message);
        return this.generateFallbackRoute(origin, destination);
      }

      const route = this.processMapboxResponse(data.routes[0], origin, destination);

      // Cache the successful route
      this.cache.set(cacheKey, route);

      console.log('Routing: Fetched new route from Mapbox Directions API');
      return route;

    } catch (error) {
      console.error('Routing: Failed to fetch route from Mapbox Directions API:', error);
      return this.generateFallbackRoute(origin, destination);
    }
  }

  /**
   * Process Mapbox Directions API response
   * @param {Object} route - Route from Mapbox Directions API
   * @param {Object} origin - Origin coordinates
   * @param {Object} destination - Destination coordinates
   * @returns {Object} Processed route data
   */
  processMapboxResponse(route, origin, destination) {
    const polylinePoints = route.geometry;

    // Decode polyline to coordinates
    const coordinates = decode(polylinePoints).map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return {
      coordinates,
      distance: route.distance, // meters (already in meters for Mapbox)
      duration: route.duration, // seconds (already in seconds for Mapbox)
      summary: `${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min`,
      origin,
      destination,
      polyline: polylinePoints,
      fetchedAt: Date.now(),
      source: 'mapbox_directions',
      // Additional Mapbox-specific data
      legs: route.legs,
      weight: route.weight,
      weight_name: route.weight_name,
    };
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
    
    return {
      coordinates,
      distance,
      duration: Math.round(distance / 10), // Rough estimate: 10 m/s average speed
      summary: 'Fallback direct route',
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
      cacheHitRate: this.cache.hits / (this.cache.hits + this.cache.misses) || 0,
    };
  }
}

// Export singleton instance
export const routingService = new RoutingService();
export default routingService;
