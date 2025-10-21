// Simplified Courier tracking service for real-time location updates
// Clean separation between courier data model and animation logic

import { calculateDistance, getCoordinateAtProgress } from './animation-utils';

/**
 * Core courier data model - simplified and focused
 */
export class Courier {
  constructor(id, name, currentLocation = null) {
    this.id = id;
    this.name = name;
    this.currentLocation = currentLocation; // {latitude, longitude, timestamp}
    this.route = null; // Array of coordinates
    this.destination = null;
    this.status = 'idle'; // idle, moving, arrived
    this.lastUpdate = Date.now();
  }

  /**
   * Update courier location with basic validation
   */
  updateLocation(location) {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.warn(`Invalid location for courier ${this.id}:`, location);
      return false;
    }

    this.currentLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp || Date.now(),
    };
    this.lastUpdate = Date.now();
    return true;
  }

  /**
   * Set courier route with validation
   */
  setRoute(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      console.warn(`Invalid route for courier ${this.id}:`, coordinates);
      return false;
    }

    this.route = coordinates.filter(coord =>
      coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number'
    );

    if (this.route.length === 0) {
      console.warn(`No valid coordinates in route for courier ${this.id}`);
      return false;
    }

    return true;
  }

  /**
   * Get current progress along route (0-1)
   */
  getRouteProgress() {
    if (!this.route || !this.currentLocation) {
      return 0;
    }

    // Simple progress calculation based on distance from start
    const startPoint = this.route[0];
    const endPoint = this.route[this.route.length - 1];

    const totalDistance = calculateDistance(startPoint, endPoint);
    const currentDistance = calculateDistance(startPoint, this.currentLocation);

    return Math.min(currentDistance / totalDistance, 1);
  }

  /**
   * Check if courier is near a specific coordinate
   */
  isNear(coordinate, thresholdMeters = 50) {
    if (!this.currentLocation) return false;

    const distance = calculateDistance(this.currentLocation, coordinate);
    return distance <= thresholdMeters;
  }

  /**
   * Get courier summary for debugging
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      hasLocation: !!this.currentLocation,
      hasRoute: !!this.route,
      routeLength: this.route?.length || 0,
      lastUpdate: this.lastUpdate,
    };
  }
}

/**
 * Simplified courier tracking manager
 */
class CourierTrackingManager {
  constructor() {
    this.couriers = new Map();
    this.listeners = new Set();
  }

  /**
   * Add a new courier
   */
  addCourier(id, name, initialLocation = null) {
    if (this.couriers.has(id)) {
      console.warn(`Courier ${id} already exists`);
      return false;
    }

    const courier = new Courier(id, name, initialLocation);
    this.couriers.set(id, courier);

    this.notifyListeners('courierAdded', { courier: courier.getSummary() });
    return true;
  }

  /**
   * Remove a courier
   */
  removeCourier(id) {
    const courier = this.couriers.get(id);
    if (!courier) {
      console.warn(`Courier ${id} not found`);
      return false;
    }

    this.couriers.delete(id);
    this.notifyListeners('courierRemoved', { courierId: id, courierName: courier.name });
    console.log(`Removed courier: ${courier.name} (${id})`);
    return true;
  }

  /**
   * Update courier location
   */
  updateCourierLocation(id, location) {
    const courier = this.couriers.get(id);
    if (!courier) {
      console.warn(`Courier ${id} not found for location update`);
      return false;
    }

    const success = courier.updateLocation(location);
    if (success) {
      this.notifyListeners('locationUpdated', {
        courierId: id,
        location: courier.currentLocation,
        progress: courier.getRouteProgress()
      });
    }
    return success;
  }

  /**
   * Set route for a courier
   */
  setCourierRoute(id, coordinates) {
    const courier = this.couriers.get(id);
    if (!courier) {
      console.warn(`Courier ${id} not found for route setting`);
      return false;
    }

    const success = courier.setRoute(coordinates);
    if (success) {
      this.notifyListeners('routeUpdated', {
        courierId: id,
        routeLength: courier.route.length
      });
    }
    return success;
  }

  /**
   * Get courier by ID
   */
  getCourier(id) {
    return this.couriers.get(id);
  }

  /**
   * Get all couriers
   */
  getAllCouriers() {
    return Array.from(this.couriers.values());
  }

  /**
   * Get couriers summary for debugging
   */
  getSummary() {
    return {
      totalCouriers: this.couriers.size,
      couriers: Array.from(this.couriers.values()).map(c => c.getSummary()),
      listeners: this.listeners.size,
    };
  }

  /**
   * Add event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    return this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of events
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in courier tracking listener:', error);
      }
    });
  }

  /**
   * Clear all couriers and reset state
   */
  reset() {
    const courierCount = this.couriers.size;
    this.couriers.clear();
    this.notifyListeners('reset', { previousCourierCount: courierCount });
    console.log(`Reset courier tracking manager (removed ${courierCount} couriers)`);
  }

  /**
   * Clean up old/stale couriers (haven't been updated in threshold time)
   */
  cleanup(thresholdMs = 300000) { // 5 minutes default
    const now = Date.now();
    const staleIds = [];

    for (const [id, courier] of this.couriers) {
      if (now - courier.lastUpdate > thresholdMs) {
        staleIds.push(id);
      }
    }

    staleIds.forEach(id => this.removeCourier(id));

    if (staleIds.length > 0) {
      console.log(`Cleaned up ${staleIds.length} stale couriers`);
    }

    return staleIds.length;
  }
}

// Export singleton instance
export const courierTrackingManager = new CourierTrackingManager();

// Auto-cleanup every 10 minutes
setInterval(() => {
  courierTrackingManager.cleanup();
}, 600000);

export default courierTrackingManager;