// Courier tracking service for real-time location updates
// Manages courier data, routes, and animation states

import { calculateDistance, getCoordinateAtProgress, interpolateProgress } from './animation-utils';
import { webSocketService, WEBSOCKET_EVENTS } from './websocket-service';
import { googleMapsRoutingService } from './google-maps-routing-service';
import {
  DEVIATION_THRESHOLDS,
  ANIMATION_SETTINGS,
  DEFAULT_ROUTING_PROFILE,
} from '../config/courier-config';

/**
 * Courier data model
 */
export class Courier {
  constructor(id, name, currentLocation = null, route = null) {
    this.id = id;
    this.name = name;
    this.currentLocation = currentLocation; // {latitude, longitude, timestamp}
    this.route = route; // Array of coordinates
    this.destination = null; // Final destination for route optimization
    this.routeMetadata = null; // Additional route information from routing service

    // Use default animation settings (can be made configurable later when backend supports courier types)
    const animationSettings = ANIMATION_SETTINGS.default;

    this.animationState = {
      isAnimating: false,
      currentProgress: 0,
      targetProgress: 0,
      lastUpdate: Date.now(),
      animationId: null,
      // Enhanced animation properties for smooth continuous movement
      velocity: 0, // Current movement velocity for smoother transitions
      lastPosition: null, // Previous position for velocity calculation
      smoothingFactor: animationSettings.smoothingFactor,
      animationDuration: 3000, // 3 seconds to match location update interval
      minUpdateInterval: animationSettings.minUpdateInterval,
      lastRouteCheck: 0, // Last time we checked for route deviation
      // New polyline animation properties
      animationStartTime: null,
      animationStartProgress: 0,
      isPolylineAnimating: false,
    };
    this.status = 'idle'; // idle, moving, arrived, deviating
    this._markerRef = null; // Reference to the animated marker component
  }

  /**
   * Update courier location
   * @param {Object} location - New location {latitude, longitude, timestamp}
   */
  updateLocation(location) {
    this.currentLocation = {
      ...location,
      timestamp: location.timestamp || Date.now(),
    };

    // Update progress along route if route exists
    if (this.route && this.route.length > 0) {
      this.updateRouteProgress();
    }
  }

  /**
   * Set courier route
   * @param {Array} coordinates - Route coordinates
   */
  setRoute(coordinates) {
    this.route = coordinates;
    this.animationState.currentProgress = 0;
    this.animationState.targetProgress = 0;
    // Reset last position to allow fresh progress calculation
    this.animationState.lastPosition = null;
    console.log(
      `🛣️ Courier ${this.name}: New route set with ${coordinates?.length || 0} points, progress reset to 0`,
    );
  }

  /**
   * Update progress along current route based on current location
   * Uses a monotonic progress algorithm that works with real GPS data
   */
  updateRouteProgress() {
    if (!this.route || !this.currentLocation) return;

    const currentTargetProgress = this.animationState.targetProgress;
    const currentTime = this.currentLocation.timestamp || Date.now();

    // Calculate distance moved and time elapsed since last update
    let distanceMoved = 0;
    let timeDelta = 0;
    if (this.animationState.lastPosition) {
      distanceMoved = calculateDistance(this.animationState.lastPosition, this.currentLocation);
      timeDelta = currentTime - (this.animationState.lastPosition.timestamp || Date.now());

      // Calculate velocity (meters per millisecond) for smoother animation
      this.animationState.velocity = timeDelta > 0 ? distanceMoved / timeDelta : 0;
    }

    // Find closest point on route using limited search range
    const currentSegmentIndex = Math.floor(currentTargetProgress * (this.route.length - 1));

    // Search range: current segment ± 2 segments (handles GPS noise and route geometry)
    const searchStartIndex = Math.max(0, currentSegmentIndex - 2);
    const searchEndIndex = Math.min(this.route.length - 1, currentSegmentIndex + 4);

    let closestDistance = Infinity;
    let closestProgress = currentTargetProgress;

    // Find closest point within search range
    for (let i = searchStartIndex; i < searchEndIndex; i++) {
      const segmentStart = this.route[i];
      const segmentEnd = this.route[i + 1];

      const closestPointOnSegment = this.getClosestPointOnSegment(
        this.currentLocation,
        segmentStart,
        segmentEnd,
      );

      const distance = calculateDistance(this.currentLocation, closestPointOnSegment.point);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestProgress = (i + closestPointOnSegment.ratio) / (this.route.length - 1);
      }
    }

