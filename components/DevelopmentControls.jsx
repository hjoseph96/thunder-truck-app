import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { simulateCourierMovement } from '../lib/courier-mutations';

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

  // Handler for simulating courier movement
  const handleSimulateCourierMovement = async () => {
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
    setSimulationMessage('🚀 Starting simulation...');

    try {
      let fromPoint, toPoint, stageName;

      // Determine simulation parameters based on current status
      if (currentStatus === 'picking_up') {
        // Stage 1: Courier → Food Truck
        fromPoint = courierLocation;
        toPoint = truckLocation;
        stageName = 'pickup journey (courier → restaurant)';
      } else if (currentStatus === 'delivering') {
        // Stage 2: Food Truck → Customer
        fromPoint = courierLocation; // Use current courier location (should be near truck)
        toPoint = destinationLocation;
        stageName = 'delivery journey (restaurant → customer)';
      } else {
        setSimulationMessage('❌ Simulation only available during picking_up or delivering status');
        setIsSimulating(false);
        return;
      }

      console.log(`🎬 Simulating ${stageName}`);
      console.log(`   From: [${fromPoint.latitude}, ${fromPoint.longitude}]`);
      console.log(`   To: [${toPoint.latitude}, ${toPoint.longitude}]`);

      // Call the simulation mutation
      const result = await simulateCourierMovement(fromPoint, toPoint);

      if (result.success) {
        setSimulationMessage(`✅ ${result.message || 'Simulation started! Watch the map for updates.'}`);
        console.log('✅ Simulation started successfully');
      } else {
        setSimulationMessage(`❌ ${result.message || 'Failed to start simulation'}`);
        console.error('Simulation failed:', result);
      }
    } catch (error) {
      setSimulationMessage(`❌ Error: ${error.message}`);
      console.error('Error during simulation:', error);
    } finally {
      // Clear simulation state after a delay
      setTimeout(() => {
        setIsSimulating(false);
        setSimulationMessage('');
      }, 5000);
    }
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
          {validStatuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, currentStatus === status && styles.statusButtonActive]}
              onPress={() => setCurrentStatus(status)}
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

      {/* Courier Simulation Controls */}
      {(currentStatus === 'picking_up' || currentStatus === 'delivering') && (
        <View style={styles.simulationContainer}>
          <Text style={styles.demoLabel}>Dev: Courier Movement Simulation</Text>
          <View style={styles.simulationContent}>
            <View style={styles.simulationInfo}>
              <Text style={styles.simulationStage}>
                {currentStatus === 'picking_up' ? '📍 Stage 1: Pickup' : '🚚 Stage 2: Delivery'}
              </Text>
              <Text style={styles.simulationRoute}>
                {currentStatus === 'picking_up'
                  ? 'Courier → Restaurant'
                  : 'Restaurant → Customer'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.simulateButton,
                (isSimulating || !courierLocation) && styles.simulateButtonDisabled,
              ]}
              onPress={handleSimulateCourierMovement}
              disabled={isSimulating || !courierLocation}
            >
              {isSimulating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.simulateButtonText}>
                  {courierLocation ? '▶ Simulate Movement' : '⏳ Waiting for courier...'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {simulationMessage && (
            <Text style={styles.simulationMessage}>{simulationMessage}</Text>
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
  // Simulation Controls Styles
  simulationContainer: {
    backgroundColor: '#FFF9E6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  simulationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  simulationInfo: {
    flex: 1,
    marginRight: 12,
  },
  simulationStage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  simulationRoute: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  simulateButton: {
    backgroundColor: '#F57C00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  simulateButtonText: {
    fontSize: 14,
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

