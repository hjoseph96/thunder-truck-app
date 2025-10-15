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
import {fetchRoute} from '../lib/google-maps-routing-service';
import { calculateDistance } from '../lib/animation-utils';

/**
 * Development-only controls for testing order statuses and courier simulation
 * This component should only be rendered in development mode (__DEV__ === true)
 *
 * To remove for production: Simply delete this file and its import in OrderDetailScreen.jsx
 */
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

  // Monitor courier location and trigger next stage when arrived
  useEffect(() => {
    if (!courierLocation || !deliveryStage || !targetLocationRef.current) {
      return;
    }

    const distance = calculateDistance(courierLocation, targetLocationRef.current);
    const ARRIVAL_THRESHOLD = 50; // 50 meters threshold

    console.log(`📍 Distance to target: ${distance.toFixed(2)}m (stage: ${deliveryStage})`);

    if (distance <= ARRIVAL_THRESHOLD) {
      if (deliveryStage === 'pickup') {
        // Arrived at food truck, wait 3 seconds then start delivery
        console.log('✅ Arrived at restaurant! Waiting 3 seconds...');
        setSimulationMessage('✅ Arrived at restaurant! Preparing delivery...');

        setTimeout(async () => {
          await startDeliveryStage();
        }, 3000);

        setDeliveryStage(null); // Clear to avoid re-triggering
      } else if (deliveryStage === 'delivery') {
        // Arrived at customer
        console.log('✅ Delivered to customer!');
        setSimulationMessage('✅ Delivered to customer!');
        setDeliveryStage(null);
        setIsSimulating(false);

        // Clear message after delay
        setTimeout(() => {
          setSimulationMessage('');
        }, 5000);
      }
    }
  }, [courierLocation, deliveryStage]);

  // Start delivery stage (food truck → customer)
  const startDeliveryStage = async () => {
    console.log('🎬 Stage 2: Starting delivery journey (restaurant → customer)');
    console.log(`   From: [${truckLocation.latitude}, ${truckLocation.longitude}]`);
    console.log(`   To: [${destinationLocation.latitude}, ${destinationLocation.longitude}]`);

    setSimulationMessage('🚚 Stage 2: Delivering to customer...');
    setCurrentStatus('delivering');
    targetLocationRef.current = destinationLocation;
    setDeliveryStage('delivery');

    try {
      const result = await simulateCourierMovement(truckLocation, destinationLocation);

      if (!result.success) {
        setSimulationMessage(`❌ ${result.message || 'Failed to start delivery'}`);
        console.error('Delivery simulation failed:', result);
        setIsSimulating(false);
        setDeliveryStage(null);
      }
    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during delivery simulation:', error);
      setIsSimulating(false);
      setDeliveryStage(null);
    }
  };

  // Handler for complete delivery flow
  const handleDeliverOrder = async () => {
    // Validate we have necessary data
    if (!courierLocation) {
      setSimulationMessage('⏳ Waiting for courier location from WebSocket...');
      console.warn('Cannot simulate: courier location not yet available');
      return;
    }

    if (!truckLocation || !destinationLocation) {
      setSimulationMessage('❌ Missing truck or destination location');
      console.error('Cannot simulate: missing location data');
      return;
    }

    setIsSimulating(true);

    // Stage 1: Start movement to food truck (picking_up)
    // const route = await fetchRoute(courierLocation, truckLocation);
    // if(route.coordinates.length === 1) {
    //   setCurrentStatus('delivering');
    //   startDeliveryStage();
    //   return;
    // } 

    setSimulationMessage('📍 Stage 1: Moving to restaurant...');
    setCurrentStatus('picking_up');
    targetLocationRef.current = truckLocation;
    setDeliveryStage('pickup');


    try {
      const result = await simulateCourierMovement(courierLocation, truckLocation);

      if (!result.success) {
        setSimulationMessage(`❌ ${result.message || 'Failed to start pickup'}`);
        console.error('Pickup simulation failed:', result);
        setIsSimulating(false);
        setDeliveryStage(null);
      } else {
        console.log('✅ Pickup simulation started, monitoring location...');
      }
    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during simulation:', error);
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
});
