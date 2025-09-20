// Mock Backend Service for Realistic Demo Testing
// Simulates real backend responses while using actual Mapbox API calls

import { webSocketService, WEBSOCKET_EVENTS } from './websocket-service';

/**
 * Mock backend service that simulates real GraphQL mutations and WebSocket messages
 * Uses the exact same data structures as the production backend
 */
export class MockBackendService {
  constructor() {
    this.isEnabled = false;
    this.mockCouriers = new Map(); // Store mock courier data
    this.simulationIntervals = new Map(); // Store active simulations
    this.mockWebSocketConnected = false;
  }

  /**
   * Enable mock backend mode
   */
  enable() {
    this.isEnabled = true;
    console.log('🎭 Mock Backend Service: Enabled');

    // Mock WebSocket connection
    this.mockWebSocketConnection();
  }

  /**
   * Disable mock backend mode
   */
  disable() {
    this.isEnabled = false;
    this.stopAllSimulations();
    this.mockWebSocketConnected = false;
    console.log('🎭 Mock Backend Service: Disabled');
  }

  /**
   * Check if mock backend is enabled
   */
  isActive() {
    return this.isEnabled;
  }

  /**
   * Mock WebSocket connection and simulate Action Cable behavior
   */
  mockWebSocketConnection() {
    if (this.mockWebSocketConnected) return;

    this.mockWebSocketConnected = true;

    // Simulate WebSocket connection sequence
    setTimeout(() => {
      webSocketService.emit(WEBSOCKET_EVENTS.CONNECTION_STATE_CHANGED, {
        state: 'connecting',
        previousState: 'disconnected',
      });
    }, 100);

    setTimeout(() => {
      webSocketService.emit(WEBSOCKET_EVENTS.CONNECTION_STATE_CHANGED, {
        state: 'connected',
        previousState: 'connecting',
      });

      // Simulate Action Cable welcome message
      webSocketService.emit(WEBSOCKET_EVENTS.MESSAGE_RECEIVED, {
        type: 'welcome',
      });

      console.log('🎭 Mock WebSocket: Connected and ready');
    }, 500);
  }

  /**
   * Create a mock courier with realistic data structure
   * @param {string} id - Courier ID
   * @param {string} name - Courier name
   * @param {Object} startLocation - Starting coordinates
   * @param {Object} destination - Destination coordinates
   * @returns {Object} Mock courier data
   */
  createMockCourier(id, name, startLocation, destination) {
    const mockCourier = {
      id,
      name,
      startLocation,
      destination,
      currentLocation: { ...startLocation, timestamp: Date.now() },
      route: null, // Will be fetched from Mapbox
      status: 'idle',
      createdAt: new Date().toISOString(),
      // Simulate backend metadata
      metadata: {
        phoneNumber: `+1555${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, '0')}`,
        vehicleType: 'bicycle', // Default for now
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        totalDeliveries: Math.floor(Math.random() * 500) + 50,
      },
    };

    this.mockCouriers.set(id, mockCourier);
    console.log(`🎭 Mock Backend: Created courier ${name} (${id})`);

    return mockCourier;
  }

  /**
   * Simulate GraphQL updateCourierPosition mutation
   * @param {string} courierId - Courier ID
   * @param {Object} location - New location coordinates
   * @param {Object} metadata - Optional metadata including route progress info
   * @returns {Promise<Object>} Mock GraphQL response
   */
  async mockUpdateCourierPosition(courierId, location, metadata = {}) {
    if (!this.isEnabled) return null;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    const courier = this.mockCouriers.get(courierId);
    if (!courier) {
      throw new Error(`Courier ${courierId} not found`);
    }

    // Update mock courier data
    courier.currentLocation = {
      ...location,
      timestamp: Date.now(),
    };

    // Store movement metadata for consistent forward-only movement
    if (metadata.routeIndex !== undefined) {
      courier.metadata = {
        ...courier.metadata,
        currentRouteIndex: metadata.routeIndex,
        routeProgress: metadata.routeProgress,
        lastUpdateTime: Date.now(),
      };
    }

    // Simulate GraphQL response structure (based on real backend API)
    const mockResponse = {
      updateCourierPosition: {
        courier: {
          id: courierId,
          name: courier.name,
          currentLocation: courier.currentLocation,
          status: courier.status,
          updatedAt: new Date().toISOString(),
        },
        success: true,
        errors: null,
      },
    };

    // Broadcast WebSocket update (simulate real-time broadcast)
    this.broadcastCourierUpdate(courierId, location, metadata);

    console.log(
      `🎭 Mock GraphQL: Updated position for ${courier.name}${metadata.routeProgress ? ` (progress: ${(metadata.routeProgress * 100).toFixed(1)}%)` : ''}`,
    );
    return mockResponse;
  }

