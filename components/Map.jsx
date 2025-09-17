import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import MapWebview from './MapWebview';

const Map = forwardRef(({ 
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
  renderError
}, ref) => {
  const mapRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    postMessage: (message) => {
      if (mapRef.current) {
        mapRef.current.postMessage(message);
      }
    },
    // Forward courier tracking methods to MapWebview
    addCourier: (id, name, location, route) => {
      if (mapRef.current) {
        return mapRef.current.addCourier(id, name, location, route);
      }
    },
    updateCourierLocation: (id, location) => {
      if (mapRef.current) {
        mapRef.current.updateCourierLocation(id, location);
      }
    },
    updateCourierRoute: (id, route) => {
      if (mapRef.current) {
        mapRef.current.updateCourierRoute(id, route);
      }
    },
    removeCourier: (id) => {
      if (mapRef.current) {
        mapRef.current.removeCourier(id);
      }
    }
  }));

  return (
    <MapWebview
      ref={mapRef}
      webViewReady={webViewReady}
      setWebViewReady={setWebViewReady}
      userLocation={userLocation}
      locationPermissionGranted={locationPermissionGranted}
      onGPSButtonPress={onGPSButtonPress}
      onMessage={onMessage}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onLoadProgress={onLoadProgress}
      onError={onError}
      onHttpError={onHttpError}
      renderError={renderError}
    />
  );
});

export default Map;