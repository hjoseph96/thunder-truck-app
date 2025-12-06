import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GoogleMap, Marker as GoogleMarker, Polyline as GooglePolyline, OverlayView, useJsApiLoader } from '@react-google-maps/api';
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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const handleMapLoad = (map) => {
    setMap(map);
    onMapReady?.();
  };

  const handleDragEnd = () => {
    if (map) {
      const center = map.getCenter();
      const newCenter = { lat: center.lat(), lng: center.lng() };
      setMapCenter(newCenter);
      onPanDrag?.();
      
      // Get zoom level to calculate deltas
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      // Calculate latitude and longitude deltas
      let latitudeDelta = 0.01;
      let longitudeDelta = 0.01;
      
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        latitudeDelta = Math.abs(ne.lat() - sw.lat());
        longitudeDelta = Math.abs(ne.lng() - sw.lng());
      }
      
      // Call onRegionChangeComplete with region data
      onRegionChangeComplete?.({
        latitude: newCenter.lat,
        longitude: newCenter.lng,
        latitudeDelta,
        longitudeDelta,
      });
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
    console.error('Google Maps load error:', loadError);
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '10px' }}>Error loading Google Maps</p>
          <p style={{ color: '#666', fontSize: '14px' }}>Please check your API key configuration</p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>API Key: {GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing'}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#666' }}>Loading map...</p>
        </div>
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
          mapTypeId: mapType === 'standard' ? 'roadmap' : mapType.toUpperCase(),
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          rotateControl: false, // Compass control (triangle) - disabled to remove triangle
          styles: [], // Empty styles for standard rendering
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
export const Marker = forwardRef(({
  coordinate,
  title = '',
  description = '',
  onPress = () => {},
  icon = null,
  image = null,
  anchor = { x: 0.5, y: 1 },
  children,
  ...props
}, ref) => {
  const position =
    coordinate && coordinate.latitude && coordinate.longitude
      ? { lat: coordinate.latitude, lng: coordinate.longitude }
      : null;

  if (!position) return null;

  const handleMarkerClick = () => {
    onPress?.();
  };

  // If children are provided, use OverlayView for custom rendering
  if (children) {
    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        getPixelPositionOffset={(width, height) => ({
          x: -(width * anchor.x),
          y: -(height * anchor.y),
        })}
      >
        <div
          onClick={handleMarkerClick}
          title={title}
          style={{
            cursor: 'pointer',
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {children}
        </div>
      </OverlayView>
    );
  }
  
  // Otherwise use standard Google Marker
  return (
    <GoogleMarker
      position={position}
      title={title}
      onClick={handleMarkerClick}
      icon={icon}
      {...props}
    />
  );
});

Marker.displayName = 'Marker';

/**
 * Polyline component for web
 * Provides similar API to react-native-maps Polyline
 */
export const Polyline = ({
  coordinates = [],
  strokeColor = '#000000',
  strokeWidth = 2,
  strokeOpacity = 1.0,
  strokePattern = null,
  lineDashPattern = null,
  lineCap = 'round',
  lineJoin = 'round',
  ...props
}) => {
  const path = coordinates.map((coord) => ({
    lat: coord.latitude,
    lng: coord.longitude,
  }));

  if (!path || path.length === 0) {
    return null;
  }

  // Convert strokePattern or lineDashPattern to Google Maps format
  let icons = undefined;
  if (strokePattern && strokePattern.length > 0) {
    // Create dashed line effect using icons
    icons = [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: strokeWidth / 2,
      },
      offset: '0',
      repeat: `${strokePattern[0] + strokePattern[1]}px`,
    }];
  } else if (lineDashPattern && lineDashPattern.length > 0) {
    icons = [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: strokeWidth / 2,
      },
      offset: '0',
      repeat: `${lineDashPattern[0] + lineDashPattern[1]}px`,
    }];
  }

  const options = {
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWeight: strokeWidth,
    geodesic: true,
    icons: icons,
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

// Default export to match react-native-maps structure
export default MapView;
