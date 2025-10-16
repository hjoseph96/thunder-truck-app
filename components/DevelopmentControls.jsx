import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { simulateCourierMovement } from '../lib/courier-mutations';
import { googleMapsRoutingService } from '../lib/google-maps-routing-service';
import { calculateDistance, getCoordinateAtProgress } from '../lib/animation-utils';
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

// Animation duration constant to match courier tracking service
const ANIMATION_DURATION_MS = 3000; // 3 seconds

export default function DevelopmentControls({
  currentStatus,
  setCurrentStatus,
  validStatuses,
  courierLocation,
  truckLocation,
  destinationLocation,
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [deliveryStage, setDeliveryStage] = useState(null); // 'pickup' or 'delivery'
  const targetLocationRef = useRef(null);
  
  // Frontend simulation state (similar to MapPage demo)
  const [simulationRoute, setSimulationRoute] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationInterval, setSimulationInterval] = useState(null);
  
  // Use refs to store current state values for interval access
  const simulationStateRef = useRef({
    route: null,
    progress: 0,
    active: false,
    stage: null,
  });

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

    if (result.success) {
    } else {
    }

    // Check if route is complete - but wait for visual animation to finish
    if (newProgress >= 1) {
      // Stop the interval immediately to prevent further updates
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      
      // Show completion message while waiting for animation
      if (currentState.stage === 'pickup') {
        setSimulationMessage('🎯 Reached restaurant! Animation completing...');
      } else if (currentState.stage === 'delivery') {
        setSimulationMessage('🎯 Reached customer! Animation completing...');
      }
      
      // Wait for animation duration before transitioning to next stage
      // This ensures the visual animation completes before starting the next stage
      setTimeout(async () => {
        await handleRouteCompletion();
      }, ANIMATION_DURATION_MS);
    }
  };

  // Handle route completion based on current stage
  const handleRouteCompletion = async () => {
    const currentState = simulationStateRef.current;
    
    console.log('[DEBUG] Route completion - Current stage:', currentState.stage);
    console.log('[DEBUG] Route completion - Current status:', currentStatus);
    
    if (currentState.stage === 'pickup') {
      // Animation has completed, now transition to delivery stage
      console.log('[DEBUG] Transitioning from pickup to delivery stage');
      setSimulationMessage('✅ Arrived at restaurant! Preparing delivery...');
      setCurrentStatus('preparing');

      // Wait a moment for user to see the arrival message, then start delivery
      setTimeout(async () => {
        console.log('[DEBUG] Starting delivery stage after delay');
        await startDeliveryStage();
      }, 2000); // Short delay for user experience
    } else if (currentState.stage === 'delivery') {
      // Arrived at customer
      console.log('[DEBUG] Delivery stage completed');
      setSimulationMessage('✅ Delivered to customer!');
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

    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }

    setIsSimulating(false);
    setSimulationRoute(null);
    setSimulationProgress(0);
    setDeliveryStage(null);

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
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  // Start delivery stage (food truck → customer) using frontend simulation
  const startDeliveryStage = async () => {
    console.log('[DEBUG] startDeliveryStage called');
    setSimulationMessage('🚚 Stage 2: Delivering to customer...');
    setCurrentStatus('delivering');
    targetLocationRef.current = destinationLocation;
    setDeliveryStage('delivery');

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
      setSimulationRoute(route);
      setSimulationProgress(0);

      // Update refs for interval access
      simulationStateRef.current = {
        route: route,
        progress: 0,
        active: true,
        stage: 'delivery',
      };
      
      console.log('[DEBUG] Delivery stage setup complete:', simulationStateRef.current);

      // Start interval to update position every 3 seconds
      const interval = setInterval(async () => {
        try {
          console.log('[DEBUG] Delivery interval tick - stage:', simulationStateRef.current.stage);
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating delivery position:', error);
        }
      }, 3000);

      setSimulationInterval(interval);
      console.log('[DEBUG] Delivery interval started');

    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during delivery simulation:', error);
      setIsSimulating(false);
      setDeliveryStage(null);
    }
  };

  // Handler for complete delivery flow using frontend simulation
  const handleDeliverOrder = async () => {
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
    targetLocationRef.current = truckLocation;
    setDeliveryStage('pickup');

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
      setSimulationRoute(route);
      setSimulationProgress(0);

      // Update refs for interval access
      simulationStateRef.current = {
        route: route,
        progress: 0,
        active: true,
        stage: 'pickup',
      };
      
      console.log('[DEBUG] Pickup stage setup complete:', simulationStateRef.current);

      // Start interval to update position every 3 seconds
      const interval = setInterval(async () => {
        try {
          console.log('[DEBUG] Pickup interval tick - stage:', simulationStateRef.current.stage);
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating pickup position:', error);
        }
      }, 3000);

      setSimulationInterval(interval);
      console.log('[DEBUG] Pickup interval started');

    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during pickup simulation:', error);
      setIsSimulating(false);
      setDeliveryStage(null);
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
});
