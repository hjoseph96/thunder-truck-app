import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import { decode } from '@mapbox/polyline';
import Svg, { Path } from 'react-native-svg';
import { courierTrackingManager } from '../lib/courier-tracking-service';
import { getRemainingRouteCoordinates } from '../lib/animation-utils';

// Default map center (Williamsburg, Brooklyn)
const DEFAULT_CENTER = {
  longitude: -73.9571,
  latitude: 40.7081,
  zoom: 14,
};

// Food Truck SVG Component
const FoodTruckIcon = ({ size = 30 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 -93 512 512">
        <Path
          d="m470.378906 155.839844-45.941406-80.699219c-1.941406-2.554687-4.96875-4.050781-8.179688-4.050781h-416.257812v198.210937c0 8.050781 6.527344 14.578125 14.578125 14.578125h484.339844c7.222656 0 13.082031-5.855468 13.082031-13.082031v-77.21875c0-2.3125-1.039062-4.5-2.824219-5.964844zm0 0"
          fill="#efefef"
        />
        <Path
          d="m509.175781 187.613281-38.800781-31.773437-45.9375-80.699219c-1.945312-2.550781-4.96875-4.050781-8.179688-4.050781h-59.667968l54.464844 96.664062 38.796874 31.773438c1.789063 1.464844 2.824219 3.652344 2.824219 5.964844v77.21875c0 .394531-.023437.78125-.058593 1.167968h46.300781c7.222656 0 13.082031-5.855468 13.082031-13.082031v-77.21875c0-2.308594-1.035156-4.5-2.824219-5.964844zm0 0"
          fill="#e2e2e2"
        />
        <Path
          d="m461.921875 259.222656c-15.503906-15.503906-40.640625-15.503906-56.144531 0s-15.503906 40.640625 0 56.144532c15.503906 15.5 40.640625 15.5 56.144531 0 15.503906-15.503907 15.503906-40.640626 0-56.144532zm0 0"
          fill="#31363b"
        />
        <Path
          d="m433.855469 304.445312c-4.582031 0-8.890625-1.785156-12.128907-5.023437-6.6875-6.6875-6.6875-17.570313 0-24.257813 3.238282-3.238281 7.546876-5.023437 12.128907-5.023437s8.886719 1.785156 12.128906 5.023437c3.238281 3.242188 5.023437 7.550782 5.023437 12.128907 0 4.582031-1.785156 8.890625-5.023437 12.128906-3.242187 3.238281-7.546875 5.023437-12.128906 5.023437zm0 0"
          fill="#e2e2e2"
        />
        <Path
          d="m512 208.3125h-28.363281c-5.15625 0-8.972657 4.796875-7.808594 9.820312l3.734375 16.125c.839844 3.632813 4.078125 6.207032 7.808594 6.207032h24.628906zm0 0"
          fill="#efa335"
        />
        <Path
          d="m380.8125 71.089844c2.964844 0 5.09375-2.855469 4.25-5.699219l-17.523438-59.0625c-1.105468-3.75-4.550781-6.328125-8.464843-6.328125h-344.496094c-8.050781 0-14.578125 6.527344-14.578125 14.578125v254.722656c0 8.050781 6.527344 14.578125 14.578125 14.578125h297.703125v-205.496094c0-4.03125 3.265625-7.292968 7.292969-7.292968zm0 0"
          fill="#fc4e51"
        />
        <Path
          d="m253.128906 73.945312v209.933594h59.152344v-205.496094c0-4.03125 3.265625-7.292968 7.292969-7.292968h-63.585938c-1.578125 0-2.859375 1.277344-2.859375 2.855468zm0 0"
          fill="#ea3942"
        />
        <Path
          d="m385.0625 65.390625-17.523438-59.0625c-1.105468-3.75-4.550781-6.328125-8.464843-6.328125h-59.148438c3.910157 0 7.355469 2.574219 8.460938 6.328125l19.214843 64.761719h53.210938c2.964844 0 5.09375-2.855469 4.25-5.699219zm0 0"
          fill="#ea3942"
        />
        <Path
          d="m338.105469 103.050781v59.792969c0 1.179688.957031 2.136719 2.136719 2.136719h86.570312c6.578125 0 10.710938-7.101563 7.453125-12.820313l-28.554687-50.167968c-.382813-.667969-1.089844-1.082032-1.859376-1.082032h-63.609374c-1.179688 0-2.136719.957032-2.136719 2.140625zm0 0"
          fill="#33d8dd"
        />
        <Path
          d="m106.214844 259.21875c-15.503906-15.503906-40.640625-15.503906-56.144532 0-15.503906 15.503906-15.503906 40.640625 0 56.144531 15.503907 15.503907 40.640626 15.503907 56.144532 0 15.503906-15.503906 15.503906-40.640625 0-56.144531zm0 0"
          fill="#31363b"
        />
        <Path
          d="m78.144531 304.445312c-4.582031 0-8.886719-1.785156-12.128906-5.023437-6.6875-6.6875-6.6875-17.570313 0-24.257813 3.242187-3.238281 7.546875-5.023437 12.128906-5.023437s8.886719 1.785156 12.128907 5.023437c3.242187 3.242188 5.023437 7.550782 5.023437 12.128907 0 4.582031-1.785156 8.890625-5.023437 12.128906-3.238282 3.238281-7.546876 5.023437-12.128907 5.023437zm0 0"
          fill="#e2e2e2"
        />
        <Path d="m31.953125 73.753906h248.164063v127.90625h-248.164063zm0 0" fill="#f3e8d7" />
        <Path d="m220.792969 73.753906h59.324219v127.90625h-59.324219zm0 0" fill="#e5d8c6" />
        <Path
          d="m48.066406 121.863281c-14.625 0-26.484375-11.855469-26.484375-26.484375v-13.898437h52.972657v13.898437c0 14.628906-11.859376 26.484375-26.488282 26.484375zm0 0"
          fill="#efa335"
        />
        <Path
          d="m101.039062 121.863281c-14.628906 0-26.484374-11.855469-26.484374-26.484375v-13.898437h52.972656v13.898437c-.003906 14.628906-11.859375 26.484375-26.488282 26.484375zm0 0"
          fill="#ffc064"
        />
        <Path
          d="m154.011719 121.863281c-14.628907 0-26.488281-11.855469-26.488281-26.484375v-13.898437h52.972656v13.898437c0 14.628906-11.855469 26.484375-26.484375 26.484375zm0 0"
          fill="#efa335"
        />
        <Path
          d="m206.984375 121.863281c-14.628906 0-26.488281-11.855469-26.488281-26.484375v-13.898437h52.972656v13.898437c0 14.628906-11.859375 26.484375-26.484375 26.484375zm0 0"
          fill="#ffc064"
        />
        <Path
          d="m259.953125 121.863281c-14.628906 0-26.484375-11.855469-26.484375-26.484375v-13.898437h52.972656v13.898437c0 14.628906-11.859375 26.484375-26.488281 26.484375zm0 0"
          fill="#efa335"
        />
        <Path
          d="m271.796875 44.746094c-1.015625-2.554688-3.492187-4.234375-6.242187-4.234375h-223.089844c-2.75 0-5.222656 1.679687-6.242188 4.234375l-14.640625 36.734375h264.859375zm0 0"
          fill="#fd8f31"
        />
        <Path
          d="m25.722656 194.675781h260.40625c2.335938 0 4.226563 1.890625 4.226563 4.222657v18.898437c0 2.335937-1.890625 4.226563-4.226563 4.226563h-260.40625c-2.332031 0-4.226562-1.890626-4.226562-4.226563v-18.898437c0-2.332032 1.894531-4.222657 4.226562-4.222657zm0 0"
          fill="#dfede7"
        />
        <Path
          d="m286.132812 194.675781h-55.097656v27.347657h55.097656c2.332032 0 4.222657-1.890626 4.222657-4.222657v-18.902343c0-2.332032-1.890625-4.222657-4.222657-4.222657zm0 0"
          fill="#ceddd6"
        />
      </Svg>
    </View>
  );
};