  /**
   * Broadcast courier location update via mock WebSocket
   * @param {string} courierId - Courier ID
   * @param {Object} location - Location data
   * @param {Object} metadata - Optional metadata including route progress info
   */
  broadcastCourierUpdate(courierId, location, metadata = {}) {
    if (!this.mockWebSocketConnected) return;

    const courier = this.mockCouriers.get(courierId);
    if (!courier) return;

    // Simulate Action Cable message structure (matching real backend format)
    const mockWebSocketMessage = {
      type: 'message',
      message: {
        courier_id: courierId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp || Date.now(),
        status: courier.status,
        // Include route only if it exists (real backend behavior)
        ...(courier.route && { route: courier.route }),
        // Include metadata for debugging but don't add non-standard fields
        ...(courier.metadata && { metadata: courier.metadata }),
      },
    };

    // Emit the WebSocket message
    webSocketService.emit(WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE, mockWebSocketMessage.message);

    console.log(
      `🎭 Mock WebSocket: Broadcasted update for ${courier.name}${metadata.routeProgress ? ` (progress: ${(metadata.routeProgress * 100).toFixed(1)}%)` : ''}`,
    );
  }

  /**
   * Start realistic movement simulation for a courier
   * @param {string} courierId - Courier ID
   * @param {Array} route - Route coordinates from Mapbox
   * @param {Object} options - Simulation options
   */
  startMovementSimulation(courierId, route, options = {}) {
    console.log(`🎭 Starting simulation for ${courierId}:`, {
      enabled: this.isEnabled,
      routeLength: route?.length,
      routeFormat: route?.[0] ? Object.keys(route[0]) : 'no route',
      firstPoint: route?.[0],
      lastPoint: route?.[route.length - 1],
    });

    if (!this.isEnabled || !route || route.length < 2) {
      console.warn(`🎭 Cannot start simulation:`, {
        enabled: this.isEnabled,
        hasRoute: !!route,
        routeLength: route?.length,
      });
      return;
    }

    const {
      updateInterval = 1000, // 1 second between updates (faster demo)
      speedVariation = 0.3, // 30% speed variation
      // Realistic GPS parameters to simulate real courier behavior
      gpsAccuracy = 5, // 5 meters typical GPS accuracy
      gpsNoiseChance = 0.8, // 80% chance of GPS noise per update (realistic)
      gpsNoiseMagnitude = 0.00005, // ~5m GPS noise in degrees (~0.00005 degrees)
    } = options;

    const courier = this.mockCouriers.get(courierId);
    if (!courier) {
      console.warn(`🎭 No courier found for ${courierId}`);
      return;
    }

    let currentIndex = 0;
    let progress = 0;

    const simulationInterval = setInterval(() => {
      console.log(`🎭 Movement tick for ${courier.name}:`, {
        currentIndex,
        progress,
        totalPoints: route.length,
        currentPoint: route[currentIndex],
      });

      if (currentIndex >= route.length - 1) {
        // Reached destination
        console.log(`🎭 Mock Simulation: ${courier.name} reached destination`);
        this.stopMovementSimulation(courierId);
        return;
      }

      // Calculate next position with realistic movement
      const currentPoint = route[currentIndex];
      const nextPoint = route[currentIndex + 1];

      console.log(`🎭 Moving between points:`, {
        current: currentPoint,
        next: nextPoint,
      });

      // Add speed variation - fixed base speed regardless of route length
      const baseSpeed = 0.2; // Fixed 20% progress per tick (faster demo speed)
      const speed = baseSpeed * (1 + (Math.random() - 0.5) * speedVariation);
      progress += speed;

      if (progress >= 1) {
        currentIndex++;
        progress = 0;
      }

      // Interpolate between current and next point
      let newLocation;
      if (currentIndex < route.length - 1) {
        const t = progress;
        newLocation = {
          latitude: currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * t,
          longitude: currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * t,
          timestamp: Date.now(),
        };
      } else {
        newLocation = {
          ...route[route.length - 1],
          timestamp: Date.now(),
        };
      }

      console.log(
        `🎭 Base location calculated:`,
        newLocation,
        `(segment ${currentIndex}, progress ${progress.toFixed(3)})`,
      );

      // Add realistic GPS noise to simulate real courier GPS behavior
      // This makes the demo behave like real GPS data instead of perfect interpolation
      if (Math.random() < gpsNoiseChance) {
        const noiseLatitude = (Math.random() - 0.5) * gpsNoiseMagnitude;
        const noiseLongitude = (Math.random() - 0.5) * gpsNoiseMagnitude;

        newLocation.latitude += noiseLatitude;
        newLocation.longitude += noiseLongitude;

        const noiseDistanceM =
          Math.sqrt(noiseLatitude * noiseLatitude + noiseLongitude * noiseLongitude) * 111000;
        console.log(
          `🎭 Applied realistic GPS noise: ${noiseDistanceM.toFixed(1)}m (simulating real GPS accuracy)`,
        );
      }

      // Calculate exact progress along the route (0 to 1)
      const exactProgress = (currentIndex + progress) / (route.length - 1);

      // Create metadata for consistent forward-only movement
      const metadata = {
        routeIndex: currentIndex,
        routeProgress: exactProgress,
        segmentProgress: progress,
      };

      // Update courier position through mock backend with metadata
      console.log(`🎭 Movement tick for ${courier.name}:`, {
        location: newLocation,
        progress: exactProgress.toFixed(4),
        segment: `${currentIndex}/${route.length - 1}`,
        segmentProgress: progress.toFixed(3),
      });
      this.mockUpdateCourierPosition(courierId, newLocation, metadata);
    }, updateInterval);

    this.simulationIntervals.set(courierId, simulationInterval);
    courier.status = 'moving';

    console.log(
      `🎭 Mock Simulation: Started movement for ${courier.name} along ${route.length} points`,
    );
  }

