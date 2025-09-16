import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decode } from '@mapbox/polyline';

// Default map center (Williamsburg, Brooklyn)
const DEFAULT_CENTER = {
  longitude: -73.9571,
  latitude: 40.7081,
  zoom: 14
};

// Default polyline from the utility
const DEFAULT_POLYLINE = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";

// New bike route polyline
const BIKE_ROUTE_POLYLINE = "gj_wFfhrbMuDnHlBpBvSga@nLiU_FgFdKiShC{E@KgBsBvAkCGm@{Qef@hHy@iDco@RCU_DIOGE}@}PwMxAGeA";

// Decode polylines directly to coordinates
const DEFAULT_ROUTE_COORDINATES = decode(DEFAULT_POLYLINE).map(coord => ({
  latitude: coord[0],
  longitude: coord[1]
}));

const BIKE_ROUTE_COORDINATES = decode(BIKE_ROUTE_POLYLINE).map(coord => ({
  latitude: coord[0],
  longitude: coord[1]
}));

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


const MapWebview = forwardRef(({ 
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
  const [mapReady, setMapReady] = useState(false);
  const [bikeAnimationState, setBikeAnimationState] = useState({
    isAnimating: false,
    currentIndex: 0,
    bikeMarker: null,
    totalCoordinates: 0,
    isCompleted: false,
    shouldLoop: false,
    progress: 0
  });

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    postMessage: (message) => {
      // Handle any messages that need to be sent to the map
      console.log('MapWebview: Received message:', message);
    }
  }));

  // Handle map load
  const handleMapLoad = () => {
    console.log('MapWebview: Map loaded successfully');
    setMapReady(true);
    if (setWebViewReady) {
      setWebViewReady(true);
    }
  };

  // Handle GPS button press
  const handleGPSButtonPress = () => {
    if (userLocation && mapRef.current) {
      console.log('MapWebview: Centering map on user location');
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1500);
    }
    if (onGPSButtonPress) {
      onGPSButtonPress();
    }
  };


  return (
    <View style={mapStyles.container}>
      <MapView
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
        {/* Default Route Polyline */}
        <Polyline
          coordinates={DEFAULT_ROUTE_COORDINATES}
          strokeColor="#219ebc"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Bike Route Polyline */}
        <Polyline
          coordinates={BIKE_ROUTE_COORDINATES}
          strokeColor="#007cff"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Route Start Marker */}
        <Marker
          coordinate={DEFAULT_ROUTE_COORDINATES[0]}
          title="Route Start"
          description="Starting point of the route"
        >
          <View style={{
            width: 20,
            height: 20,
            backgroundColor: '#00ff00',
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'white'
          }} />
        </Marker>

        {/* Route End Marker */}
        <Marker
          coordinate={DEFAULT_ROUTE_COORDINATES[DEFAULT_ROUTE_COORDINATES.length - 1]}
          title="Route End"
          description="Ending point of the route"
        >
          <View style={{
            width: 20,
            height: 20,
            backgroundColor: '#ff0000',
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'white'
          }} />
        </Marker>

        {/* Bike Route End Marker */}
        <Marker
          coordinate={BIKE_ROUTE_COORDINATES[BIKE_ROUTE_COORDINATES.length - 1]}
          title="Bike Route End"
          description="Ending point of the bike route"
        >
          <View style={{
            width: 20,
            height: 20,
            backgroundColor: '#007cff',
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'white'
          }} />
        </Marker>
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
});

export default MapWebview;