// Reusable SVG Marker Component with fallback
const SvgMarker = ({ type, size = 30, fallbackColor = '#007cff' }) => {
  const [hasError] = useState(false);

  // Fallback to a colored circle if SVG fails to load
  if (hasError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: fallbackColor,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: size * 0.4, fontWeight: 'bold' }}>🚚</Text>
      </View>
    );
  }

  // Render specific SVG based on type
  switch (type) {
    case 'foodTruck':
      return <FoodTruckIcon size={size} />;
    default:
      return (
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: fallbackColor,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: size * 0.4, fontWeight: 'bold' }}>📍</Text>
        </View>
      );
  }
};

// Helper function to create different types of markers
const createMarker = (type, coordinate, title, description, size = 30) => {
  const markerConfigs = {
    foodTruck: {
      fallbackColor: '#ff6b35',
      size: size,
    },
    courier: {
      fallbackColor: '#007cff',
      size: size,
    },
    // Add more marker types here as needed
    // restaurant: { fallbackColor: '#ff6b35', size: size },
    // gasStation: { fallbackColor: '#4CAF50', size: size },
  };

  const config = markerConfigs[type] || markerConfigs.foodTruck;

  return {
    coordinate,
    title,
    description,
    children: <SvgMarker type={type} size={config.size} fallbackColor={config.fallbackColor} />,
  };
};