  /**
   * Stop movement simulation for a courier
   * @param {string} courierId - Courier ID
   */
  stopMovementSimulation(courierId) {
    const interval = this.simulationIntervals.get(courierId);
    if (interval) {
      clearInterval(interval);
      this.simulationIntervals.delete(courierId);

      const courier = this.mockCouriers.get(courierId);
      if (courier) {
        courier.status = 'idle';
        console.log(`🎭 Mock Simulation: Stopped movement for ${courier.name}`);
      }
    }
  }

  /**
   * Stop all active simulations
   */
  stopAllSimulations() {
    this.simulationIntervals.forEach((interval, courierId) => {
      clearInterval(interval);
      const courier = this.mockCouriers.get(courierId);
      if (courier) {
        courier.status = 'idle';
      }
    });
    this.simulationIntervals.clear();
    console.log('🎭 Mock Simulation: Stopped all movement simulations');
  }

  /**
   * Get mock courier data
   * @param {string} courierId - Courier ID
   * @returns {Object|null} Mock courier data
   */
  getMockCourier(courierId) {
    return this.mockCouriers.get(courierId) || null;
  }

  /**
   * Get all mock couriers
   * @returns {Array} Array of mock courier data
   */
  getAllMockCouriers() {
    return Array.from(this.mockCouriers.values());
  }

  /**
   * Simulate API error for testing error handling
   * @param {string} errorType - Type of error to simulate
   */
  simulateError(errorType) {
    switch (errorType) {
      case 'network':
        webSocketService.emit(WEBSOCKET_EVENTS.ERROR, {
          error: 'Network connection lost',
          context: 'mock_network_error',
        });
        break;
      case 'auth':
        webSocketService.emit(WEBSOCKET_EVENTS.ERROR, {
          error: 'Authentication failed',
          context: 'mock_auth_error',
        });
        break;
      case 'server':
        webSocketService.emit(WEBSOCKET_EVENTS.ERROR, {
          error: 'Internal server error',
          context: 'mock_server_error',
        });
        break;
    }
    console.log(`🎭 Mock Backend: Simulated ${errorType} error`);
  }
}

// Create singleton instance
export const mockBackendService = new MockBackendService();

export default mockBackendService;
