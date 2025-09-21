import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapWebview from './MapWebview';
import { useLocationManager } from '../lib/hooks/useLocationManager';
import { webSocketService, WEBSOCKET_EVENTS } from '../lib/websocket-service';
import { updateCourierPosition } from '../lib/courier-mutations';
import { getStoredToken } from '../lib/token-manager';
import { googleMapsRoutingService } from '../lib/google-maps-routing-service';

import { MapHeader } from './ui/MapHeader';
import { SearchBar } from './ui/SearchBar';
import { LocationBar } from './ui/LocationBar';
import { BottomNavigation } from './ui/BottomNavigation';
import { fetchNearbyFoodTrucks } from '../lib/food-trucks-service';
export default function MapPage({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [webViewReady, setWebViewReady] = useState(false);
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [loadingFoodTrucks, setLoadingFoodTrucks] = useState(true);
  const [demoActive, setDemoActive] = useState(false);
  const [demoInterval, setDemoInterval] = useState(null);
  const [demoRoute, setDemoRoute] = useState(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoCourierId, setDemoCourierId] = useState(null);
  const [courierAdded, setCourierAdded] = useState(false);
  const mapRef = useRef(null);

  // Use refs to store current state values for interval access
  const demoStateRef = useRef({
    route: null,
    progress: 0,
    active: false,
    courierId: null,
  });

  // Use location manager hook
  const {
    userLocation,
    locationPermissionGranted,
    markerMovedToUserLocation,
    setMarkerMovedToUserLocation,
    moveToCurrentLocation,
    updateUserLocation,
  } = useLocationManager();

  // Load nearby food trucks when user location is available
  React.useEffect(() => {
    const loadFoodTrucks = async () => {
      if (userLocation) {
        try {
          setLoadingFoodTrucks(true);
          console.log('MapPage: Loading food trucks for location:', userLocation);

          const result = await fetchNearbyFoodTrucks({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: 10,
            page: 1,
          });

          console.log('MapPage: Loaded food trucks:', result?.foodTrucks?.length || 0);
          setFoodTrucks(result?.foodTrucks || []);
        } catch (error) {
          console.error('MapPage: Error loading food trucks:', error);
          setFoodTrucks([]);
        } finally {
          setLoadingFoodTrucks(false);
        }
      }
    };

    loadFoodTrucks();
  }, [userLocation]);

  // Move user marker to actual location once WebView is ready
  React.useEffect(() => {
    if (webViewReady && userLocation && locationPermissionGranted && !markerMovedToUserLocation) {
      console.log('MapPage: WebView ready, moving user marker to actual location:', userLocation);

      // Check if this is the user's actual location (not default)
      const isDefaultLocation =
        userLocation.latitude === 40.7081 && userLocation.longitude === -73.9571;

      if (!isDefaultLocation) {
        console.log("MapPage: Moving marker to user's actual location");
        moveUserMarkerToCoordinates(userLocation.latitude, userLocation.longitude, false);
        setMarkerMovedToUserLocation(true);
      } else {
        console.log('MapPage: User location is default, not moving marker');
      }
    }
  }, [webViewReady, userLocation, locationPermissionGranted, markerMovedToUserLocation]);

  // Send food trucks to map when both webview and food trucks are ready
  React.useEffect(() => {
    if (webViewReady && foodTrucks.length > 0) {
      console.log('MapPage: Sending food trucks to map:', foodTrucks.length);

      const message = {
        type: 'addFoodTrucks',
        foodTrucks: foodTrucks.map((truck) => ({
          id: truck.id,
          name: truck.name,
          latitude: truck.latitude || 40.7081 + (Math.random() - 0.5) * 0.02, // Mock coordinates if not available
          longitude: truck.longitude || -73.9571 + (Math.random() - 0.5) * 0.02,
          coverImageUrl: truck.coverImageUrl,
          deliveryFee: truck.deliveryFee,
          isSubscriber: truck.isSubscriber,
        })),
      };

      if (mapRef.current) {
        mapRef.current.postMessage(JSON.stringify(message));
      }
    }
  }, [webViewReady, foodTrucks]);

  const handleGPSButtonPress = async () => {
    const location = await moveToCurrentLocation();
    if (location) {
      console.log('GPS button pressed - location updated:', location);
    }
  };

  // Function to move user marker to specific coordinates
  const moveUserMarkerToCoordinates = (latitude, longitude, updateState = true) => {
    if (!locationPermissionGranted) {
      console.log('Cannot move marker: location permission not granted');
      return;
    }

    console.log('Moving user marker to coordinates:', { latitude, longitude });

    // Only update state if explicitly requested (prevents infinite loops during initialization)
    if (updateState) {
      const newLocation = {
        latitude,
        longitude,
        accuracy: userLocation?.accuracy || null,
      };
      updateUserLocation(newLocation);
    }

    // Send message to WebView to move the marker
    if (webViewReady) {
      const message = {
        type: 'moveUserMarker',
        coordinates: { latitude, longitude },
      };

      // Use the Map component's ref to send message
      if (mapRef.current) {
        mapRef.current.postMessage(JSON.stringify(message));
      }
    }
  };

  // Function to update marker position when map moves
  const updateMarkerPosition = (newCoordinates) => {
    if (!locationPermissionGranted) {
      return; // Don't update if no permission
    }

    console.log('Updating marker position to:', newCoordinates);
    updateUserLocation({
      ...userLocation,
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude,
    });
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      // Could implement address search here using the hook's moveToAddress function
      console.log('Search submitted:', searchText);
    }
  };

  // Demo functionality
  const toggleDemo = async () => {
    if (demoActive) {
      stopDemo();
    } else {
      await startDemo();
    }
  };

  const startDemo = async () => {
    try {
      console.log('🚴 Starting courier demo...');

      // Check if we have an authentication token
      const token = await getStoredToken();
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.');
      }
      console.log('🔑 Authentication token found');

      // Connect to WebSocket if not connected
      if (!webSocketService.isConnected()) {
        console.log('📡 Connecting to WebSocket...');
        await webSocketService.connect();

        // Wait for connection to be established and subscribed
        console.log('⏳ Waiting for WebSocket connection to stabilize...');
        let attempts = 0;
        const maxAttempts = 10;

        while (!webSocketService.isConnected() && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
          console.log(`⏳ Connection attempt ${attempts}/${maxAttempts}...`);
        }

        if (!webSocketService.isConnected()) {
          throw new Error('Failed to establish WebSocket connection after 10 seconds');
        }

        // Additional wait for subscription to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('✅ WebSocket connected and ready');
      }

      // Get courier ID and location directly from WebSocket response
      console.log('📡 Requesting courier position to get ID and location...');

      let actualCourierId = null;
      let initialLocation = null;

      // Set up a promise to capture the first courier response
      const courierResponsePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'No courier responded to position request. Please ensure a courier is available.',
            ),
          );
        }, 10000);

        const unsubscribe = webSocketService.subscribe('courier_location_update', (data) => {
          if (!actualCourierId) {
            actualCourierId = data.courier_id;
            initialLocation = {
              latitude: data.latitude || data.courierLatitude,
              longitude: data.longitude || data.courierLongitude,
              timestamp: Date.now(),
            };
            console.log('✅ Got courier ID and location:', actualCourierId, initialLocation);
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        });
      });

      // Request courier location
      webSocketService.getCourierLocation().catch(() => {
        // Ignore errors as we handle response through our promise
      });

      // Wait for courier response
      await courierResponsePromise;

      console.log('✅ Using real courier ID from WebSocket:', actualCourierId);

      // Create a realistic demo destination (nearby restaurant or landmark)
      const demoDestination = {
        latitude: initialLocation.latitude + 0.01, // ~1km north
        longitude: initialLocation.longitude + 0.01, // ~1km east
      };

      // Get real route from Google Maps API
      console.log('🗺️ Fetching real route from Google Maps...');
      console.log('📍 From:', initialLocation);
      console.log('📍 To:', demoDestination);

      const routeData = await googleMapsRoutingService.fetchRoute(
        initialLocation,
        demoDestination,
        { profile: 'driving' }, // Use driving mode for food delivery
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;
      console.log(
        `✅ Got real route with ${route.length} waypoints (${(routeData.distance / 1000).toFixed(2)}km)`,
      );

      setDemoRoute(route);
      setDemoProgress(0);
      setDemoActive(true);

      // Update refs for interval access
      demoStateRef.current = {
        route: route,
        progress: 0,
        active: true,
        courierId: actualCourierId,
      };

      console.log('📍 Demo route set in state:', route.length, 'waypoints');
      console.log('📍 Demo active:', true);
      console.log('📍 Demo state ref updated:', demoStateRef.current);

      // Add route to courier and map for visualization
      console.log('📍 Adding demo route to map with destination:', demoDestination);
      console.log('📍 Using real courier ID:', actualCourierId);

      if (mapRef.current) {
        // Update the existing courier with route and destination
        if (mapRef.current.updateCourierRoute) {
          console.log('📍 Updating courier route for:', actualCourierId);
          mapRef.current.updateCourierRoute(actualCourierId, route);
        }
      }

      // Start interval to update position every 3 seconds
      const interval = setInterval(async () => {
        try {
          await updateDemoPosition();
        } catch (error) {
          console.error('❌ Error updating demo position:', error);
        }
      }, 3000);

      setDemoInterval(interval);
      console.log('✅ Demo started successfully');
      console.log('🕐 Demo interval started - will update position every 3 seconds');
    } catch (error) {
      console.error('❌ Failed to start demo:', error);

      // Provide more specific error messages
      if (error.message.includes('WebSocket not connected')) {
        console.error('📡 WebSocket connection failed. Please check:');
        console.error('- Internet connection');
        console.error('- Authentication token validity');
        console.error('- Server availability at:', 'wss://api.thundertruck.app/cable');
      } else if (error.message.includes('Timeout waiting for courier position')) {
        console.error('⏱️ Timeout getting courier position. Backend may not have active couriers.');
      }

      setDemoActive(false);

      // Try to disconnect and clean up
      try {
        webSocketService.disconnect();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  };

  const updateDemoPosition = async () => {
    const currentState = demoStateRef.current;

    console.log('🔍 updateDemoPosition called - checking route state:');
    console.log(
      '🔍 ref route:',
      currentState.route ? `${currentState.route.length} waypoints` : 'null/undefined',
    );
    console.log('🔍 ref active:', currentState.active);
    console.log('🔍 ref courierId:', currentState.courierId);
    console.log('🔍 ref progress:', currentState.progress);

    if (!currentState.route || currentState.route.length === 0 || !currentState.active) {
      console.log('⚠️ No demo route available for position update');
      return;
    }

    const newProgress = Math.min(currentState.progress + 0.05, 1); // Move 5% along route each update (smoother)

    // Update both state and ref
    setDemoProgress(newProgress);
    demoStateRef.current.progress = newProgress;

    // Calculate current position along the real route
    const route = currentState.route;
    const totalSegments = route.length - 1;
    const currentSegmentFloat = newProgress * totalSegments;
    const segmentIndex = Math.floor(currentSegmentFloat);
    const segmentProgress = currentSegmentFloat - segmentIndex;

    // Get current and next waypoints
    const startPoint = route[segmentIndex];
    const endPoint = route[Math.min(segmentIndex + 1, route.length - 1)];

    // Interpolate between waypoints for smooth movement
    const currentPosition = {
      latitude: startPoint.latitude + (endPoint.latitude - startPoint.latitude) * segmentProgress,
      longitude:
        startPoint.longitude + (endPoint.longitude - startPoint.longitude) * segmentProgress,
    };

    console.log(
      `📍 Following real route - Progress: ${(newProgress * 100).toFixed(1)}% (waypoint ${segmentIndex + 1}/${route.length})`,
    );
    console.log(`📍 Position:`, currentPosition);

    // Call real GraphQL mutation
    const result = await updateCourierPosition(currentPosition.latitude, currentPosition.longitude);

    if (result.success) {
      console.log('✅ Position updated successfully');
    } else {
      console.error('❌ Failed to update position:', result.errors);
    }

    // Stop demo when route is complete
    if (newProgress >= 1) {
      console.log('🏁 Demo route completed');
      stopDemo();
    }
  };

  const stopDemo = () => {
    console.log('🛑 Stopping courier demo...');

    if (demoInterval) {
      clearInterval(demoInterval);
      setDemoInterval(null);
    }

    setDemoActive(false);
    setDemoRoute(null);
    setDemoProgress(0);
    setDemoCourierId(null);
    setCourierAdded(false);

    // Clear the ref as well
    demoStateRef.current = {
      route: null,
      progress: 0,
      active: false,
      courierId: null,
    };

    console.log('✅ Demo stopped');
  };

  // Subscribe to WebSocket courier updates
  React.useEffect(() => {
    const unsubscribe = webSocketService.subscribe(
      WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE,
      (data) => {
        console.log('📡 Received courier update:', data);

        // Set demo courier ID from the first response (this will be our chosen courier)
        if (!demoCourierId) {
          console.log('📍 Setting demo courier ID to first responder:', data.courier_id);
          setDemoCourierId(data.courier_id);
        }

        // Only process updates for our chosen demo courier - reject all others
        if (data.courier_id === demoCourierId) {
          console.log('✅ Processing update for chosen courier:', data.courier_id);
        } else {
          console.log(
            '❌ Rejecting update from unwanted courier:',
            data.courier_id,
            '(only accepting:',
            demoCourierId,
            ')',
          );
          return;
        }

        // Add courier to map and tracking system if not already there
        if (mapRef.current && data.latitude && data.longitude) {
          const location = {
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: Date.now(),
          };

          // Add courier to tracking system first if not already added
          if (!courierAdded && mapRef.current.addCourier) {
            console.log('📍 Adding courier to map and tracking system:', data.courier_id);
            mapRef.current.addCourier(data.courier_id, 'Demo Courier', location);
            setCourierAdded(true);
          }
          // Update location if courier already exists
          else if (courierAdded && mapRef.current.updateCourierLocation) {
            mapRef.current.updateCourierLocation(data.courier_id, location);
          }
        }
      },
    );

    return unsubscribe;
  }, [demoCourierId, courierAdded]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (demoInterval) {
        clearInterval(demoInterval);
      }
    };
  }, [demoInterval]);

  // Demo UI components
  const DemoFloatingButton = () => {
    return (
      <TouchableOpacity
        style={[styles.demoFloatingButton, demoActive && styles.demoFloatingButtonActive]}
        onPress={toggleDemo}
        activeOpacity={0.7}
      >
        <Text style={styles.demoFloatingButtonText}>{demoActive ? '🛑' : '🚴'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <MapHeader navigation={navigation} />

      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        onSubmit={handleSearchSubmit}
      />

      <LocationBar onGPSPress={handleGPSButtonPress} />

      <MapWebview
        ref={mapRef}
        webViewReady={webViewReady}
        setWebViewReady={setWebViewReady}
        userLocation={userLocation}
        locationPermissionGranted={locationPermissionGranted}
        onGPSButtonPress={handleGPSButtonPress}
        onCourierUpdate={(event, data) => {
          console.log('🚴 Courier tracking event:', event, data);
        }}
        onMessage={(message) => {
          if (message.type === 'foodTruckPressed') {
            console.log('Navigating to food truck:', message.foodTruck.name);
            navigation.navigate('FoodTruckViewer', {
              foodTruckId: message.foodTruck.id,
              foodTruck: message.foodTruck,
            });
          }
        }}
      />

      <DemoFloatingButton />

      <BottomNavigation activeTab="map" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  dropdownArrow: {
    marginLeft: 5,
  },
  userLocationIndicator: {
    position: 'absolute',
    top: 344,
    left: 276,
  },
  userLocationOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(25, 118, 210, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  viewListButton: {
    position: 'absolute',
    bottom: 105,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fecd15',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  viewListText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Inter',
  },
  targetButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fecd15',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButton: {
    position: 'absolute',
    bottom: 180,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  currentLocationButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  addressButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addressButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2D1E2F',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: {
    alignItems: 'center',
  },
  header: {
    height: 77,
    backgroundColor: '#282828',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'whitesmoke',
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fecd15',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    position: 'absolute',
    right: 10,
    width: 44,
  },
  webViewLoadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webViewLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Inter',
  },
  webViewError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  webViewErrorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#ff0000',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchBar: {
    height: 30,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 4,
    borderWidth: 0.1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  searchText: {
    flex: 1,
    fontSize: 12,
    color: '#000',
    fontFamily: 'Inter',
    marginLeft: 5,
  },
  // Demo styles
  demoFloatingButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007cff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  demoFloatingButtonActive: {
    backgroundColor: '#dc3545',
  },
  demoFloatingButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  demoControlPanel: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 300,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  demoButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  demoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  demoAddButton: {
    backgroundColor: '#007cff',
  },
  demoStartButton: {
    backgroundColor: '#ff6b35',
  },
  demoClearButton: {
    backgroundColor: '#ff4444',
    marginBottom: 10,
  },
  demoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  demoInstructions: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  demoLegend: {
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
  },
  demoLegendTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  demoLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoLegendLine: {
    width: 20,
    height: 3,
    marginRight: 8,
    borderRadius: 1.5,
  },
  demoLegendDashed: {
    backgroundColor: '#ff6b35',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  demoLegendSolid: {
    backgroundColor: '#00ff88',
  },
  demoLegendText: {
    fontSize: 10,
    color: '#555',
  },
  demoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#007cff',
  },
  demoWebSocketButton: {
    backgroundColor: '#9C27B0',
  },
  demoWebSocketFullWidth: {
    width: '100%',
    marginTop: 8,
  },
  // Enhanced demo styles
  demoModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  demoModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  demoModeActive: {
    backgroundColor: '#007cff',
  },
  demoModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  demoModeActiveText: {
    color: 'white',
  },
  demoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#007cff',
  },
  enhancedDemoInfo: {
    backgroundColor: 'rgba(0, 124, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  enhancedDemoText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 16,
    marginBottom: 10,
  },
  demoEnhancedButton: {
    backgroundColor: '#28a745',
  },
  demoLegendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007cff',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  demoFeatures: {
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 124, 255, 0.05)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007cff',
  },
  demoFeaturesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#007cff',
    marginBottom: 4,
  },
  demoFeatureItem: {
    fontSize: 10,
    color: '#333',
    marginBottom: 2,
    lineHeight: 14,
  },
});