// Enhanced dynamic polyline component with courier type support and status-based styling
const DynamicPolyline = React.memo(({ polylineData }) => {
  if (!polylineData.coordinates || polylineData.coordinates.length < 2) {
    return null;
  }

  // Get polyline styling based on courier type, status, and animation state
  const getPolylineStyle = () => {
    const baseStyle = {
      strokeWidth: polylineData.isAnimating ? 5 : 4, // Thicker line during animation
      lineCap: 'round',
      lineJoin: 'round',
    };

    // Color based on courier type
    const typeColors = {
      bicycle: '#00ff88', // Green for bicycles
      motorcycle: '#ff6b35', // Orange for motorcycles
      car: '#007cff', // Blue for cars
      walking: '#9d4edd', // Purple for walking
    };

    // Animation-based modifications
    if (polylineData.isAnimating) {
      return {
        ...baseStyle,
        strokeColor: typeColors[polylineData.courierType] || '#00ff88',
        strokePattern: undefined, // Solid line during animation
        // Add subtle glow effect during animation (platform dependent)
        strokeOpacity: 0.9,
      };
    }

    // Status-based modifications for non-animating polylines
    const statusModifications = {
      deviating: {
        strokeColor: '#ff4757', // Red for deviating couriers
        strokePattern: [10, 5], // Dashed line for deviation
      },
      moving: {
        strokeColor: typeColors[polylineData.courierType] || '#00ff88',
        strokePattern: undefined, // Solid line for normal movement
      },
      idle: {
        strokeColor: typeColors[polylineData.courierType] || '#00ff88',
        strokeWidth: 3, // Slightly thinner for idle
        strokePattern: [5, 5], // Dotted line for idle
      },
    };

    const statusStyle = statusModifications[polylineData.status] || statusModifications.moving;

    return {
      ...baseStyle,
      ...statusStyle,
    };
  };

  const style = getPolylineStyle();

  return (
    <Polyline
      key={`dynamic-${polylineData.courierId}`} // Remove timestamp from key to prevent redraw
      coordinates={polylineData.coordinates}
      {...style}
    />
  );
});

// Enhanced courier marker component that moves along polyline
const CourierMarker = React.memo(({ courier, position }) => {
  if (!position) return null;

  return (
    <Marker
      ref={(ref) => {
        if (ref) {
          courier._markerRef = ref;
        }
      }}
      key={courier.id}
      coordinate={{
        latitude: position.latitude,
        longitude: position.longitude,
      }}
      title={courier.name}
      description={`Status: ${courier.status}${courier.animationState?.isPolylineAnimating ? ' (Moving along route)' : ''}`}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          backgroundColor: courier.animationState?.isPolylineAnimating ? '#00ff88' : '#007cff',
          borderRadius: 15,
          borderWidth: 3,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
          // Add subtle scale effect during animation
          transform: [{ scale: courier.animationState?.isPolylineAnimating ? 1.1 : 1.0 }],
        }}
      >
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>🚴</Text>
      </View>
    </Marker>
  );
});

// Map styles for React Native
const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  gpsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fecd15',
    borderRadius: 25,
    width: 50,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButtonText: {
    fontSize: 20,
    color: '#000',
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    backgroundColor: '#007cff',
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userLocationMarkerInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginTop: -4,
    marginLeft: -4,
  },
});

