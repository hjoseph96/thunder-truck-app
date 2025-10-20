import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GoogleMap, Marker as GoogleMarker, Polyline as GooglePolyline, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/google-maps-config';

export const PROVIDER_GOOGLE = 'google';

/**
 * Web version of MapView component
 * Uses @react-google-maps/api to provide similar functionality to react-native-maps
 */
export const MapView = forwardRef((props, ref) => {
  const {
    style = {},
    initialRegion = {},
    onRegionChangeComplete = () => {},
    showsUserLocation = false,
    showsMyLocationButton = false,
    showsCompass = true,
    showsScale = true,
    children,
    provider = PROVIDER_GOOGLE,
    onMapReady = () => {},
    onPanDrag = () => {},
    mapType = 'roadmap',
    ...otherProps
  } = props;

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(
    initialRegion?.latitude && initialRegion?.longitude
      ? { lat: initialRegion.latitude, lng: initialRegion.longitude }
      : { lat: 40.7081, lng: -73.9571 } // Default to Williamsburg, Brooklyn
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const handleMapLoad = (map) => {
    setMap(map);
    onMapReady?.();
  };

  const handleDragEnd = () => {
    if (map) {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat(), lng: center.lng() });
      onPanDrag?.();
      onRegionChangeComplete?.();
    }
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 300) => {
      if (map) {
        const { latitude, longitude } = region;
        map.panTo({ lat: latitude, lng: longitude });
      }
    },
    fitToCoordinates: (coordinates, options = {}) => {
      if (map && coordinates && coordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        coordinates.forEach((coord) => {
          bounds.extend({ lat: coord.latitude, lng: coord.longitude });
        });
        map.fitBounds(bounds);
      }
    },
    setMapRef: () => map,
  }));

  if (loadError) {
    return (
      <div style={style}>
        <p>Error loading Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={style}>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} style={style}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={initialRegion?.zoom || 14}
        onLoad={handleMapLoad}
        onDragEnd={handleDragEnd}
        options={{
          mapTypeId: mapType.toUpperCase(),
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
        }}
        {...otherProps}
      >
        {children}
      </GoogleMap>
    </div>
  );
});

MapView.displayName = 'MapView';

/**
 * Marker component for web
 * Provides similar API to react-native-maps Marker
 */
export const Marker = ({
  coordinate,
  title = '',
  description = '',
  onPress = () => {},
  icon = null,
  image = null,
  children,
  ...props
}) => {
  const position =
    coordinate && coordinate.latitude && coordinate.longitude
      ? { lat: coordinate.latitude, lng: coordinate.longitude }
      : null;

  if (!position) return null;

  const handleMarkerClick = () => {
    onPress?.();
  };

  return (
    <GoogleMarker
      position={position}
      title={title}
      label={title}
      onClick={handleMarkerClick}
      icon={icon}
      {...props}
    >
      {children && <div>{children}</div>}
    </GoogleMarker>
  );
};

/**
 * Polyline component for web
 * Provides similar API to react-native-maps Polyline
 */
export const Polyline = ({
  coordinates = [],
  strokeColor = '#000000',
  strokeWidth = 2,
  lineDashPattern = [],
  ...props
}) => {
  const path = coordinates.map((coord) => ({
    lat: coord.latitude,
    lng: coord.longitude,
  }));

  if (!path || path.length === 0) {
    return null;
  }

  const options = {
    strokeColor: strokeColor,
    strokeOpacity: 0.8,
    strokeWeight: strokeWidth,
    geodesic: true,
  };

  return <GooglePolyline path={path} options={options} {...props} />;
};

/**
 * AnimatedRegion class for web
 * Provides a simple animation interface similar to native
 */
export class AnimatedRegion {
  constructor(initialValue = {}) {
    this.value = initialValue;
  }

  addListener(callback) {
    // Web version doesn't support continuous listeners
    return { remove: () => {} };
  }
}
