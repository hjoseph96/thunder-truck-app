import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Platform } from 'react-native';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from './map/MapView';
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

// SVG Icon Components for Web
const BikeIconSvg = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 -15.5 1055 1055" xmlns="http://www.w3.org/2000/svg">
    <path d="M354.614054 430.364318l67.91349 138.460135 33.964581-23.510324-47.020648-112.332328zM636.737943 404.252185l78.367746 222.0315 39.183874-10.438584-67.91349-235.10324z" fill="#C0EAFF" />
    <path d="M335.022117 767.345629c-70.577993 0-128.005878-57.427885-128.005877-128.005877s57.427885-128.005878 128.005877-128.005878c3.745978 0 7.460609 0.172409 11.112547 0.470207 8.620452 0.736657 15.01526 8.338328 14.294277 16.95878-0.736657 8.620452-8.369675 14.999587-16.95878 14.294277a96.784167 96.784167 0 0 0-105.106822 96.298287c0 53.290068 43.353038 96.658779 96.658778 96.658779a96.75282 96.75282 0 0 0 95.326528-112.755514 15.673549 15.673549 0 1 1 30.908239-5.172271c1.175516 6.974729 1.755438 14.121868 1.755437 21.269006 0 70.577993-57.412211 127.990204-127.990204 127.990204zM709.870724 767.345629c-76.345859 0-138.444461-62.114276-138.444462-138.444461a137.660784 137.660784 0 0 1 53.384109-109.244639 15.657876 15.657876 0 1 1 19.262793 24.717187 106.501768 106.501768 0 0 0-41.299803 84.527452 107.207078 107.207078 0 0 0 107.097363 107.097363 107.207078 107.207078 0 0 0 107.097363-107.097363 107.066016 107.066016 0 0 0-47.240078-88.822004 15.673549 15.673549 0 0 1 17.554375-25.986745 138.397441 138.397441 0 0 1 61.032801 114.793075c0.015674 76.361532-62.098603 138.460135-138.444461 138.460135z" fill="#1F87DD" />
    <path d="M418.609156 591.347344a15.689223 15.689223 0 0 1-14.498033-9.733275l-56.017265-136.877106h-27.444385a15.673549 15.673549 0 0 1 0-31.347099h128.005877a15.673549 15.673549 0 0 1 0 31.347099h-10.987158l36.942556 94.276399a15.673549 15.673549 0 0 1-5.219292 18.275359l-41.409517 30.95526a15.642202 15.642202 0 0 1-9.372783 3.103363z m-36.644758-146.610381l43.478426 106.266665 15.626528-11.676795-37.067944-94.58987H381.964398z" fill="#1F87DD" />
    <path d="M335.037791 655.028975a15.657876 15.657876 0 0 1-9.1847-28.384798l309.5526-223.348079a15.689223 15.689223 0 0 1 18.338053 25.422498l-309.5526 223.348078a15.657876 15.657876 0 0 1-9.153353 2.962301zM613.227619 345.476375h-78.367747a15.673549 15.673549 0 0 1 0-31.347099h78.367747a15.673549 15.673549 0 0 1 0 31.347099z" fill="#1F87DD" />
    <path d="M715.105689 651.110587a15.610855 15.610855 0 0 1-14.968239-11.049852l-108.946842-352.059266h-103.382731a15.673549 15.673549 0 0 1 0-31.347098h114.934137a15.673549 15.673549 0 0 1 14.96824 11.049852l34.168337 110.404482 30.829872-10.281849a15.736244 15.736244 0 0 1 19.905407 10.140787l74.44936 235.10324a15.673549 15.673549 0 0 1-9.435477 19.403854l-47.020648 17.632743a15.45412 15.45412 0 0 1-5.501416 1.003107z m-53.948357-243.04973l63.995102 206.859505 17.538702-6.567217-65.154944-205.746683-16.37886 5.454395z" fill="#1F87DD" />
  </svg>
);

const DestinationPinSvg = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      fill="#dc3545"
    />
    <circle cx="12" cy="9" r="1.5" fill="#fff"/>
  </svg>
);