    // MONOTONIC PROGRESS CONSTRAINT - This is the key fix for real GPS data
    let newTargetProgress = closestProgress;
    const progressDiff = closestProgress - currentTargetProgress;

    // Constants for real-world GPS behavior
    const GPS_ACCURACY_THRESHOLD = 20; // meters - typical GPS accuracy
    const MAX_BACKWARD_PROGRESS = 0.01; // 1% - maximum allowed backward movement
    const MIN_FORWARD_PROGRESS = 0.001; // 0.1% - minimum forward progress per update

    // Apply monotonic constraint based on GPS accuracy and distance moved
    if (progressDiff < 0) {
      // Backward movement detected
      if (closestDistance > GPS_ACCURACY_THRESHOLD) {
        // Far from route - likely GPS error, maintain current progress
        newTargetProgress = currentTargetProgress;
        console.log(
          `🛑 Courier ${this.name}: GPS error detected (${closestDistance.toFixed(1)}m from route), maintaining progress ${(currentTargetProgress * 100).toFixed(1)}%`,
        );
      } else if (Math.abs(progressDiff) > MAX_BACKWARD_PROGRESS) {
        // Large backward jump - constrain it
        newTargetProgress = Math.max(
          closestProgress,
          currentTargetProgress - MAX_BACKWARD_PROGRESS,
        );
        console.log(
          `🔧 Courier ${this.name}: Large backward jump constrained from ${(closestProgress * 100).toFixed(1)}% to ${(newTargetProgress * 100).toFixed(1)}%`,
        );
      } else {
        // Small backward movement within GPS noise - allow it
        newTargetProgress = closestProgress;
        console.log(
          `📍 Courier ${this.name}: Small backward movement allowed (GPS noise): ${(progressDiff * 100).toFixed(2)}%`,
        );
      }
    } else if (progressDiff > 0) {
      // Forward movement - always allow but ensure minimum progress
      if (distanceMoved > 5 && progressDiff < MIN_FORWARD_PROGRESS) {
        // Courier moved but progress is too small - ensure minimum forward progress
        newTargetProgress = currentTargetProgress + MIN_FORWARD_PROGRESS;
        console.log(
          `⏩ Courier ${this.name}: Ensured minimum forward progress: ${(MIN_FORWARD_PROGRESS * 100).toFixed(1)}%`,
        );
      } else {
        // Normal forward movement
        newTargetProgress = closestProgress;
        console.log(
          `✅ Courier ${this.name}: Forward progress: ${(progressDiff * 100).toFixed(2)}%`,
        );
      }
    }

    // Apply the new progress with significance threshold
    const finalProgressDiff = Math.abs(newTargetProgress - currentTargetProgress);
    const SIGNIFICANT_CHANGE_THRESHOLD = 0.0005; // Only update if change is significant

    if (finalProgressDiff > SIGNIFICANT_CHANGE_THRESHOLD) {
      // Start new 3-second polyline animation
      this.startPolylineAnimation(currentTargetProgress, newTargetProgress, currentTime);

      // Animation started
    }

