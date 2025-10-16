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

    console.log('🔍 updateSimulationPosition called - checking route state:');
    console.log(
      '🔍 ref route:',
      currentState.route ? `${currentState.route.length} waypoints` : 'null/undefined',
    );
    console.log('🔍 ref active:', currentState.active);
    console.log('🔍 ref progress:', currentState.progress);
    console.log('🔍 ref stage:', currentState.stage);

    if (!currentState.route || currentState.route.length === 0 || !currentState.active) {
      console.log('⚠️ No simulation route available for position update');
      return;
    }

    const newProgress = Math.min(currentState.progress + 0.05, 1); // Move 5% along route each update

    // Update both state and ref
    setSimulationProgress(newProgress);
    simulationStateRef.current.progress = newProgress;

    // Calculate current position along the route
    const route = currentState.route;
    const currentPosition = getCoordinateAtProgress(route, newProgress);

    console.log(
      `📍 Following route - Progress: ${(newProgress * 100).toFixed(1)}% (waypoint ${currentPosition.segmentIndex + 1}/${route.length})`,
    );
    console.log(`📍 Position:`, currentPosition);

    // Call real GraphQL mutation to update courier position
    const result = await updateCourierPosition(currentPosition.latitude, currentPosition.longitude);

    if (result.success) {
      console.log('✅ Position updated successfully');
    } else {
      console.error('❌ Failed to update position:', result.errors);
    }

    // Check if route is complete
    if (newProgress >= 1) {
      console.log('🏁 Simulation route completed');
      await handleRouteCompletion();
    }
  };

  // Handle route completion based on current stage
  const handleRouteCompletion = async () => {
    const currentState = simulationStateRef.current;
    
    if (currentState.stage === 'pickup') {
      // Arrived at food truck, wait 3 seconds then start delivery
      console.log('✅ Arrived at restaurant! Waiting 3 seconds...');
      setSimulationMessage('✅ Arrived at restaurant! Preparing delivery...');
      setCurrentStatus('preparing');

      setTimeout(async () => {
        await startDeliveryStage();
      }, 3000);
    } else if (currentState.stage === 'delivery') {
      // Arrived at customer
      console.log('✅ Delivered to customer!');
      setSimulationMessage('✅ Delivered to customer!');
      setCurrentStatus('completed');
      stopSimulation();

      // Clear message after delay
      setTimeout(() => {
        setSimulationMessage('');
      }, 5000);
    }
  };

  // Stop simulation and cleanup
  const stopSimulation = () => {
    console.log('🛑 Stopping courier simulation...');

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

    console.log('✅ Simulation stopped');
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
    console.log('🎬 Stage 2: Starting delivery journey (restaurant → customer)');
    console.log(`   From: [${truckLocation.latitude}, ${truckLocation.longitude}]`);
    console.log(`   To: [${destinationLocation.latitude}, ${destinationLocation.longitude}]`);

    setSimulationMessage('🚚 Stage 2: Delivering to customer...');
    setCurrentStatus('delivering');
    targetLocationRef.current = destinationLocation;
    setDeliveryStage('delivery');

    try {
      // Get real route from Google Maps API
      console.log('🗺️ Fetching real route from Google Maps for delivery...');
      const routeData = await googleMapsRoutingService.fetchRoute(
        truckLocation,
        destinationLocation,
        { profile: 'driving' },
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;
      console.log(
        `✅ Got delivery route with ${route.length} waypoints (${(routeData.distance / 1000).toFixed(2)}km)`,
      );

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

      // Start interval to update position every 3 seconds
      const interval = setInterval(async () => {
        try {
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating delivery position:', error);
        }
      }, 3000);

      setSimulationInterval(interval);
      console.log('✅ Delivery simulation started successfully');

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
    console.log('✅ Courier location set to:', _courierLocation);

    setIsSimulating(true);

    // Stage 1: Start movement to food truck (picking_up)
    setSimulationMessage('📍 Stage 1: Moving to restaurant...');
    setCurrentStatus('picking_up');
    targetLocationRef.current = truckLocation;
    setDeliveryStage('pickup');

    try {
      // Get real route from Google Maps API
      console.log('🗺️ Fetching real route from Google Maps for pickup...');
      console.log("Simulating courier movement from:", _courierLocation, "to:", truckLocation);
      
      const routeData = await googleMapsRoutingService.fetchRoute(
        _courierLocation,
        truckLocation,
        { profile: 'driving' },
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;
      console.log(
        `✅ Got pickup route with ${route.length} waypoints (${(routeData.distance / 1000).toFixed(2)}km)`,
      );

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

      // Start interval to update position every 3 seconds
      const interval = setInterval(async () => {
        try {
          await updateSimulationPosition();
        } catch (error) {
          console.error('❌ Error updating pickup position:', error);
        }
      }, 3000);

      setSimulationInterval(interval);
      console.log('✅ Pickup simulation started successfully');

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
