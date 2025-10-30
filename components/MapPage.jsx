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
export default function MapPage({ route, navigation }) {
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
  const [userData, setUserData] = useState(null);
  const [currentMapPosition, setCurrentMapPosition] = useState(null);

  const mapRef = useRef(null);
  const fetchDebounceTimeout = useRef(null);

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

  // Debounced function to fetch food trucks based on map region
  const fetchFoodTrucksForRegion = React.useCallback((region) => {
    // Update current position for debug display
    setCurrentMapPosition(region);
    
    // Clear any existing timeout
    if (fetchDebounceTimeout.current) {
      clearTimeout(fetchDebounceTimeout.current);
    }

    // Set a new timeout to fetch food trucks after 500ms of inactivity
    fetchDebounceTimeout.current = setTimeout(async () => {
      try {
        setLoadingFoodTrucks(true);

        const result = await fetchNearbyFoodTrucks({
          latitude: region.latitude,
          longitude: region.longitude,
          radius: 5,
          unit: 'miles',
          page: 1,
        });
        
        // Update food trucks state and send to map
        const trucks = result?.foodTrucks || [];
        setFoodTrucks(trucks);
        
        // Send updated food trucks to the map
        if (mapRef.current && trucks.length > 0) {
          mapRef.current.postMessage({
            type: 'addFoodTrucks',
            foodTrucks: trucks,
          });
        }
      } catch (error) {
        console.error('Error fetching food trucks for region:', error);
      } finally {
        setLoadingFoodTrucks(false);
      }
    }, 500); // 500ms debounce delay
  }, []);

  // Cleanup debounce timeout on unmount
  React.useEffect(() => {
    return () => {
      if (fetchDebounceTimeout.current) {
        clearTimeout(fetchDebounceTimeout.current);
      }
    };
  }, []);

  // Load nearby food trucks when user location is available
  React.useEffect(() => {
    const loadFoodTrucks = async () => {
      if (userLocation) {
        try {
          setLoadingFoodTrucks(true);

          const result = await fetchNearbyFoodTrucks({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: 5,
            unit: 'miles',
            page: 1,
          });
          
          // Update food trucks state
          const trucks = result?.foodTrucks || [];
          setFoodTrucks(trucks);
          
          // Send food trucks to the map if ready
          if (mapRef.current && trucks.length > 0) {
            mapRef.current.postMessage({
              type: 'addFoodTrucks',
              foodTrucks: trucks,
            });
          }
        } catch (error) {
          console.error('Error loading food trucks:', error);
          setFoodTrucks([]);
        } finally {
          setLoadingFoodTrucks(false);
        }
      }
    };

    loadFoodTrucks();

    if (route.params.userData) {
      setUserData(route.params.userData);
    }
  }, [userLocation]);

  // Move user marker to actual location once WebView is ready
  React.useEffect(() => {
    if (webViewReady && userLocation && locationPermissionGranted && !markerMovedToUserLocation) {
      // Check if this is the user's actual location (not default)
      const isDefaultLocation =
        userLocation.latitude === 40.7081 && userLocation.longitude === -73.9571;

      if (!isDefaultLocation) {
        moveUserMarkerToCoordinates(userLocation.latitude, userLocation.longitude, false);
        setMarkerMovedToUserLocation(true);
      }
    }
  }, [webViewReady, userLocation, locationPermissionGranted, markerMovedToUserLocation]);

  // Send food trucks to map when both webview and food trucks are ready
  React.useEffect(() => {
    if (webViewReady && foodTrucks.length > 0) {

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
  };

  // Function to move user marker to specific coordinates
  const moveUserMarkerToCoordinates = (latitude, longitude, updateState = true) => {
    if (!locationPermissionGranted) {
      return;
    }

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

    updateUserLocation({
      ...userLocation,
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude,
    });
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      // Could implement address search here using the hook's moveToAddress function
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
      // Check if we have an authentication token
      const token = await getStoredToken();
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.');
      }

      // Connect to WebSocket if not connected
      if (!webSocketService.isConnected()) {
        await webSocketService.connect();

        // Wait for connection to be established and subscribed
        let attempts = 0;
        const maxAttempts = 10;

        while (!webSocketService.isConnected() && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!webSocketService.isConnected()) {
          throw new Error('Failed to establish WebSocket connection after 10 seconds');
        }

        // Additional wait for subscription to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Get courier ID and location directly from WebSocket response
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

      // Create a realistic demo destination (nearby restaurant or landmark)
      const demoDestination = {
        latitude: initialLocation.latitude + 0.01, // ~1km north
        longitude: initialLocation.longitude + 0.01, // ~1km east
      };

      // Get real route from Google Maps API
      const routeData = await googleMapsRoutingService.fetchRoute(
        initialLocation,
        demoDestination,
        { profile: 'driving' }, // Use driving mode for food delivery
      );

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;

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

      // Add route to courier and map for visualization
      if (mapRef.current) {
        // Update the existing courier with route and destination
        if (mapRef.current.updateCourierRoute) {
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

    if (!currentState.route || currentState.route.length === 0 || !currentState.active) {
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

    // Call real GraphQL mutation
    const result = await updateCourierPosition(currentPosition.latitude, currentPosition.longitude);

    if (!result.success) {
      console.error('❌ Failed to update position:', result.errors);
    }

    // Stop demo when route is complete
    if (newProgress >= 1) {
      stopDemo();
    }
  };

  const stopDemo = () => {
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
  };

  // Subscribe to WebSocket courier updates
  React.useEffect(() => {
    const unsubscribe = webSocketService.subscribe(
      WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE,
      (data) => {
        // Set demo courier ID from the first response (this will be our chosen courier)
        if (!demoCourierId) {
          setDemoCourierId(data.courier_id);
        }

        // Only process updates for our chosen demo courier - reject all others
        if (data.courier_id !== demoCourierId) {
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

      <LocationBar navigation={navigation} userData={userData} onGPSPress={handleGPSButtonPress} />

      <MapWebview
        ref={mapRef}
        webViewReady={webViewReady}
        setWebViewReady={setWebViewReady}
        userLocation={userLocation}
        locationPermissionGranted={locationPermissionGranted}
        onGPSButtonPress={handleGPSButtonPress}
        onRegionChange={fetchFoodTrucksForRegion}
        onCourierUpdate={(event, data) => {
          // Courier tracking event handler
        }}
        onMessage={(message) => {
          if (message.type === 'foodTruckPressed') {
            navigation.navigate('FoodTruckViewer', {
              foodTruckId: message.foodTruck.id,
              foodTruck: message.foodTruck,
            });
          }
        }}
      />

      <DemoFloatingButton />

      {/* Debug position display */}
      {currentMapPosition && (
        <View style={styles.debugPosition}>
          <Text style={styles.debugPositionTitle}>Map Center (Debug)</Text>
          <Text style={styles.debugPositionText}>
            Lat: {currentMapPosition.latitude.toFixed(6)}
          </Text>
          <Text style={styles.debugPositionText}>
            Lng: {currentMapPosition.longitude.toFixed(6)}
          </Text>
          <Text style={styles.debugPositionText}>
            Radius: 5 miles
          </Text>
          <Text style={styles.debugPositionText}>
            Trucks: {foodTrucks.length}
          </Text>
        </View>
      )}

      <BottomNavigation activeTab="map" userData={userData} />
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
  debugPosition: {
    position: 'absolute',
    top: 120,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  debugPositionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fecd15',
    marginBottom: 6,
    fontFamily: 'Cairo_700Bold',
  },
  debugPositionText: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 2,
    fontFamily: 'Cairo_400Regular',
  },
});
