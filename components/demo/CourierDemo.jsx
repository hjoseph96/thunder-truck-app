import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { decode } from '@mapbox/polyline';
import { courierTrackingManager } from '../../lib/courier-tracking-simplified';
import { courierAnimationManager } from '../../lib/courier-animation';

// Demo routes using realistic paths
const DEFAULT_POLYLINE =
  '__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA';

const BIKE_ROUTE_POLYLINE =
  'gj_wFfhrbMuDnHlBpBvSga@nLiU_FgFdKiShC{E@KgBsBvAkCGm@{Qef@hHy@iDco@RCU_DIOGE}@}PwMxAGeA';

const DEFAULT_ROUTE_COORDINATES = decode(DEFAULT_POLYLINE).map((coord) => ({
  latitude: coord[0],
  longitude: coord[1],
}));

const BIKE_ROUTE_COORDINATES = decode(BIKE_ROUTE_POLYLINE).map((coord) => ({
  latitude: coord[0],
  longitude: coord[1],
}));

const DEMO_ROUTES = [
  {
    name: 'Main Route',
    coordinates: DEFAULT_ROUTE_COORDINATES,
    color: '#219ebc',
  },
  {
    name: 'Bike Route',
    coordinates: BIKE_ROUTE_COORDINATES,
    color: '#007cff',
  },
];

const demoCouriers = [
  { id: 'courier-1', name: 'Alex (Bike)', emoji: '🚴', routeIndex: 1 },
  { id: 'courier-2', name: 'Sam (Scooter)', emoji: '🛵', routeIndex: 0 },
  { id: 'courier-3', name: 'Jordan (Car)', emoji: '🚗', routeIndex: 1 },
];

