import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { googleMapsRoutingService } from '../lib/google-maps-routing-service';
import { getCoordinateAtProgress } from '../lib/animation-utils';
import { updateCourierPosition } from '../lib/courier-mutations';

/**
 * Development-only controls for testing order statuses and courier simulation
 * This component should only be rendered in development mode (__DEV__ === true)
 *
 * To remove for production: Simply delete this file and its import in OrderDetailScreen.jsx
 */
const _courierLocation = {
  latitude: 40.75163,
  longitude: -73.82624
}

// Match actual map animation timing
// Map animates courier movement over 3 seconds (see lib/animation-utils.js createPolylineAnimationSteps)
// GPS updates should match this to ensure smooth continuous animation
const MAP_ANIMATION_DURATION_MS = 3000; // 3 seconds - actual animation duration on map
const GPS_UPDATE_INTERVAL = 3000; // 3 seconds between position updates

// Polling delay buffer
// Flow: GraphQL mutation → backend processes (1.2s) → wait for next poll (0-3s) → animation starts
// Frontend polls WebSocket every 3 seconds, so worst case is 3s delay to get new location
// We need to account for: polling delay (3s) + animation duration (3s) = 6s total
const BACKEND_PROCESSING_BUFFER_MS = 3000; // 3 seconds buffer for polling interval

