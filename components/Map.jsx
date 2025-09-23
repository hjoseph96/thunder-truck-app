import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import MapWebview from './MapWebview';

const Map = forwardRef(
  (
    {
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
      truckLocation,
      destinationLocation,
      courierLocation,
      fitToElements,
    },
    ref,
  ) => {
    const mapRef = useRef(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      postMessage: (message) => {
        if (mapRef.current) {
          mapRef.current.postMessage(message);
        }
      },
      // Forward enhanced courier tracking methods to MapWebview
      addCourier: (id, name, location, route, destination) => {
        if (mapRef.current) {
          return mapRef.current.addCourier(id, name, location, route, destination);
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
      },
      // Forward new enhanced methods
      setCourierDestination: (id, destination) => {
        if (mapRef.current) {
          mapRef.current.setCourierDestination(id, destination);
        }
      },
      requestRouteOptimization: (id) => {
        if (mapRef.current) {
          mapRef.current.requestRouteOptimization(id);
        }
      },
      getPerformanceMetrics: () => {
        if (mapRef.current) {
          return mapRef.current.getPerformanceMetrics();
        }
      },
      enableGracefulDegradation: () => {
        if (mapRef.current) {
          mapRef.current.enableGracefulDegradation();
        }
      },
      disableGracefulDegradation: () => {
        if (mapRef.current) {
          mapRef.current.disableGracefulDegradation();
        }
      },
      resetMapView: () => {
        if (mapRef.current) {
          mapRef.current.resetMapView();
        }
      },
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
        truckLocation={truckLocation}
        destinationLocation={destinationLocation}
        courierLocation={courierLocation}
        fitToElements={fitToElements}
      />
    );
  },
);

export default Map;