// Reusable SVG Marker Component with fallback
const SvgMarker = ({ type, size = 30, fallbackColor = '#007cff' }) => {
  const [hasError] = useState(false);

  // For web platform, render as HTML/CSS with actual SVG icons
  if (Platform.OS === 'web') {
    const containerStyle = {
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    };

    // Render different SVG icons based on type
    switch (type) {
      case 'foodTruck':
        return (
          <div style={containerStyle}>
            <FoodTruckIcon size={size} />
          </div>
        );
      case 'courier':
        return (
          <div style={containerStyle}>
            <BikeIconSvg size={size} />
          </div>
        );
      case 'destination':
        return (
          <div style={containerStyle}>
            <DestinationPinSvg size={size} />
          </div>
        );
      default:
        return (
          <div style={containerStyle}>
            <DestinationPinSvg size={size} />
          </div>
        );
    }
  }

  // Native platform rendering (iOS/Android)
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

// Enhanced dynamic polyline component
// Receives pre-calculated coordinates to ensure perfect sync with marker
const DynamicPolyline = ({ courier, coordinates }) => {
  if (!courier || !coordinates || coordinates.length < 2) {
    return null;
  }

  // Get polyline styling based on courier type, status, and animation state
  const getPolylineStyle = () => {
    const baseStyle = {
      strokeWidth: courier.animationState.isPolylineAnimating ? 5 : 4,
      lineCap: 'round',
      lineJoin: 'round',
    };

    // Color based on courier type
    const typeColors = {
      bicycle: '#00ff88',
      motorcycle: '#ff6b35',
      car: '#007cff',
      walking: '#9d4edd',
    };

    // Animation-based modifications
    if (courier.animationState.isPolylineAnimating) {
      return {
        ...baseStyle,
        strokeColor: typeColors[courier.courierType] || '#00ff88',
        strokePattern: undefined,
        strokeOpacity: 0.9,
      };
    }

    // Status-based modifications
    const statusModifications = {
      deviating: {
        strokeColor: '#ff4757',
        strokePattern: [10, 5],
      },
      moving: {
        strokeColor: typeColors[courier.courierType] || '#00ff88',
        strokePattern: undefined,
      },
      idle: {
        strokeColor: typeColors[courier.courierType] || '#00ff88',
        strokeWidth: 3,
        strokePattern: [5, 5],
      },
    };

    const statusStyle = statusModifications[courier.status] || statusModifications.moving;

    return {
      ...baseStyle,
      ...statusStyle,
    };
  };

  const style = getPolylineStyle();

  return (
    <Polyline
      key={`dynamic-${courier.id}`}
      coordinates={coordinates}
      {...style}
    />
  );
};

// Enhanced courier marker component that moves along polyline
// NO MEMOIZATION: Ensures marker updates on every render for perfect iOS sync
const CourierMarker = ({ courier, position }) => {
  if (!position) return null;

  const markerColor = courier.animationState?.isPolylineAnimating ? '#00ff88' : '#007cff';
  const markerScale = courier.animationState?.isPolylineAnimating ? 1.1 : 1.0;

  // Platform-specific marker rendering
  const markerContent = Platform.OS === 'web' ? (
    <div
      style={{
        width: '30px',
        height: '30px',
        backgroundColor: markerColor,
        borderRadius: '50%',
        border: '3px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        transform: `scale(${markerScale})`,
        transition: 'all 0.3s ease',
      }}
    >
      <span style={{ fontSize: '12px' }}>🚴</span>
    </div>
  ) : (
    <View
      style={{
        width: 30,
        height: 30,
        backgroundColor: markerColor,
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
        transform: [{ scale: markerScale }],
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>🚴</Text>
    </View>
  );

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
      {markerContent}
    </Marker>
  );
};

// Map styles for React Native
const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        height: '100%',
        minHeight: 300,
      },
    }),
  },
  map: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        height: '100%',
      },
    }),
  },
  gpsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fecd15',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
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
    const [foodTrucks, setFoodTrucks] = useState([]);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [hasInitiallyFitted, setHasInitiallyFitted] = useState(false);

    // Effect to handle courier tracking updates
    useEffect(() => {
      const unsubscribe = courierTrackingManager.subscribe((event, data) => {
        switch (event) {
          case 'courierAdded':
          case 'courierLocationUpdated':
          case 'courierRouteUpdated':
          case 'courierRouteOptimized':
            // Update local courier states - polylines will recalculate automatically on render
            setCourierStates(new Map(courierTrackingManager.couriers));
            if (onCourierUpdate) {
              onCourierUpdate(event, data);
            }
            break;
          case 'animationFrame':
            // Update courier states - both markers and polylines recalculate on render
            setCourierStates(new Map(courierTrackingManager.couriers));
            break;
          case 'courierRemoved':
            // Update courier states - removed courier won't render
            setCourierStates(new Map(courierTrackingManager.couriers));
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

        try {
          const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;

          if (parsedMessage.type === 'addFoodTrucks') {
            setFoodTrucks(parsedMessage.foodTrucks || []);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
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

      setMapReady(true);
      if (setWebViewReady) {
        setWebViewReady(true);
      }
    };

    // Handle user interactions with the map
    const handleMapInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
    };

    // Handle GPS button press
    const handleGPSButtonPress = () => {
      if (userLocation && mapRef.current) {

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
          {/* iOS FIX: Render polylines and markers in SINGLE loop for perfect sync */}
          {Array.from(courierStates.values()).map((courier) => {
            // Calculate BOTH coordinates and position in same iteration for guaranteed sync
            const position = courier.getCurrentAnimatedPosition();
            const coordinates = courier.route && courier.route.length >= 2
              ? getRemainingRouteCoordinates(courier.route, courier.animationState.currentProgress)
              : null;
            
            return (
              <React.Fragment key={`courier-${courier.id}`}>
                <DynamicPolyline
                  key={`polyline-${courier.id}`}
                  courier={courier}
                  coordinates={coordinates}
                />
                <CourierMarker
                  key={`marker-${courier.id}`}
                  courier={courier}
                  position={position}
                />
              </React.Fragment>
            );
          })}

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

          {truckLocation && (
            <Marker coordinate={truckLocation} title="Food Truck">
              <SvgMarker type="foodTruck" size={35} />
            </Marker>
          )}

          {destinationLocation && (
            <Marker coordinate={destinationLocation} title="Destination">
              <SvgMarker type="destination" size={35} />
            </Marker>
          )}
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