export default function DevelopmentControls({
  currentStatus,
  setCurrentStatus,
  validStatuses,
  courierLocation,
  truckLocation,
  destinationLocation,
  mapRef, // Add mapRef to access courier tracking manager
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(null);

  // Refs for cleanup and preventing duplicate simulations
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const debugIntervalRef = useRef(null);

  // Use refs to store current state values for interval access
  const simulationStateRef = useRef({
    route: null,
    progress: 0,
    active: false,
    stage: null, // 'pickup' or 'delivery'
    startTime: null, // Track when stage started
    totalSteps: 20, // Total steps (100% / 5% per step)
  });

  // Collect debug information from map and courier tracking
  const collectDebugInfo = () => {
    if (!mapRef?.current) {
      return null;
    }

    try {
      // Import courierTrackingManager to get courier state
      const { courierTrackingManager } = require('../lib/courier-tracking-service');
      const courier = courierTrackingManager.getCourier('demo-courier');

      if (!courier) {
        return null;
      }

      const animatedPosition = courier.getCurrentAnimatedPosition();

      return {
        // Real courier location (from backend/GraphQL)
        realCourierLocation: courier.currentLocation,
        // Animated marker position (what user sees on map)
        courierMarkerPosition: animatedPosition,
        // Food truck location
        truckLocation: truckLocation,
        // Destination location
        destinationLocation: destinationLocation,
        // Animation state
        animationProgress: courier.animationState.currentProgress,
        isAnimating: courier.animationState.isPolylineAnimating,
        // Route info
        routeLength: courier.route?.length || 0,
        // Status
        courierStatus: courier.status,
      };
    } catch (error) {
      console.error('[DEBUG] Error collecting debug info:', error);
      return null;
    }
  };

  // Update debug info periodically
  useEffect(() => {
    if (isSimulating) {
      debugIntervalRef.current = setInterval(() => {
        const info = collectDebugInfo();
        if (info) {
          setDebugInfo(info);
        }
      }, 1000); // Update every second
    } else {
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
        debugIntervalRef.current = null;
      }
      setDebugInfo(null);
    }

    return () => {
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
        debugIntervalRef.current = null;
      }
    };
  }, [isSimulating, mapRef, truckLocation, destinationLocation]);

  // Calculate estimated delivery time
  const calculateEstimatedDeliveryTime = () => {
    const currentState = simulationStateRef.current;
    if (!currentState.active || !currentState.startTime) {
      return null;
    }

    const elapsedMs = Date.now() - currentState.startTime;
    const progressPercent = currentState.progress * 100;

    if (progressPercent === 0) {
      return null;
    }

    // Calculate time per percent
    const msPerPercent = elapsedMs / progressPercent;
    const remainingPercent = 100 - progressPercent;
    const estimatedRemainingMs = msPerPercent * remainingPercent;

    // Add buffer for backend delay and animation
    const bufferMs = BACKEND_PROCESSING_BUFFER_MS + MAP_ANIMATION_DURATION_MS;
    const totalEstimatedMs = estimatedRemainingMs + bufferMs;

    // Convert to minutes and seconds
    const minutes = Math.floor(totalEstimatedMs / 60000);
    const seconds = Math.floor((totalEstimatedMs % 60000) / 1000);

    return { minutes, seconds, totalMs: totalEstimatedMs };
  };

  // Update estimated delivery time
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        const estimate = calculateEstimatedDeliveryTime();
        setEstimatedDeliveryTime(estimate);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setEstimatedDeliveryTime(null);
    }
  }, [isSimulating, simulationProgress]);

  // Frontend simulation position update function (based on MapPage demo)
  const updateSimulationPosition = async () => {
    const currentState = simulationStateRef.current;

    if (!currentState.route || currentState.route.length === 0 || !currentState.active) {
      return;
    }

    const newProgress = Math.min(currentState.progress + 0.05, 1); // Move 5% along route each update

    // Update both state and ref
    setSimulationProgress(newProgress);
    simulationStateRef.current.progress = newProgress;

    // Calculate current position along the route
    const route = currentState.route;
    const currentPosition = getCoordinateAtProgress(route, newProgress);

    // Call real GraphQL mutation to update courier position
    const result = await updateCourierPosition(currentPosition.latitude, currentPosition.longitude);

    if (!result.success) {
      console.warn('Failed to update courier position:', result.errors);
    }

    // Check if route is complete - but wait for visual animation to finish
    if (newProgress >= 1) {
      // Stop the interval immediately to prevent further updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const completionTime = Date.now();
      console.log(`[TIMING] 🎯 Progress reached 100% at ${new Date(completionTime).toISOString()}`);
      console.log(`[TIMING] ⏱️  Starting ${MAP_ANIMATION_DURATION_MS + BACKEND_PROCESSING_BUFFER_MS}ms timeout for animation completion`);

      // Show completion message while waiting for animation
      if (currentState.stage === 'pickup') {
        setSimulationMessage('🎯 Reached restaurant! Animation completing...');
      } else if (currentState.stage === 'delivery') {
        setSimulationMessage('🎯 Reached customer! Animation completing...');
      }

      // Wait for animation duration PLUS backend processing buffer
      // Flow: updateCourierPosition() → backend (100-500ms) → WebSocket → map starts animation (3s)
      // We need to wait for: backend delay + animation duration
      // Using 3s animation + 500ms buffer = 3.5s total
      timeoutRef.current = setTimeout(async () => {
        const statusUpdateTime = Date.now();
        const elapsedMs = statusUpdateTime - completionTime;
        console.log(`[TIMING] ✅ Timeout fired at ${new Date(statusUpdateTime).toISOString()}`);
        console.log(`[TIMING] ⏱️  Actual elapsed time: ${elapsedMs}ms (expected: ${MAP_ANIMATION_DURATION_MS + BACKEND_PROCESSING_BUFFER_MS}ms)`);
        await handleRouteCompletion();
      }, MAP_ANIMATION_DURATION_MS + BACKEND_PROCESSING_BUFFER_MS);
    }
  };

  // Handle route completion based on current stage
  // NOTE: This is called AFTER animation completes (3s delay already happened)
  const handleRouteCompletion = async () => {
    const currentState = simulationStateRef.current;

    console.log('[DEBUG] Route completion - Current stage:', currentState.stage);
    console.log('[DEBUG] Route completion - Current status:', currentStatus);

    if (currentState.stage === 'pickup') {
      // Animation has completed, now transition to delivery stage
      console.log('[DEBUG] Transitioning from pickup to delivery stage');
      setSimulationMessage('✅ Arrived at restaurant! Starting delivery...');
      // Keep status as 'picking_up' during the delay - no 'preparing' status

      // Wait 6 seconds before starting delivery (merged stage experience)
      timeoutRef.current = setTimeout(async () => {
        console.log('[DEBUG] Starting delivery stage after 6s delay');
        await startDeliveryStage();
      }, 6000); // 6 second delay between pickup and delivery
    } else if (currentState.stage === 'delivery') {
      // Delivery animation has completed (already waited 3.5s in updateSimulationPosition)
      const statusChangeTime = Date.now();
      console.log(`[TIMING] 📦 Delivery stage completed at ${new Date(statusChangeTime).toISOString()}`);
      console.log('[DEBUG] Delivery stage completed - animation should be finished');
      setSimulationMessage('✅ Delivered to customer!');

      // Update status - animation should be complete by now
      console.log(`[TIMING] 🏁 Changing status to 'completed' at ${new Date().toISOString()}`);
      setCurrentStatus('completed');

      stopSimulation();

      // Clear message after delay
      setTimeout(() => {
        setSimulationMessage('');
      }, 5000);
    } else {
      console.log('[DEBUG] Unknown stage:', currentState.stage);
    }
  };

  // Stop simulation and cleanup
  const stopSimulation = () => {
    console.log('[DEBUG] stopSimulation called');

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsSimulating(false);
    setSimulationProgress(0);

    // Clear the ref as well
    simulationStateRef.current = {
      route: null,
      progress: 0,
      active: false,
      stage: null,
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all timers on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start delivery stage (food truck → customer) using frontend simulation
  const startDeliveryStage = async () => {
    console.log('[DEBUG] startDeliveryStage called');
    setSimulationMessage('🚚 Stage 2: Delivering to customer...');
    setCurrentStatus('delivering');

    try {
      // Get real route from Google Maps API
      const routeData = await googleMapsRoutingService.fetchRoute(
        truckLocation,
        destinationLocation,
        { profile: 'driving' },
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;

      // Set up delivery simulation
      setSimulationProgress(0);

      // Update refs for interval access
      simulationStateRef.current = {
        route: route,
        progress: 0,
        active: true,
        stage: 'delivery',
        startTime: Date.now(), // Track start time for ETA calculation
        totalSteps: 20,
      };

      console.log('[DEBUG] Delivery stage setup complete:', simulationStateRef.current);

      // Start interval to update position - match production timing
      const interval = setInterval(async () => {
        try {
          console.log('[DEBUG] Delivery interval tick - stage:', simulationStateRef.current.stage);
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating delivery position:', error);
          // Clear interval on error to prevent infinite retries
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsSimulating(false);
          setSimulationMessage(`❌ Error: ${error.message}`);
        }
      }, GPS_UPDATE_INTERVAL);

      intervalRef.current = interval;
      console.log('[DEBUG] Delivery interval started');

    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during delivery simulation:', error);
      stopSimulation();
    }
  };

  // Handler for complete delivery flow using frontend simulation
  const handleDeliverOrder = async () => {
    // Prevent duplicate simulations
    if (intervalRef.current) {
      console.warn('[DEBUG] Simulation already running, ignoring duplicate request');
      return;
    }

    // Validate we have necessary data
    if (!truckLocation || !destinationLocation) {
      setSimulationMessage('❌ Missing truck or destination location');
      console.error('Cannot simulate: missing location data');
      return;
    }

    // Set initial courier position
    updateCourierPosition(_courierLocation.latitude, _courierLocation.longitude);

    setIsSimulating(true);

    // Stage 1: Start movement to food truck (picking_up)
    setSimulationMessage('📍 Stage 1: Moving to restaurant...');
    setCurrentStatus('picking_up');

    try {
      // Get real route from Google Maps API
      const routeData = await googleMapsRoutingService.fetchRoute(
        _courierLocation,
        truckLocation,
        { profile: 'driving' },
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;

      // Set up pickup simulation
      setSimulationProgress(0);

      // Update refs for interval access
      simulationStateRef.current = {
        route: route,
        progress: 0,
        active: true,
        stage: 'pickup',
        startTime: Date.now(), // Track start time for ETA calculation
        totalSteps: 20,
      };

      console.log('[DEBUG] Pickup stage setup complete:', simulationStateRef.current);

      // Start interval to update position - match production timing
      const interval = setInterval(async () => {
        try {
          console.log('[DEBUG] Pickup interval tick - stage:', simulationStateRef.current.stage);
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating pickup position:', error);
          // Clear interval on error to prevent infinite retries
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsSimulating(false);
          setSimulationMessage(`❌ Error: ${error.message}`);
        }
      }, GPS_UPDATE_INTERVAL);

      intervalRef.current = interval;
      console.log('[DEBUG] Pickup interval started');

    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during pickup simulation:', error);
      stopSimulation();
    }
  };

  // Handle picking_up button click with automatic simulation
  const handlePickingUpClick = async () => {
    setCurrentStatus('picking_up');
    // Automatically start the simulation
    await handleDeliverOrder();
  };

  return (
    <View style={styles.container}>
      {/* Demo Status Buttons */}
      <View style={styles.statusButtonsContainer}>
        <Text style={styles.demoLabel}>Demo: Test Order Statuses</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusButtonsScroll}
        >
          {validStatuses.filter(status => status !== 'delivering').map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, currentStatus === status && styles.statusButtonActive]}
              onPress={status === 'picking_up' ? handlePickingUpClick : () => setCurrentStatus(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  currentStatus === status && styles.statusButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Simulation Status Display */}
      {simulationMessage && (
        <View style={styles.simulationContainer}>
          <Text style={styles.simulationMessage}>{simulationMessage}</Text>
          {isSimulating && (
            <View style={styles.simulationProgress}>
              <ActivityIndicator size="small" color="#007cff" style={styles.buttonSpinner} />
              <Text style={styles.simulationProgressText}>
                Progress: {(simulationProgress * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Estimated Delivery Time */}
      {estimatedDeliveryTime && isSimulating && (
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>⏱️ Estimated Time:</Text>
          <Text style={styles.etaTime}>
            {estimatedDeliveryTime.minutes}m {estimatedDeliveryTime.seconds}s
          </Text>
        </View>
      )}

      {/* Debug Information */}
      {debugInfo && isSimulating && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 Location Debug</Text>

          {/* Current Location (Backend GPS) */}
          <View style={styles.debugLocationCard}>
            <Text style={styles.debugLocationLabel}>📍 Current Location (Backend GPS)</Text>
            <Text style={styles.debugLocationCoords}>
              {debugInfo.realCourierLocation?.latitude?.toFixed(6) || 'N/A'}, {debugInfo.realCourierLocation?.longitude?.toFixed(6) || 'N/A'}
            </Text>
          </View>

          {/* Animated Marker Position */}
          <View style={styles.debugLocationCard}>
            <Text style={styles.debugLocationLabel}>🚴 Animated Marker (What You See)</Text>
            <Text style={styles.debugLocationCoords}>
              {debugInfo.courierMarkerPosition?.latitude?.toFixed(6) || 'N/A'}, {debugInfo.courierMarkerPosition?.longitude?.toFixed(6) || 'N/A'}
            </Text>
            <View style={styles.debugMetaRow}>
              <Text style={styles.debugMetaText}>
                Progress: {(debugInfo.animationProgress * 100).toFixed(1)}%
              </Text>
              <Text style={styles.debugMetaText}>
                {debugInfo.isAnimating ? '🟢 Animating' : '🔴 Idle'}
              </Text>
            </View>
          </View>

          {/* Destination */}
          <View style={styles.debugLocationCard}>
            <Text style={styles.debugLocationLabel}>🎯 Destination (Target)</Text>
            <Text style={styles.debugLocationCoords}>
              {destinationLocation?.latitude?.toFixed(6) || 'N/A'}, {destinationLocation?.longitude?.toFixed(6) || 'N/A'}
            </Text>
          </View>

          {/* Additional Info */}
          <View style={styles.debugInfoRow}>
            <View style={styles.debugInfoItem}>
              <Text style={styles.debugInfoLabel}>Route Points</Text>
              <Text style={styles.debugInfoValue}>{debugInfo.routeLength}</Text>
            </View>
            <View style={styles.debugInfoItem}>
              <Text style={styles.debugInfoLabel}>Status</Text>
              <Text style={styles.debugInfoValue}>{debugInfo.courierStatus}</Text>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
  },
  // Status Buttons Styles
  statusButtonsContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusButtonsScroll: {
    flexDirection: 'row',
  },
  statusButton: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusButtonActive: {
    backgroundColor: '#2D1E2F',
    borderColor: '#2D1E2F',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins',
  },
  statusButtonTextActive: {
    color: '#FFF',
  },
  // Delivery Button Styles
  simulationContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  deliverButton: {
    backgroundColor: '#F57C00',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  deliverButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  deliverButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  simulationMessage: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 8,
    textAlign: 'center',
  },
  simulationProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  simulationProgressText: {
    fontSize: 11,
    color: '#007cff',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  // ETA Styles
  etaContainer: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
    fontFamily: 'Poppins',
    marginRight: 8,
  },
  etaTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D47A1',
    fontFamily: 'Poppins',
  },
  // Debug Styles
  debugContainer: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    fontFamily: 'Poppins',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugLocationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  debugLocationCoords: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  debugMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  debugMetaText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins',
  },
  debugInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  debugInfoItem: {
    alignItems: 'center',
  },
  debugInfoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  debugInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    fontFamily: 'Poppins',
  },
  // Legacy debug styles (kept for compatibility)
  debugSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  debugSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier New',
    marginLeft: 8,
    lineHeight: 14,
  },
});