const MapWebview = forwardRef(
  (
    {
      key,
      webViewReady,
      setWebViewReady,
      userLocation,
      locationPermissionGranted,
      onGPSButtonPress,
      onMessage,
      onLoadStart,
      onLoadEnd,
      onLoadProgress,
      onError,
      onHttpError,
      renderError,
      // New props for courier tracking
      couriers = [],
      onCourierUpdate,
      truckLocation,
      destinationLocation,
      courierLocation,
      fitToElements,
    },
    ref,
  ) => {
    const mapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [courierStates, setCourierStates] = useState(new Map());
    const [dynamicPolylines, setDynamicPolylines] = useState(new Map());
    const [foodTrucks, setFoodTrucks] = useState([]);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [hasInitiallyFitted, setHasInitiallyFitted] = useState(false);

    // Polyline cache for performance optimization
    const polylineCacheRef = useRef(new Map());
    const lastCleanupRef = useRef(Date.now());
    const lastPolylineUpdateRef = useRef(0);

    // Enhanced utility function to update dynamic polylines with performance optimization
    const updateDynamicPolylines = useCallback(() => {
      const currentTime = Date.now();

      // Throttle polyline updates for smooth 60fps animation
      if (currentTime - lastPolylineUpdateRef.current < 16) {
        // ~60fps for smooth polyline reduction
        return;
      }
      lastPolylineUpdateRef.current = currentTime;

      const newDynamicPolylines = new Map();

      courierTrackingManager.couriers.forEach((courier, courierId) => {
        if (courier.route && courier.route.length > 1) {
          const currentProgress = courier.animationState.currentProgress;

          // Always update during polyline animation for smooth reduction effect
          const shouldUpdate =
            courier.animationState.isPolylineAnimating ||
            (() => {
              const existingPolyline = dynamicPolylines.get(courierId);
              const progressDiff = existingPolyline
                ? Math.abs(currentProgress - existingPolyline.progress)
                : 1;
              return progressDiff > 0.001; // Smaller threshold for smoother updates
            })();

          if (shouldUpdate) {
            // FIX: Use courier's current animated position to prevent iOS polyline jump
            // During animation, start polyline from where courier marker visually appears
            let remainingCoordinates;

            if (courier.animationState.isPolylineAnimating) {
              // During animation: get remaining route from animated position
              const courierAnimatedPosition = courier.getCurrentAnimatedPosition();
              const animatedProgress = courier.animationState.currentProgress;

              // Get the remaining route coordinates from the animated progress
              const remainingRouteCoords = getRemainingRouteCoordinates(
                courier.route,
                animatedProgress,
              );

              if (remainingRouteCoords.length > 1) {
                // Replace first coordinate with exact animated position to prevent jump
                remainingCoordinates = [courierAnimatedPosition, ...remainingRouteCoords.slice(1)];
              } else {
                // Fallback: straight line to destination if no route remaining
                remainingCoordinates = courier.destination
                  ? [courierAnimatedPosition, courier.destination]
                  : [courierAnimatedPosition];
              }
            } else {
              // Normal case: use remaining route coordinates from current progress
              remainingCoordinates = getRemainingRouteCoordinates(courier.route, currentProgress);
            }

            // Only create polyline if there are at least 2 coordinates for a valid line
            if (remainingCoordinates.length > 1) {
              // Enhanced polyline data with animation state
              newDynamicPolylines.set(courierId, {
                coordinates: remainingCoordinates,
                courierId: courierId,
                courierName: courier.name,
                courierType: courier.courierType,
                progress: currentProgress,
                lastUpdated: currentTime,
                status: courier.status,
                isAnimating: courier.animationState.isPolylineAnimating,
                // Performance optimization: cache coordinate count for quick validation
                coordinateCount: remainingCoordinates.length,
                // Add route metadata for enhanced display
                routeMetadata: courier.routeMetadata,
              });
            }
          } else {
            // Keep existing polyline if no significant change
            const existingPolyline = dynamicPolylines.get(courierId);
            if (existingPolyline) {
              newDynamicPolylines.set(courierId, {
                ...existingPolyline,
                status: courier.status, // Update status even if coordinates don't change
                isAnimating: courier.animationState.isPolylineAnimating,
              });
            }
          }
        }
      });

      // Only update state if there are actual changes (performance optimization)
      if (
        newDynamicPolylines.size !== dynamicPolylines.size ||
        Array.from(newDynamicPolylines.keys()).some(
          (id) =>
            !dynamicPolylines.has(id) ||
            newDynamicPolylines.get(id).lastUpdated !== dynamicPolylines.get(id)?.lastUpdated ||
            newDynamicPolylines.get(id).isAnimating !== dynamicPolylines.get(id)?.isAnimating,
        )
      ) {
        setDynamicPolylines(newDynamicPolylines);
      }
    }, [dynamicPolylines]);

    // Effect to handle courier tracking updates
    useEffect(() => {
      const unsubscribe = courierTrackingManager.subscribe((event, data) => {
        switch (event) {
          case 'courierAdded':
          case 'courierLocationUpdated':
          case 'courierRouteUpdated':
          case 'courierRouteOptimized':
            // Update local courier states
            setCourierStates(new Map(courierTrackingManager.couriers));
            // Update dynamic polylines
            updateDynamicPolylines();
            if (onCourierUpdate) {
              onCourierUpdate(event, data);
            }
            break;
          case 'animationFrame':
            // Update courier positions during animation
            setCourierStates(new Map(courierTrackingManager.couriers));
            // Update dynamic polylines in real-time
            updateDynamicPolylines();
            break;
          case 'courierRemoved':
            // Update states and remove dynamic polyline
            setCourierStates(new Map(courierTrackingManager.couriers));
            setDynamicPolylines((prev) => {
              const updated = new Map(prev);
              updated.delete(data.courierId);
              return updated;
            });
            // Clean up polyline cache for removed courier
            polylineCacheRef.current.delete(data.courierId);
            break;
        }
      });

      return unsubscribe;
    }, [onCourierUpdate]);

    // Effect to start/stop animation based on courier activity
    useEffect(() => {
      const hasActiveCouriers = courierStates.size > 0;
      if (hasActiveCouriers && !courierTrackingManager.isAnimating) {
        courierTrackingManager.startAnimation();
      } else if (!hasActiveCouriers && courierTrackingManager.isAnimating) {
        courierTrackingManager.stopAnimation();
      }
    }, [courierStates]);

    // Memory management effect for polyline cache cleanup
    useEffect(() => {
      const cleanupInterval = setInterval(() => {
        const now = Date.now();
        const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

        if (now - lastCleanupRef.current > CACHE_CLEANUP_INTERVAL) {
          // Clean up old polyline cache entries
          const cache = polylineCacheRef.current;
          const CACHE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

          for (const [key, entry] of cache.entries()) {
            if (now - entry.timestamp > CACHE_MAX_AGE) {
              cache.delete(key);
            }
          }

          // Limit cache size to prevent memory leaks
          const MAX_CACHE_SIZE = 100;
          if (cache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            // Remove oldest entries
            const entriesToRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
            entriesToRemove.forEach(([key]) => cache.delete(key));
          }

          lastCleanupRef.current = now;
        }
      }, 60 * 1000); // Run cleanup check every minute

      return () => clearInterval(cleanupInterval);
    }, []);

    useEffect(() => {
      // Only fit to elements if:
      // 1. Map is ready and fitToElements is enabled
      // 2. User hasn't manually interacted with the map
      // 3. We haven't already done the initial fitting, OR we have new truck/destination locations
      if (mapReady && fitToElements && !hasUserInteracted) {
        const coordinates = [];
        if (truckLocation) {
          coordinates.push(truckLocation);
        }
        if (destinationLocation) {
          coordinates.push(destinationLocation);
        }

        // Only include courier location in initial fitting, not in updates
        if (courierLocation && !hasInitiallyFitted) {
          coordinates.push(courierLocation);
        }

        if (
          coordinates.length > 0 &&
          (!hasInitiallyFitted || truckLocation || destinationLocation)
        ) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            },
            animated: true,
          });
          setHasInitiallyFitted(true);
        }
      }
    }, [
      mapReady,
      fitToElements,
      truckLocation,
      destinationLocation,
      hasUserInteracted,
      hasInitiallyFitted,
    ]);

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      postMessage: (message) => {
        // Handle any messages that need to be sent to the map
        console.log('MapWebview: Received message:', message);

        try {
          const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;

          if (parsedMessage.type === 'addFoodTrucks') {
            console.log('MapWebview: Adding food trucks:', parsedMessage.foodTrucks?.length);
            setFoodTrucks(parsedMessage.foodTrucks || []);
          }
        } catch (error) {
          console.error('MapWebview: Error parsing message:', error);
        }
      },
      // Enhanced courier management with destination support
      addCourier: (id, name, location, route, destination = null) => {
        return courierTrackingManager.addCourier(id, name, location, route, destination);
      },
      updateCourierLocation: (id, location) => {
        courierTrackingManager.updateCourierLocation(id, location);
      },
      updateCourierRoute: (id, route) => {
        courierTrackingManager.updateCourierRoute(id, route);
      },
      removeCourier: (id) => {
        courierTrackingManager.removeCourier(id);
      },
      // New methods for enhanced functionality
      setCourierDestination: (id, destination) => {
        const courier = courierTrackingManager.getCourier(id);
        if (courier) {
          courier.setDestination(destination);
        }
      },
      requestRouteOptimization: (id) => {
        courierTrackingManager.requestRouteOptimization(id);
      },
      getPerformanceMetrics: () => {
        return courierTrackingManager.getPerformanceMetrics();
      },
      enableGracefulDegradation: () => {
        courierTrackingManager.enableGracefulDegradation();
      },
      disableGracefulDegradation: () => {
        courierTrackingManager.disableGracefulDegradation();
      },
      // Method to reset map view and re-fit to elements
      resetMapView: () => {
        setHasUserInteracted(false);
        setHasInitiallyFitted(false);

        if (mapRef.current && fitToElements) {
          const coordinates = [];
          if (truckLocation) {
            coordinates.push(truckLocation);
          }
          if (destinationLocation) {
            coordinates.push(destinationLocation);
          }
          if (courierLocation) {
            coordinates.push(courierLocation);
          }

          if (coordinates.length > 0) {
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50,
              },
              animated: true,
            });
          }
        }
      },
    }));

    // Handle map load
    const handleMapLoad = () => {
      console.log('MapWebview: Map loaded successfully');

      setMapReady(true);
      if (setWebViewReady) {
        setWebViewReady(true);
      }
    };

    // Handle user interactions with the map
    const handleMapInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        console.log('MapWebview: User interaction detected, disabling auto-fit');
      }
    };

    // Handle GPS button press
    const handleGPSButtonPress = () => {
      if (userLocation && mapRef.current) {
        console.log('MapWebview: Centering map on user location');

        // Mark as user interaction since they're manually centering
        setHasUserInteracted(true);

        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1500,
        );
      }

      if (onGPSButtonPress) {
        onGPSButtonPress();
      }
    };

    return (
      <View style={mapStyles.container}>
        <MapView
          key={key}
          ref={mapRef}
          style={mapStyles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: DEFAULT_CENTER.latitude,
            longitude: DEFAULT_CENTER.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onMapReady={handleMapLoad}
          onPanDrag={handleMapInteraction}
          onRegionChangeComplete={handleMapInteraction}
          showsUserLocation={userLocation && locationPermissionGranted}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          showsPointsOfInterest={true}
          mapType="standard"
        >
          {/* Render dynamic remaining route polylines */}
          {Array.from(dynamicPolylines.values()).map((polylineData) => (
            <DynamicPolyline
              key={`dynamic-${polylineData.courierId}`}
              polylineData={polylineData}
            />
          ))}

          {/* Render food truck markers */}
          {foodTrucks.map((truck) => (
            <Marker
              key={`foodtruck-${truck.id}`}
              coordinate={{
                latitude: truck.latitude,
                longitude: truck.longitude,
              }}
              title={truck.name}
              description={`Delivery: $${truck.deliveryFee}${truck.isSubscriber ? ' • Premium' : ''}`}
              onPress={() => {
                console.log('Food truck pressed:', truck.name);
                // Navigate to FoodTruckViewer with the truck ID
                if (onMessage) {
                  onMessage({
                    type: 'foodTruckPressed',
                    foodTruck: truck,
                  });
                }
              }}
            >
              <SvgMarker type="foodTruck" size={35} fallbackColor="#ff6b35" />
            </Marker>
          ))}

          {/* Render animated courier markers */}
          {Array.from(courierStates.values()).map((courier) => (
            <CourierMarker
              key={courier.id}
              courier={courier}
              position={courier.getCurrentAnimatedPosition()}
            />
          ))}

          {truckLocation && (
            <Marker coordinate={truckLocation} title="Food Truck">
              <SvgMarker type="foodTruck" size={35} />
            </Marker>
          )}

          {destinationLocation && <Marker coordinate={destinationLocation} title="Destination" />}
        </MapView>

        {/* GPS Button */}
        <TouchableOpacity
          style={mapStyles.gpsButton}
          onPress={handleGPSButtonPress}
          activeOpacity={0.8}
        >
          <Text style={mapStyles.gpsButtonText}>📍</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

export default MapWebview;
