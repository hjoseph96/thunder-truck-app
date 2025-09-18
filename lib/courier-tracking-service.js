// Courier tracking service for real-time location updates
// Manages courier data, routes, and animation states

import { calculateDistance, getCoordinateAtProgress } from './animation-utils';
import { webSocketService, WEBSOCKET_EVENTS } from './websocket-service';

/**
 * Courier data model
 */
export class Courier {
  constructor(id, name, currentLocation = null, route = null) {
    this.id = id;
    this.name = name;
    this.currentLocation = currentLocation; // {latitude, longitude, timestamp}
    this.route = route; // Array of coordinates
    this.animationState = {
      isAnimating: false,
      currentProgress: 0,
      targetProgress: 0,
      lastUpdate: Date.now(),
      animationId: null,
    };
    this.status = 'idle'; // idle, moving, arrived
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
  }

  /**
   * Update progress along current route based on current location
   */
  updateRouteProgress() {
    if (!this.route || !this.currentLocation) return;

    // Find closest point on route to current location
    let closestDistance = Infinity;
    let closestProgress = 0;

    for (let i = 0; i < this.route.length; i++) {
      const distance = calculateDistance(this.currentLocation, this.route[i]);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestProgress = i / (this.route.length - 1);
      }
    }

    this.animationState.targetProgress = closestProgress;
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

    // Initialize WebSocket integration
    this.initializeWebSocket();
  }

  /**
   * Add or update a courier
   * @param {string} id - Courier ID
   * @param {string} name - Courier name
   * @param {Object} location - Initial location
   * @param {Array} route - Route coordinates
   */
  addCourier(id, name, location = null, route = null) {
    const courier = new Courier(id, name, location, route);
    this.couriers.set(id, courier);
    this.notifySubscribers('courierAdded', { courier });
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
  }

  /**
   * Update courier location
   * @param {string} id - Courier ID
   * @param {Object} location - New location
   */
  updateCourierLocation(id, location) {
    const courier = this.couriers.get(id);
    if (courier) {
      courier.updateLocation(location);
      this.notifySubscribers('courierLocationUpdated', { courier, location });
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
   * Start animation loop for smooth marker movement
   */
  startAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const animate = () => {
      let hasActiveAnimations = false;

      this.couriers.forEach((courier) => {
        const { animationState } = courier;

        if (Math.abs(animationState.targetProgress - animationState.currentProgress) > 0.001) {
          // Smooth interpolation towards target
          const diff = animationState.targetProgress - animationState.currentProgress;
          animationState.currentProgress += diff * 0.1; // Smooth factor
          hasActiveAnimations = true;
        }
      });

      if (hasActiveAnimations) {
        this.notifySubscribers('animationFrame', { couriers: this.getAllCouriers() });
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
   * Handle WebSocket courier location updates
   * @param {Object} data - Location update data from WebSocket
   */
  handleWebSocketLocationUpdate(data) {
    try {
      const { courier_id, latitude, longitude, timestamp, route } = data;

      if (!courier_id || (!latitude && latitude !== 0) || (!longitude && longitude !== 0)) {
        console.warn('Invalid courier location data received:', data);
        return;
      }

      const location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
      };

      // Update courier location
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

    this.couriers.clear();
    this.subscribers.clear();
  }
}

// Global instance
export const courierTrackingManager = new CourierTrackingManager();
