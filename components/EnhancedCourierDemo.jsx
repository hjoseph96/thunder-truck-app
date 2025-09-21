// Enhanced Courier Demo with Real Google Maps API Integration
// Uses real routing API calls with simulated backend responses

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Button,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import Map from './Map';
import { mockBackendService } from '../lib/mock-backend-service';
import { courierTrackingManager } from '../lib/courier-tracking-service';
import { decode } from '@mapbox/polyline';

const EnhancedCourierDemo = () => {
  const mapRef = useRef(null);
  const [courierCount, setCourierCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [mockBackendEnabled, setMockBackendEnabled] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routingStats, setRoutingStats] = useState({ fetched: 0, cached: 0 });
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  // Immediately clear any existing couriers when Enhanced Demo is loaded
  React.useLayoutEffect(() => {
    console.log('🚀 Enhanced Demo: useLayoutEffect - immediate cleanup');

    // Force cleanup of all existing couriers synchronously
    const existingCouriers = courierTrackingManager.getAllCouriers();
    if (existingCouriers.length > 0) {
      console.log(`🧹 IMMEDIATE: Removing ${existingCouriers.length} existing couriers`);
      existingCouriers.forEach((courier) => {
        courierTrackingManager.removeCourier(courier.id);
        console.log(`🧹 IMMEDIATE: Removed ${courier.id}`);
      });
    }
  }, []);

  // Fallback routes for when Google Maps API is not available
  const FALLBACK_POLYLINES = {
    williamsburg_to_times_square:
      'uwcwFx~pbMuHhBsGfBgHfCsGzB{HdDcGnCaGrC_GpC{FrC}FtC{FvCaGxCeGzCuGdDaH`DoHrDqH~DuHfEgIrE{IrFyJfG{JjGqKtHwKxHoLbJ_MfKgMhLiMjL}MvL}NxM}OzNgQhP',
    brooklyn_heights_to_hells_kitchen:
      'gj_wFfhrbMuDnHlBpBvSga@nLiU_FgFdKiShC{E@KgBsBvAkCGm@{Qef@hHy@iDco@RCU_DIOGE}@}PwMxAGeA',
    lic_to_uws:
      '_r_wFbqrbMmFnJnBpBtRga@mKiUaFgFcKiSgC{EAKfBsBtAkCFm@yQef@fHy@hDco@QCT_DHOGE|@}PvMxAFeA',
    fort_greene_to_cpw:
      'kk_wFzhrbMiFnJmBpBsRga@lKiU`FgF`KiS`C{E?KeBsBsAkCEm@xQef@eHy@gDco@PCT_DHOGE|@}PvMxAFeA',
  };

  const fallbackRoutes = {
    'courier-001': [
      { latitude: 40.7081, longitude: -73.9571 },
      { latitude: 40.711487, longitude: -73.958967 },
      { latitude: 40.714873, longitude: -73.960833 },
      { latitude: 40.71826, longitude: -73.9627 },
      { latitude: 40.723876, longitude: -73.96308 },
      { latitude: 40.727631, longitude: -73.964701 },
      { latitude: 40.731273, longitude: -73.966398 },
      { latitude: 40.73479, longitude: -73.968178 },
      { latitude: 40.738177, longitude: -73.970044 },
      { latitude: 40.741433, longitude: -73.971998 },
      { latitude: 40.744565, longitude: -73.974035 },
      { latitude: 40.747583, longitude: -73.976147 },
      { latitude: 40.74874, longitude: -73.9795 },
      { latitude: 40.752127, longitude: -73.981367 },
      { latitude: 40.755513, longitude: -73.983233 },
      { latitude: 40.7589, longitude: -73.9851 },
    ],
    'courier-002': decode(FALLBACK_POLYLINES.brooklyn_heights_to_hells_kitchen).map((coord) => ({
      latitude: coord[0],
      longitude: coord[1],
    })),
    'courier-003': decode(FALLBACK_POLYLINES.lic_to_uws).map((coord) => ({
      latitude: coord[0],
      longitude: coord[1],
    })),
    'courier-004': decode(FALLBACK_POLYLINES.fort_greene_to_cpw).map((coord) => ({
      latitude: coord[0],
      longitude: coord[1],
    })),
  };

  // Realistic locations in Brooklyn/Manhattan area
  const realisticLocations = [
    {
      id: 'courier-001',
      name: 'Alex',
      start: { latitude: 40.7081, longitude: -73.9571, address: 'Williamsburg, Brooklyn' },
      destination: { latitude: 40.7589, longitude: -73.9851, address: 'Times Square, Manhattan' },
    },
    {
      id: 'courier-002',
      name: 'Maria',
      start: { latitude: 40.6782, longitude: -73.9442, address: 'Brooklyn Heights' },
      destination: { latitude: 40.7505, longitude: -73.9934, address: "Hell's Kitchen, Manhattan" },
    },
    {
      id: 'courier-003',
      name: 'John',
      start: { latitude: 40.7282, longitude: -73.7949, address: 'Long Island City, Queens' },
      destination: {
        latitude: 40.7831,
        longitude: -73.9712,
        address: 'Upper West Side, Manhattan',
      },
    },
    {
      id: 'courier-004',
      name: 'Sarah',
      start: { latitude: 40.6892, longitude: -73.9442, address: 'Fort Greene, Brooklyn' },
      destination: { latitude: 40.7614, longitude: -73.9776, address: 'Central Park West' },
    },
  ];

  // Toggle mock backend
  const toggleMockBackend = (enabled) => {
    setMockBackendEnabled(enabled);
    if (enabled) {
      mockBackendService.enable();
    } else {
      mockBackendService.disable();
      stopAllSimulations();
    }
  };

  // Add courier with real Google Maps routing
  const addRealisticCourier = async (courierData) => {
    if (!mapRef.current) return;

    try {
      console.log(`🚀 Adding courier ${courierData.name} with real Google Maps routing...`);

      // Create mock courier in backend service
      if (mockBackendEnabled) {
        mockBackendService.createMockCourier(
          courierData.id,
          courierData.name,
          courierData.start,
          courierData.destination,
        );
      }

      // Add courier to tracking system with fallback route
      const fallbackRoute = fallbackRoutes[courierData.id];
      console.log(`🚀 Adding ${courierData.name} with route:`, {
        courierId: courierData.id,
        routePoints: fallbackRoute?.length || 0,
        startPoint: fallbackRoute?.[0]
          ? {
              lat: fallbackRoute[0].latitude.toFixed(6),
              lng: fallbackRoute[0].longitude.toFixed(6),
            }
          : 'none',
        endPoint:
          fallbackRoute?.length > 1
            ? {
                lat: fallbackRoute[fallbackRoute.length - 1].latitude.toFixed(6),
                lng: fallbackRoute[fallbackRoute.length - 1].longitude.toFixed(6),
              }
            : 'none',
      });

      const courier = mapRef.current.addCourier(
        courierData.id,
        courierData.name,
        courierData.start,
        null, // Let Map component fetch real Google Maps route
        courierData.destination,
      );

      if (courier) {
        setCourierCount((prev) => prev + 1);
        setRoutingStats((prev) => ({ ...prev, fetched: prev.fetched + 1 }));

        console.log(
          `✅ Added ${courierData.name}: ${courierData.start.address} → ${courierData.destination.address}`,
        );

        // Wait for Google Maps route to be fetched, then start simulation
        console.log(`🗺️ Waiting for Google Maps route for ${courierData.name}...`);
        waitForRouteAndStartSimulation(courierData.id, courierData.name);
      }
    } catch (error) {
      console.error(`❌ Failed to add courier ${courierData.name}:`, error);
      Alert.alert('Error', `Failed to add courier: ${error.message}`);
    }
  };

  // Wait for Google Maps route to be ready, then start simulation
  const waitForRouteAndStartSimulation = (courierId, courierName) => {
    const maxWaitTime = 10000; // 10 seconds max wait
    const checkInterval = 500; // Check every 500ms
    let waitTime = 0;

    const checkRoute = () => {
      const courier = courierTrackingManager.getCourier(courierId);

      console.log(`🔍 Checking route for ${courierName} (wait: ${waitTime}ms):`, {
        courierExists: !!courier,
        hasRoute: !!(courier && courier.route),
        routeLength: courier?.route?.length || 0,
        courierKeys: courier ? Object.keys(courier) : [],
      });

      if (courier && courier.route && courier.route.length > 0) {
        console.log(
          `🗺️ Google Maps route ready for ${courierName}: ${courier.route.length} points`,
        );
        startRealisticMovement(courierId);
        return;
      }

      waitTime += checkInterval;
      if (waitTime >= maxWaitTime) {
        console.warn(`⚠️ Google Maps route timeout for ${courierName}, using fallback`);
        // Use fallback route if Google Maps fails
        const fallbackRoute = fallbackRoutes[courierId];
        if (fallbackRoute && courier) {
          courier.route = fallbackRoute;
          console.log(`🔄 Using fallback route for ${courierName}: ${fallbackRoute.length} points`);
          startRealisticMovement(courierId);
        }
        return;
      }

      // Continue checking
      setTimeout(checkRoute, checkInterval);
    };

    // Start checking
    setTimeout(checkRoute, checkInterval);
  };

  // Start realistic movement simulation
  const startRealisticMovement = (courierId) => {
    console.log(`🚀 startRealisticMovement called for ${courierId}`);
    console.log(`🎭 Mock backend enabled: ${mockBackendEnabled}`);

    if (!mockBackendEnabled) {
      console.warn(`⚠️ Mock backend not enabled, cannot start simulation for ${courierId}`);
      return;
    }

    const courier = courierTrackingManager.getCourier(courierId);
    console.log(
      `🚴 Found courier:`,
      courier ? `${courier.name} (route: ${courier.route?.length} points)` : 'null',
    );

    if (!courier || !courier.route) {
      console.warn(`⚠️ Cannot start simulation for ${courierId}: No route available`);
      return;
    }

    console.log(
      `🚀 Starting movement simulation for ${courier.name} with ${courier.route.length} route points`,
    );

    // Start movement simulation with moderate demo parameters
    mockBackendService.startMovementSimulation(courierId, courier.route, {
      updateInterval: 1000, // Update every 1 second (moderate speed)
      speedVariation: 0.3, // 30% speed variation for realism
      deviationChance: 0.05, // 5% chance of GPS deviation
      maxDeviation: 0.0002, // Small GPS inaccuracy
    });

    setIsSimulating(true);
    console.log(`✅ Movement simulation started for ${courier.name}`);
  };

  // Stop all simulations
  const stopAllSimulations = () => {
    mockBackendService.stopAllSimulations();
    setIsSimulating(false);
  };

  // Remove all couriers (including any leftover from other demos)
  const clearAllCouriers = () => {
    stopAllSimulations();

    // Clear ALL couriers from the tracking manager (not just our own)
    const allCouriers = courierTrackingManager.getAllCouriers();
    console.log(`🧹 clearAllCouriers: Starting to remove ${allCouriers.length} couriers`);

    allCouriers.forEach((courier) => {
      console.log(`🧹 Attempting to remove courier: ${courier.id} (${courier.name})`);
      if (mapRef.current) {
        mapRef.current.removeCourier(courier.id);
        console.log(`✅ Successfully removed courier: ${courier.id}`);
      } else {
        console.warn(`⚠️ mapRef.current is null, cannot remove courier: ${courier.id}`);
      }
    });

    setCourierCount(0);
    setRoutingStats({ fetched: 0, cached: 0 });

    // Double-check what's left
    const remainingCouriers = courierTrackingManager.getAllCouriers();
    console.log(`🧹 clearAllCouriers complete. Remaining couriers: ${remainingCouriers.length}`);

    if (remainingCouriers.length > 0) {
      console.warn(
        `⚠️ Still have ${remainingCouriers.length} couriers after cleanup:`,
        remainingCouriers.map((c) => `${c.id} (${c.name})`),
      );
    }
  };

  // Get performance metrics
  const updatePerformanceMetrics = () => {
    if (mapRef.current) {
      const metrics = mapRef.current.getPerformanceMetrics();
      setPerformanceMetrics(metrics);

      // Update routing stats
      if (metrics.routing) {
        setRoutingStats((prev) => ({
          ...prev,
          cached: Math.round(metrics.routing.cacheSize * metrics.routing.cacheHitRate),
        }));
      }
    }
  };

  // Simulate different scenarios
  const simulateScenario = (scenario) => {
    switch (scenario) {
      case 'deviation':
        // Simulate route deviation for first courier
        if (courierCount > 0) {
          const firstCourier = realisticLocations[0];
          const deviatedLocation = {
            latitude: 40.7081 + 0.01, // Deviate significantly
            longitude: -73.9571 + 0.01,
            timestamp: Date.now(),
          };

          if (mockBackendEnabled) {
            mockBackendService.mockUpdateCourierPosition(firstCourier.id, deviatedLocation);
          }

          Alert.alert('Scenario', 'Simulated route deviation for Alex');
        }
        break;

      case 'network_error':
        mockBackendService.simulateError('network');
        Alert.alert('Scenario', 'Simulated network error');
        break;

      case 'high_load':
        // Add multiple couriers quickly
        realisticLocations.forEach((location, index) => {
          setTimeout(() => addRealisticCourier(location), index * 1000);
        });
        Alert.alert('Scenario', 'Simulating high load with multiple couriers');
        break;
    }
  };

  // Initialize Enhanced Demo - clear any existing couriers from other demos
  useEffect(() => {
    console.log('🚀 Enhanced Demo: Initializing and clearing existing couriers...');

    // Clear any leftover couriers from simple demo or previous sessions
    const allCouriers = courierTrackingManager.getAllCouriers();
    console.log(
      `🔍 Found ${allCouriers.length} existing couriers:`,
      allCouriers.map((c) => `${c.id} (${c.name})`),
    );

    if (allCouriers.length > 0) {
      console.log(`🧹 Clearing ${allCouriers.length} existing couriers...`);
      clearAllCouriers();

      // Verify cleanup worked
      setTimeout(() => {
        const remainingCouriers = courierTrackingManager.getAllCouriers();
        console.log(`✅ After cleanup: ${remainingCouriers.length} couriers remaining`);
      }, 100);
    }
  }, []); // Run once on mount

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(updatePerformanceMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Component */}
      <Map
        ref={mapRef}
        webViewReady={true}
        setWebViewReady={() => {}}
        userLocation={null}
        locationPermissionGranted={false}
        onGPSButtonPress={() => {}}
        onCourierUpdate={(event, data) => {
          console.log('🚴 Courier Event:', event, data);

          if (event === 'courierRouteOptimized') {
            console.log(`📍 Route optimized for ${data.courier.name}:`, data.routeMetadata);
          }
        }}
      />

      {/* Compact Floating Control Panel */}
      <View style={styles.floatingPanel}>
        {/* Header with collapse toggle */}
        <View style={styles.panelHeader}>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setPanelCollapsed(!panelCollapsed)}
          >
            <Text style={styles.collapseIcon}>{panelCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          <Text style={styles.compactTitle}>Enhanced Demo</Text>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: mockBackendEnabled ? '#28a745' : '#dc3545' },
              ]}
            />
            <Text style={styles.courierCount}>{courierCount}</Text>
          </View>
        </View>

        {/* Collapsible content */}
        {!panelCollapsed && (
          <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
            {/* Mock Backend Toggle */}
            <View style={styles.compactToggleRow}>
              <Text style={styles.compactToggleLabel}>Mock Backend</Text>
              <Switch
                value={mockBackendEnabled}
                onValueChange={toggleMockBackend}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={mockBackendEnabled ? '#007cff' : '#f4f3f4'}
                style={styles.compactSwitch}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickButton, styles.addButton]}
                onPress={() =>
                  addRealisticCourier(realisticLocations[courierCount % realisticLocations.length])
                }
                disabled={courierCount >= realisticLocations.length}
              >
                <Text style={styles.quickButtonText}>Add Courier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickButton, styles.clearButton]}
                onPress={clearAllCouriers}
                disabled={courierCount === 0}
              >
                <Text style={styles.quickButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Compact Status */}
            <View style={styles.compactStatus}>
              <Text style={styles.compactStatusText}>
                Routes: {routingStats.fetched} | Cached: {routingStats.cached} | Moving:{' '}
                {isSimulating ? 'Yes' : 'No'}
              </Text>
            </View>

            {/* Test Scenarios - Compact */}
            <View style={styles.scenarioButtons}>
              <TouchableOpacity
                style={[styles.scenarioButton, styles.deviationButton]}
                onPress={() => simulateScenario('deviation')}
                disabled={!mockBackendEnabled || courierCount === 0}
              >
                <Text style={styles.scenarioButtonText}>Deviation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scenarioButton, styles.errorButton]}
                onPress={() => simulateScenario('network_error')}
                disabled={!mockBackendEnabled}
              >
                <Text style={styles.scenarioButtonText}>Error</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scenarioButton, styles.loadButton]}
                onPress={() => simulateScenario('high_load')}
                disabled={!mockBackendEnabled}
              >
                <Text style={styles.scenarioButtonText}>Load Test</Text>
              </TouchableOpacity>
            </View>

            {/* Metrics Toggle */}
            <TouchableOpacity
              style={styles.metricsToggle}
              onPress={() => {
                setShowMetrics(!showMetrics);
                if (!showMetrics) updatePerformanceMetrics();
              }}
            >
              <Text style={styles.metricsToggleText}>{showMetrics ? 'Hide' : 'Show'} Metrics</Text>
            </TouchableOpacity>

            {/* Performance Metrics - Compact */}
            {showMetrics && performanceMetrics && (
              <View style={styles.compactMetrics}>
                <Text style={styles.compactMetricText}>
                  Cache: {(performanceMetrics.routing?.cacheHitRate * 100 || 0).toFixed(0)}% |
                  Animations: {performanceMetrics.couriers?.activeAnimations || 0}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Compact floating panel
  floatingPanel: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 200,
    maxHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  collapseButton: {
    padding: 4,
    marginRight: 8,
  },
  collapseIcon: {
    fontSize: 12,
    color: '#007cff',
    fontWeight: 'bold',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  courierCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007cff',
  },
  panelContent: {
    maxHeight: 320,
    padding: 12,
  },
  compactToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 124, 255, 0.1)',
    borderRadius: 6,
  },
  compactToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  quickButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  compactStatus: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  compactStatusText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
  },
  scenarioButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  scenarioButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  deviationButton: {
    backgroundColor: '#ffc107',
  },
  errorButton: {
    backgroundColor: '#fd7e14',
  },
  loadButton: {
    backgroundColor: '#6f42c1',
  },
  scenarioButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
  },
  metricsToggle: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  metricsToggleText: {
    fontSize: 11,
    color: '#007cff',
    fontWeight: '600',
  },
  compactMetrics: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  compactMetricText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

export default EnhancedCourierDemo;