export const CourierDemo = ({ mapRef, navigation }) => {
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [courierCount, setCourierCount] = useState(0);
  const [demoMode, setDemoMode] = useState('simple');

  // Set up animation handlers
  React.useEffect(() => {
    courierAnimationManager.setGlobalHandlers(
      // onUpdate: called when courier position updates during animation
      (courierId, location) => {
        if (mapRef.current) {
          mapRef.current.updateCourierLocation(courierId, location);
        }
      },
      // onComplete: called when animation finishes
      (courierId) => {
        console.log(`Courier ${courierId} animation completed`);
      },
    );

    return () => {
      // Cleanup on unmount
      courierAnimationManager.reset();
      courierTrackingManager.reset();
    };
  }, [mapRef]);

  const addDemoCourier = () => {
    try {
      if (courierCount >= demoCouriers.length) {
        Alert.alert('Demo Limit', 'Maximum 3 demo couriers allowed');
        return;
      }

      const courier = demoCouriers[courierCount];
      const route = DEMO_ROUTES[courier.routeIndex];
      const startLocation = route.coordinates[0];

      // Add to tracking manager
      courierTrackingManager.addCourier(courier.id, courier.name, startLocation);
      courierTrackingManager.setCourierRoute(courier.id, route.coordinates);

      // Add to map
      if (mapRef.current) {
        mapRef.current.addCourier(courier.id, courier.name, startLocation, route.coordinates);
        setCourierCount((prev) => prev + 1);
        console.log(`Added demo courier: ${courier.name} on ${route.name}`);
      }
    } catch (error) {
      console.error('Error adding demo courier:', error);
      Alert.alert('Demo Error', 'Failed to add courier');
    }
  };

  const clearDemoCouriers = () => {
    try {
      // Stop all animations
      courierAnimationManager.stopAllAnimations();

      // Remove couriers from tracking manager
      courierTrackingManager.reset();

      // Remove couriers from map
      demoCouriers.forEach((courier) => {
        if (mapRef.current) {
          mapRef.current.removeCourier(courier.id);
        }
      });

      setCourierCount(0);
      setDemoActive(false);
      console.log('Cleared all demo couriers and stopped animations');
    } catch (error) {
      console.error('Error clearing demo couriers:', error);
    }
  };

  const simulateCourierMovement = () => {
    try {
      if (courierCount === 0) {
        Alert.alert('No Couriers', 'Add some couriers first!');
        return;
      }

      setDemoActive(true);

      // Start animations for each courier with staggered delays
      demoCouriers.slice(0, courierCount).forEach((courier, index) => {
        const route = DEMO_ROUTES[courier.routeIndex];
        const animationType = courier.name.includes('Bike')
          ? 'cycling'
          : courier.name.includes('Car')
            ? 'driving'
            : 'default';

        setTimeout(() => {
          courierAnimationManager.startAnimation(courier.id, route.coordinates, animationType);
        }, index * 2000); // Stagger start times
      });
    } catch (error) {
      console.error('Error simulating courier movement:', error);
      Alert.alert('Demo Error', 'Failed to start simulation');
    }
  };

  const DemoFloatingButton = () => (
    <TouchableOpacity
      style={styles.demoFloatingButton}
      onPress={() => setShowDemoPanel(!showDemoPanel)}
      activeOpacity={0.7}
    >
      <Text style={styles.demoFloatingButtonText}>🚴</Text>
    </TouchableOpacity>
  );

  const DemoControlPanel = () => {
    if (!showDemoPanel) return null;

    return (
      <View style={styles.demoControlPanel}>
        <Text style={styles.demoTitle}>Courier Tracking Demo</Text>

        <View style={styles.demoModeToggle}>
          <TouchableOpacity
            style={[styles.demoModeButton, demoMode === 'simple' && styles.demoModeActive]}
            onPress={() => setDemoMode('simple')}
          >
            <Text style={[styles.demoModeText, demoMode === 'simple' && styles.demoModeActiveText]}>
              Simple
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demoModeButton, demoMode === 'enhanced' && styles.demoModeActive]}
            onPress={() => setDemoMode('enhanced')}
          >
            <Text
              style={[styles.demoModeText, demoMode === 'enhanced' && styles.demoModeActiveText]}
            >
              Enhanced
            </Text>
          </TouchableOpacity>
        </View>

        {demoMode === 'simple' ? (
          <>
            <Text style={styles.demoSubtitle}>Predefined Routes</Text>
            <View style={styles.demoButtonRow}>
              <TouchableOpacity
                style={[styles.demoButton, styles.demoAddButton]}
                onPress={addDemoCourier}
                disabled={courierCount >= demoCouriers.length}
              >
                <Text style={styles.demoButtonText}>Add ({courierCount}/3)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoButton, styles.demoStartButton]}
                onPress={simulateCourierMovement}
                disabled={courierCount === 0 || demoActive}
              >
                <Text style={styles.demoButtonText}>{demoActive ? 'Running...' : 'Start'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoButton, styles.demoClearButton]}
                onPress={clearDemoCouriers}
                disabled={courierCount === 0}
              >
                <Text style={styles.demoButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.enhancedDemoInfo}>
            <Text style={styles.demoSubtitle}>Real Google Maps API + Mock Backend</Text>
            <Text style={styles.enhancedDemoText}>
              • Real route fetching from Google Maps{'\n'}• Simulated backend responses{'\n'}•
              Realistic GPS movement{'\n'}• Production data structures
            </Text>
            <TouchableOpacity
              style={[styles.demoButton, styles.demoEnhancedButton]}
              onPress={() => navigation.navigate('EnhancedCourierDemo')}
            >
              <Text style={styles.demoButtonText}>Open Enhanced Demo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.demoButton, styles.demoWebSocketButton, styles.demoWebSocketFullWidth]}
          onPress={() => navigation.navigate('WebSocketTestScreen')}
        >
          <Text style={styles.demoButtonText}>WebSocket Test</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <DemoFloatingButton />
      <DemoControlPanel />
    </>
  );
};

const styles = StyleSheet.create({
  demoFloatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007cff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  demoFloatingButtonText: {
    fontSize: 24,
  },
  demoControlPanel: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoModeToggle: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  demoModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  demoModeActive: {
    backgroundColor: '#007cff',
  },
  demoModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  demoModeActiveText: {
    color: '#fff',
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  demoAddButton: {
    backgroundColor: '#28a745',
  },
  demoStartButton: {
    backgroundColor: '#17a2b8',
  },
  demoClearButton: {
    backgroundColor: '#dc3545',
  },
  demoEnhancedButton: {
    backgroundColor: '#6f42c1',
  },
  demoWebSocketButton: {
    backgroundColor: '#fd7e14',
  },
  demoWebSocketFullWidth: {
    marginHorizontal: 0,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  enhancedDemoInfo: {
    alignItems: 'center',
  },
  enhancedDemoText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 12,
    lineHeight: 14,
  },
});