    // Update last position for next calculation
    this.animationState.lastPosition = { ...this.currentLocation };
  }

  /**
   * Get closest point on a line segment
   * @param {Object} point - Point to find closest to {latitude, longitude}
   * @param {Object} segmentStart - Start of line segment {latitude, longitude}
   * @param {Object} segmentEnd - End of line segment {latitude, longitude}
   * @returns {Object} Closest point and ratio along segment {point: {lat, lng}, ratio: 0-1}
   */
  getClosestPointOnSegment(point, segmentStart, segmentEnd) {
    const A = point.latitude - segmentStart.latitude;
    const B = point.longitude - segmentStart.longitude;
    const C = segmentEnd.latitude - segmentStart.latitude;
    const D = segmentEnd.longitude - segmentStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) {
      // Segment is a point
      return {
        point: { latitude: segmentStart.latitude, longitude: segmentStart.longitude },
        ratio: 0,
      };
    }

    let ratio = dot / lenSq;
    ratio = Math.max(0, Math.min(1, ratio)); // Clamp to segment

    const closestPoint = {
      latitude: segmentStart.latitude + ratio * C,
      longitude: segmentStart.longitude + ratio * D,
    };

    return { point: closestPoint, ratio };
  }

  /**
   * Check if courier has deviated from route and needs route update
   * @returns {boolean} True if courier has deviated significantly
   */
  checkRouteDeviation() {
    if (!this.route || !this.currentLocation || this.route.length < 2) {
      return false;
    }

    const now = Date.now();

    // Don't check too frequently to avoid excessive API calls
    if (now - this.animationState.lastRouteCheck < this.animationState.minUpdateInterval) {
      return false;
    }

    this.animationState.lastRouteCheck = now;

    // Use Google Maps routing service to check deviation
    const hasDeviated = googleMapsRoutingService.hasDeviatedFromRoute(
      this.currentLocation,
      this.route,
      this.animationState.currentProgress,
    );

    if (hasDeviated) {
      this.status = 'deviating';
      console.log(`Courier ${this.name} has deviated from route`);
    }

    return hasDeviated;
  }

  /**
   * Request route update from current location to destination
   * @returns {Promise<boolean>} True if route was successfully updated
   */
  async updateRouteToDestination() {
    if (!this.currentLocation || !this.destination) {
      console.warn(`Cannot update route for courier ${this.name}: missing location or destination`);
      return false;
    }

    try {
      console.log(
        `Fetching new route for courier ${this.name} from current location to destination`,
      );

      // Get routing preferences for this courier type
      const routingPreferences = this.getRoutingPreferences();

      const newRoute = await googleMapsRoutingService.fetchRoute(
        this.currentLocation,
        this.destination,
        routingPreferences,
      );

      if (newRoute && newRoute.coordinates && newRoute.coordinates.length > 1) {
        this.route = newRoute.coordinates;
        this.routeMetadata = newRoute;
        this.animationState.currentProgress = 0;
        this.animationState.targetProgress = 0;
        // Reset last position to allow fresh progress calculation
        this.animationState.lastPosition = null;
        this.status = 'moving';

        console.log(
          `Updated route for courier ${this.name}: ${newRoute.coordinates.length} points, ${(newRoute.distance / 1000).toFixed(2)}km`,
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to update route for courier ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Get routing preferences for this courier
   * Uses default driving profile suitable for food delivery
   * @returns {Object} Routing preferences
   */
  getRoutingPreferences() {
    // Use driving profile as default - works well for most food delivery scenarios
    // Can be made configurable later when backend supports courier types/preferences
    return {
      profile: 'driving',
      exclude: [], // Google API handles route optimization automatically
      alternatives: false,
      steps: true,
      geometries: 'polyline',
      overview: 'full',
    };
  }

  /**
   * Set destination for route optimization
   * @param {Object} destination - Destination coordinates {latitude, longitude}
   */
  setDestination(destination) {
    this.destination = destination;
  }

  /**
   * Start polyline animation from start progress to end progress over 3 seconds
   * @param {number} startProgress - Starting progress (0-1)
   * @param {number} endProgress - Ending progress (0-1)
   * @param {number} startTime - Animation start timestamp
   */
  startPolylineAnimation(startProgress, endProgress, startTime) {
    this.animationState.animationStartTime = startTime;
    this.animationState.animationStartProgress = startProgress;
    this.animationState.targetProgress = endProgress;
    this.animationState.isPolylineAnimating = true;
    this.animationState.lastUpdate = startTime;

    // Animation initialized
  }

  /**
   * Update animation progress based on elapsed time
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} True if animation is still active
   */
  updatePolylineAnimation(currentTime) {
    if (!this.animationState.isPolylineAnimating || !this.animationState.animationStartTime) {
      return false;
    }

    const elapsedTime = currentTime - this.animationState.animationStartTime;
    const animationProgress = Math.min(1, elapsedTime / this.animationState.animationDuration);

    // Use linear animation for constant speed movement
    const currentProgress = interpolateProgress(
      this.animationState.animationStartProgress,
      this.animationState.targetProgress,
      animationProgress,
      'linear',
    );

    this.animationState.currentProgress = currentProgress;

    // Check if animation is complete
    if (animationProgress >= 1) {
      this.animationState.isPolylineAnimating = false;
      this.animationState.currentProgress = this.animationState.targetProgress;
      // Animation completed
      return false;
    }

    return true;
  }

  /**
   * Get current position for animation
   * @returns {Object} Current animated position
   */
  getCurrentAnimatedPosition() {
    if (!this.route || this.route.length === 0) {
      return this.currentLocation;
    }

    return getCoordinateAtProgress(this.route, this.animationState.currentProgress);
  }
}

/**
 * Courier tracking manager
 */
export class CourierTrackingManager {
  constructor() {
    this.couriers = new Map(); // Map of courier ID to Courier instance
    this.subscribers = new Set(); // Set of callback functions for updates
    this.animationFrameId = null;
    this.isAnimating = false;
    this.webSocketSubscription = null;
    this.isWebSocketEnabled = false;
    this.routeOptimizationQueue = new Set(); // Queue of couriers needing route updates
    this.lastOptimizationCheck = 0;

    // Initialize WebSocket integration
    this.initializeWebSocket();
  }

  /**
   * Add or update a courier with enhanced route management
   * @param {string} id - Courier ID
   * @param {string} name - Courier name
   * @param {Object} location - Initial location
   * @param {Array} route - Route coordinates
   * @param {Object} destination - Final destination for route optimization
   */
  addCourier(id, name, location = null, route = null, destination = null) {
    const courier = new Courier(id, name, location, route);

    if (destination) {
      courier.setDestination(destination);
    }

    this.couriers.set(id, courier);
    this.notifySubscribers('courierAdded', { courier });

    // Start WebSocket position polling when first courier is added
    this.startWebSocketPositionPolling();

    // If we have location and destination but no route, fetch optimal route
    if (location && destination && (!route || route.length < 2)) {
      this.requestRouteOptimization(id);
    }

    return courier;
  }

  /**
   * Remove a courier
   * @param {string} id - Courier ID
   */
  removeCourier(id) {
    const courier = this.couriers.get(id);
    if (courier) {
      this.couriers.delete(id);
      this.notifySubscribers('courierRemoved', { courierId: id });
    }

    // Stop WebSocket position polling when no couriers remain
    this.stopWebSocketPositionPolling();
  }

  /**
   * Update courier location with intelligent route optimization
   * @param {string} id - Courier ID
   * @param {Object} location - New location
   */
  updateCourierLocation(id, location) {
    const courier = this.couriers.get(id);
    if (!courier) {
      console.warn(`⚠️ Courier ${id} not found for location update`);
      return;
    }

    // Location updated

    // Update location using enhanced progress calculation
    courier.updateLocation(location);

    // Check for route deviation and queue for optimization if needed
    if (courier.checkRouteDeviation()) {
      this.requestRouteOptimization(id);
    }

    // Notifying subscribers
    this.notifySubscribers('courierLocationUpdated', { courier, location });

    // Start animation if not already running
    if (!this.isAnimating) {
      this.startAnimation();
    }
  }

  /**
   * Request route optimization for a courier
   * @param {string} id - Courier ID
   */
  requestRouteOptimization(id) {
    this.routeOptimizationQueue.add(id);

    // Process optimization queue if not already processing
    this.processRouteOptimizationQueue();
  }

  /**
   * Process route optimization queue
   */
  async processRouteOptimizationQueue() {
    if (this.routeOptimizationQueue.size === 0) return;

    const now = Date.now();

    // Throttle optimization processing to avoid excessive API calls
    if (now - this.lastOptimizationCheck < 5000) {
      // 5 second throttle
      return;
    }

    this.lastOptimizationCheck = now;

    // Process up to 3 route optimizations at once to manage API quota
    const couriersToOptimize = Array.from(this.routeOptimizationQueue).slice(0, 3);

    for (const courierId of couriersToOptimize) {
      const courier = this.couriers.get(courierId);
      if (courier) {
        try {
          const routeUpdated = await courier.updateRouteToDestination();
          if (routeUpdated) {
            this.notifySubscribers('courierRouteOptimized', {
              courier,
              routeMetadata: courier.routeMetadata,
            });
          }
        } catch (error) {
          console.error(`Failed to optimize route for courier ${courierId}:`, error);
        }
      }

      // Remove from queue regardless of success/failure
      this.routeOptimizationQueue.delete(courierId);
    }
  }

  /**
   * Update courier route
   * @param {string} id - Courier ID
   * @param {Array} route - New route coordinates
   */
  updateCourierRoute(id, route) {
    const courier = this.couriers.get(id);
    if (courier) {
      courier.setRoute(route);
      this.notifySubscribers('courierRouteUpdated', { courier, route });
    }
  }

  /**
   * Get all couriers
   * @returns {Array} Array of courier objects
   */
  getAllCouriers() {
    return Array.from(this.couriers.values());
  }

  /**
   * Get courier by ID
   * @param {string} id - Courier ID
   * @returns {Courier|null} Courier instance or null
   */
  getCourier(id) {
    return this.couriers.get(id) || null;
  }

  /**
   * Subscribe to courier updates
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of updates
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in courier tracking subscriber:', error);
      }
    });
  }

  /**
   * Start animation loop for smooth marker movement along polylines
   */
  startAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const animate = () => {
      let hasActiveAnimations = false;
      const currentTime = Date.now();

      this.couriers.forEach((courier) => {
        // Update polyline-based animation (3-second movement along route)
        const isAnimating = courier.updatePolylineAnimation(currentTime);

        if (isAnimating) {
          hasActiveAnimations = true;
          courier.status = 'moving';
        } else if (courier.animationState.isPolylineAnimating === false) {
          courier.status = 'idle';
        }
      });

      // Process route optimization queue periodically during animation
      if (this.routeOptimizationQueue.size > 0) {
        this.processRouteOptimizationQueue();
      }

      if (hasActiveAnimations) {
        this.notifySubscribers('animationFrame', {
          couriers: this.getAllCouriers(),
          timestamp: currentTime,
        });
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Initialize WebSocket integration
   */
  initializeWebSocket() {
    // Subscribe to WebSocket courier location updates
    this.webSocketSubscription = webSocketService.subscribe(
      WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE,
      this.handleWebSocketLocationUpdate.bind(this),
    );

    // Subscribe to WebSocket connection state changes
    this.connectionStateSubscription = webSocketService.subscribe(
      WEBSOCKET_EVENTS.CONNECTION_STATE_CHANGED,
      this.handleWebSocketStateChange.bind(this),
    );
  }

  /**
   * Start WebSocket position polling when couriers are added
   */
  startWebSocketPositionPolling() {
    if (this.couriers.size > 0 && !webSocketService.isPollingActive()) {
      console.log('📍 Starting WebSocket position polling for courier tracking');
      // Connect WebSocket if not connected
      if (!webSocketService.isConnected()) {
        webSocketService
          .connect()
          .then(() => {
            // Polling will start automatically when connection is confirmed
          })
          .catch((error) => {
            console.error('Failed to connect WebSocket for courier tracking:', error);
          });
      } else {
        // Start polling with 3-second interval as requested
        webSocketService.startCourierPositionPolling(3000);
      }
    }
  }

  /**
   * Stop WebSocket position polling when no couriers are active
   */
  stopWebSocketPositionPolling() {
    if (this.couriers.size === 0 && webSocketService.isPollingActive()) {
      console.log('📍 Stopping WebSocket position polling - no active couriers');
      webSocketService.stopCourierPositionPolling();
    }
  }

  /**
   * Handle WebSocket courier location updates
   * @param {Object} data - Location update data from WebSocket
   */
  handleWebSocketLocationUpdate(data) {
    try {
      const { courier_id, latitude, longitude, timestamp, route } = data;
      console.group('Courier Location Update');
      console.log('Courier ID:', courier_id);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      console.log('Timestamp:', timestamp);
      console.log('Route:', route);
      console.groupEnd();

      if (!courier_id || (!latitude && latitude !== 0) || (!longitude && longitude !== 0)) {
        console.warn('Invalid courier location data received:', data);
        return;
      }

      const location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
      };

      // Update courier location using enhanced monotonic progress calculation
      this.updateCourierLocation(courier_id, location);

      // Update route if provided
      if (route && Array.isArray(route)) {
        this.updateCourierRoute(courier_id, route);
      }

      // Start animation if not already running
      if (!this.isAnimating) {
        this.startAnimation();
      }
    } catch (error) {
      console.error('Error handling WebSocket location update:', error);
    }
  }

  /**
   * Handle WebSocket connection state changes
   * @param {Object} data - Connection state data
   */
  handleWebSocketStateChange(data) {
    const { state, previousState } = data;
    this.isWebSocketEnabled = state === 'connected';

    // Notify subscribers about WebSocket state change
    this.notifySubscribers('webSocketStateChanged', {
      state,
      previousState,
      isEnabled: this.isWebSocketEnabled,
    });
  }

  /**
   * Enable real-time WebSocket updates
   * @returns {Promise<void>}
   */
  async enableRealTimeUpdates() {
    try {
      await webSocketService.connect();
      console.log('Real-time courier tracking enabled');
    } catch (error) {
      console.error('Failed to enable real-time updates:', error);
      throw error;
    }
  }

  /**
   * Disable real-time WebSocket updates
   */
  disableRealTimeUpdates() {
    webSocketService.disconnect();
    this.isWebSocketEnabled = false;
    console.log('Real-time courier tracking disabled');
  }

  /**
   * Check if real-time updates are enabled
   * @returns {boolean} True if WebSocket is connected and real-time updates are active
   */
  isRealTimeEnabled() {
    return this.isWebSocketEnabled && webSocketService.isConnected();
  }

  /**
   * Get WebSocket connection state
   * @returns {string} Current WebSocket connection state
   */
  getWebSocketState() {
    return webSocketService.getConnectionState();
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics and statistics
   */
  getPerformanceMetrics() {
    const routingStats = googleMapsRoutingService.getCacheStats();
    const courierCount = this.couriers.size;
    const activeAnimations = Array.from(this.couriers.values()).filter(
      (courier) => courier.animationState.isAnimating,
    ).length;

    return {
      couriers: {
        total: courierCount,
        activeAnimations,
        deviating: Array.from(this.couriers.values()).filter((c) => c.status === 'deviating')
          .length,
        moving: Array.from(this.couriers.values()).filter((c) => c.status === 'moving').length,
      },
      routing: {
        cacheSize: routingStats.size,
        cacheHitRate: routingStats.cacheHitRate,
        optimizationQueueSize: this.routeOptimizationQueue.size,
      },
      realTime: {
        webSocketConnected: this.isRealTimeEnabled(),
        webSocketState: this.getWebSocketState(),
      },
      animation: {
        isAnimating: this.isAnimating,
        frameId: this.animationFrameId,
      },
    };
  }

  /**
   * Enable graceful degradation mode
   * Reduces functionality to maintain basic operation under stress
   */
  enableGracefulDegradation() {
    console.warn('Courier tracking: Enabling graceful degradation mode');

    // Reduce animation frequency
    this.animationThrottled = true;

    // Clear optimization queue to reduce API calls
    this.routeOptimizationQueue.clear();

    // Disable real-time updates if WebSocket is causing issues
    if (this.isWebSocketEnabled && this.getWebSocketState() === 'error') {
      this.disableRealTimeUpdates();
    }

    // Increase smoothing factors to reduce computation
    this.couriers.forEach((courier) => {
      courier.animationState.smoothingFactor = Math.min(
        courier.animationState.smoothingFactor * 1.5,
        0.3,
      );
    });
  }

  /**
   * Disable graceful degradation mode
   */
  disableGracefulDegradation() {
    console.log('Courier tracking: Disabling graceful degradation mode');

    this.animationThrottled = false;

    // Restore original animation settings
    this.couriers.forEach((courier) => {
      const animationSettings =
        ANIMATION_SETTINGS[courier.courierType] || ANIMATION_SETTINGS.default;
      courier.animationState.smoothingFactor = animationSettings.smoothingFactor;
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopAnimation();

    // Clean up WebSocket subscriptions
    if (this.webSocketSubscription) {
      this.webSocketSubscription();
      this.webSocketSubscription = null;
    }

    if (this.connectionStateSubscription) {
      this.connectionStateSubscription();
      this.connectionStateSubscription = null;
    }

    // Disconnect WebSocket
    this.disableRealTimeUpdates();

    // Clear optimization queue
    this.routeOptimizationQueue.clear();

    this.couriers.clear();
    this.subscribers.clear();
  }
}

// Global instance
export const courierTrackingManager = new CourierTrackingManager();
