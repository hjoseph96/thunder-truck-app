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