import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const DEFAULT_LOCATION = {
  latitude: 40.7081, // Williamsburg, Brooklyn
  longitude: -73.9571,
  accuracy: null,
};

export const useLocationManager = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [markerMovedToUserLocation, setMarkerMovedToUserLocation] = useState(false);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }, []);

  const initializeLocation = useCallback(async () => {
    try {
      console.log('LocationManager: Initializing location...');

      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        console.log('LocationManager: Permission already granted');
        setLocationPermissionGranted(true);

        const location = await getCurrentLocation();
        if (location) {
          console.log('LocationManager: User location obtained:', location);
          setUserLocation(location);
        } else {
          console.log('LocationManager: Could not get location, using default');
          setUserLocation(DEFAULT_LOCATION);
        }
      } else {
        console.log('LocationManager: Requesting permission...');
        const permissionGranted = await requestLocationPermission();

        if (permissionGranted) {
          setLocationPermissionGranted(true);
          const location = await getCurrentLocation();
          if (location) {
            setUserLocation(location);
          } else {
            setUserLocation(DEFAULT_LOCATION);
          }
        } else {
          console.log('LocationManager: Permission denied, using default location');
          setLocationPermissionGranted(false);
          setUserLocation(DEFAULT_LOCATION);
        }
      }
    } catch (error) {
      console.error('LocationManager: Error initializing location:', error);
      setUserLocation(DEFAULT_LOCATION);
    }
  }, [getCurrentLocation, requestLocationPermission]);

  const moveToCurrentLocation = useCallback(async () => {
    if (!locationPermissionGranted) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to get current location.',
        [{ text: 'OK' }]
      );
      return null;
    }

    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        return location;
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your GPS settings.',
          [{ text: 'OK' }]
        );
        return null;
      }
    } catch (error) {
      console.error('Error moving to current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }, [locationPermissionGranted, getCurrentLocation]);

  const moveToAddress = useCallback(async (address) => {
    if (!locationPermissionGranted) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to search for addresses.',
        [{ text: 'OK' }]
      );
      return null;
    }

    try {
      const geocodeResult = await Location.geocodeAsync(address);

      if (geocodeResult && geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        const newLocation = {
          latitude,
          longitude,
          accuracy: null,
        };
        setUserLocation(newLocation);
        return newLocation;
      } else {
        Alert.alert(
          'Address Not Found',
          'Could not find the specified address.',
          [{ text: 'OK' }]
        );
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      Alert.alert(
        'Geocoding Error',
        'Unable to find the specified address.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }, [locationPermissionGranted]);

  const updateUserLocation = useCallback((location) => {
    setUserLocation(location);
  }, []);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  return {
    userLocation,
    locationPermissionGranted,
    markerMovedToUserLocation,
    setMarkerMovedToUserLocation,
    moveToCurrentLocation,
    moveToAddress,
    updateUserLocation,
    initializeLocation,
  };
};