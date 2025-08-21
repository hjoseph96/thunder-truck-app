import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import Map from './Map';

export default function MapPage({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [webViewReady, setWebViewReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Add user location state
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false); // Track location permission
  const [markerMovedToUserLocation, setMarkerMovedToUserLocation] = useState(false); // Track if marker has been moved to user location
  const mapRef = useRef(null); // Ref for the Map component

  // Check location permission and get user location on component mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        console.log('MapPage: Initializing location...');
        
        // Check if we have location permission
        const { status } = await Location.getForegroundPermissionsAsync();
        
        if (status === 'granted') {
          console.log('MapPage: Location permission granted, getting current location...');
          setLocationPermissionGranted(true);
          
          // Get the user's current location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          });
          
          if (location) {
            console.log('MapPage: User location obtained:', location.coords);
            
            // Set the user location state
            const newUserLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy
            };
            setUserLocation(newUserLocation);
            
            // Move the user marker to the actual user location
            console.log('MapPage: Moving user marker to actual user location:', newUserLocation);
            if (webViewReady && !markerMovedToUserLocation) {
              moveUserMarkerToCoordinates(location.coords.latitude, location.coords.longitude, false);
              setMarkerMovedToUserLocation(true);
            } else if (!webViewReady) {
              console.log('MapPage: WebView not ready yet, will move marker when ready');
            } else {
              console.log('MapPage: Marker already moved to user location');
            }
          } else {
            console.log('MapPage: Could not get user location, defaulting to Williamsburg');
            // Default to Williamsburg coordinates
            setUserLocation({
              latitude: 40.7081, // Williamsburg, Brooklyn coordinates
              longitude: -73.9571,
              accuracy: null
            });
          }
        } else {
          console.log('MapPage: Location permission not granted, requesting permission...');
          
          // Request location permission
          const permissionGranted = await requestLocationPermission();
          
          if (permissionGranted) {
            console.log('MapPage: Location permission granted after request, getting current location...');
            setLocationPermissionGranted(true);
            
            // Get the user's current location
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            });
            
            if (location) {
              console.log('MapPage: User location obtained after permission request:', location.coords);
              
              // Set the user location state
              const newUserLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy
              };
              setUserLocation(newUserLocation);
              
              // Move the user marker to the actual user location
              console.log('MapPage: Moving user marker to actual user location after permission request:', newUserLocation);
              if (webViewReady && !markerMovedToUserLocation) {
                moveUserMarkerToCoordinates(location.coords.latitude, location.coords.longitude, false);
                setMarkerMovedToUserLocation(true);
              } else if (!webViewReady) {
                console.log('MapPage: WebView not ready yet, will move marker when ready');
              } else {
                console.log('MapPage: Marker already moved to user location');
              }
            } else {
              console.log('MapPage: Could not get user location after permission request, defaulting to Williamsburg');
              // Default to Williamsburg coordinates
              setUserLocation({
                latitude: 40.7081, // Williamsburg, Brooklyn coordinates
                longitude: -73.9571,
                accuracy: null
              });
            }
          } else {
            console.log('MapPage: Location permission denied after request, defaulting to Williamsburg');
            setLocationPermissionGranted(false);
            // Default to Williamsburg coordinates
            setUserLocation({
              latitude: 40.7081, // Williamsburg, Brooklyn coordinates
              longitude: -73.9571,
              accuracy: null
            });
          }
        }
      } catch (error) {
        console.error('MapPage: Error initializing location:', error);
        // Default to Williamsburg coordinates on error
        setUserLocation({
          latitude: 40.7081, // Williamsburg, Brooklyn coordinates
          longitude: -73.9571,
          accuracy: null
        });
      }
    };
    
    initializeLocation();
    
    // Fallback: Set webViewReady to true after 15 seconds regardless
    const fallbackTimer = setTimeout(() => {
      if (!webViewReady) {
        console.log('⚠️ Fallback: Setting webViewReady to true after 15 seconds');
        setWebViewReady(true);
      }
    }, 15000);
    
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [webViewReady]);

  // Move user marker to actual location once WebView is ready
  useEffect(() => {
    if (webViewReady && userLocation && locationPermissionGranted && !markerMovedToUserLocation) {
      console.log('MapPage: WebView ready, moving user marker to actual location:', userLocation);
      
      // Check if this is the user's actual location (not Williamsburg default)
      const isWilliamsburg = userLocation.latitude === 40.7081 && userLocation.longitude === -73.9571;
      
      if (!isWilliamsburg) {
        console.log('MapPage: Moving marker to user\'s actual location');
        moveUserMarkerToCoordinates(userLocation.latitude, userLocation.longitude, false);
        setMarkerMovedToUserLocation(true);
      } else {
        console.log('MapPage: User location is Williamsburg default, not moving marker');
      }
    }
  }, [webViewReady, userLocation, locationPermissionGranted, markerMovedToUserLocation]);

  // Helper function to request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const handleGPSButtonPress = async () => {
    try {
      console.log('GPS button pressed - getting current location...');
      
      // Get the user's current location (permission already checked during initialization)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      if (location) {
        console.log('GPS button pressed - location obtained:', location.coords);
        
        // Set the user location state - this will trigger the Map component to update
        const newUserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        };
        setUserLocation(newUserLocation);
        
        console.log('GPS button pressed - user location state updated:', newUserLocation);
      } else {
        console.log('GPS button pressed - could not get location');
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your GPS settings and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting user location for GPS button:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
      [{ text: 'OK' }]
      );
    }
  };

  // Function to move user marker to specific coordinates
  const moveUserMarkerToCoordinates = (latitude, longitude, updateState = true) => {
    if (!locationPermissionGranted) {
      console.log('Cannot move marker: location permission not granted');
      Alert.alert(
        'Permission Required',
        'Location permission is required to move the marker. Please grant location access.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('Moving user marker to coordinates:', { latitude, longitude });
    
    // Only update state if explicitly requested (prevents infinite loops during initialization)
    if (updateState) {
      const newLocation = {
        latitude,
        longitude,
        accuracy: userLocation?.accuracy || null
      };
      
      setUserLocation(newLocation);
    }
    
    // Send message to WebView to move the marker
    if (webViewReady) {
      const message = {
        type: 'moveUserMarker',
        coordinates: { latitude, longitude }
      };
      
      // Use the Map component's ref to send message
      if (mapRef.current) {
        mapRef.current.postMessage(JSON.stringify(message));
      }
    }
  };

  // Function to move user marker to current GPS location
  const moveUserMarkerToCurrentLocation = async () => {
    if (!locationPermissionGranted) {
      console.log('Cannot move marker: location permission not granted');
      Alert.alert(
        'Permission Required',
        'Location permission is required to move the marker. Please grant location access.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('Moving user marker to current GPS location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      if (location) {
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        };
        
        setUserLocation(newLocation);
        console.log('User marker moved to current GPS location:', newLocation);
      }
    } catch (error) {
      console.error('Error moving marker to current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Function to move user marker to a specific address (geocoding)
  const moveUserMarkerToAddress = async (address) => {
    if (!locationPermissionGranted) {
      console.log('Cannot move marker: location permission not granted');
      Alert.alert(
        'Permission Required',
        'Location permission is required to move the marker. Please grant location access.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('Moving user marker to address:', address);
      
      // Use reverse geocoding to get coordinates from address
      const geocodeResult = await Location.geocodeAsync(address);
      
      if (geocodeResult && geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        
        const newLocation = {
          latitude,
          longitude,
          accuracy: null // Geocoded addresses don't have accuracy
        };
        
        setUserLocation(newLocation);
        console.log('User marker moved to address coordinates:', newLocation);
      } else {
        Alert.alert(
          'Address Not Found',
          'Could not find the specified address. Please check the address and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error moving marker to address:', error);
      Alert.alert(
        'Geocoding Error',
        'Unable to find the specified address. Please check the address and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Function to update marker position when map moves
  const updateMarkerPosition = (newCoordinates) => {
    if (!locationPermissionGranted) {
      return; // Don't update if no permission
    }

    console.log('Updating marker position to:', newCoordinates);
    setUserLocation(prevLocation => ({
      ...prevLocation,
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude
    }));
  };

  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.searchIcon}>
        <Path d="M7.33335 12.0001C9.91068 12.0001 12 9.91074 12 7.33342C12 4.75609 9.91068 2.66675 7.33335 2.66675C4.75602 2.66675 2.66669 4.75609 2.66669 7.33342C2.66669 9.91074 4.75602 12.0001 7.33335 12.0001Z" stroke="#EE6C4D" strokeWidth="1.33333"/>
        <Path d="M13.3334 13.3335L11.3334 11.3335" stroke="#EE6C4D" strokeWidth="1.33333" strokeLinecap="round"/>
      </Svg>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#000"
        value={searchText}
        onChangeText={setSearchText}
      />

      <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.micIcon}>
        <Path d="M8 9.33325C9.10667 9.33325 10 8.43992 10 7.33325V3.33325C10 2.22659 9.10667 1.33325 8 1.33325C6.89333 1.33325 6 2.22659 6 3.33325V7.33325C6 8.43992 6.89333 9.33325 8 9.33325Z" fill="#EE6C4D"/>
        <Path d="M11.3333 7.33325C11.3333 9.17325 9.83998 10.6666 7.99998 10.6666C6.15998 10.6666 4.66665 9.17325 4.66665 7.33325H3.33331C3.33331 9.68659 5.07331 11.6199 7.33331 11.9466V13.9999H8.66665V11.9466C10.9266 11.6199 12.6666 9.68659 12.6666 7.33325H11.3333Z" fill="#EE6C4D"/>
      </Svg>
    </View>
  );

  const LocationBar = () => (
    <View style={styles.locationBar}>
      <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.locationPin}>
        <Path d="M12 1.5C9.81273 1.50248 7.71575 2.37247 6.16911 3.91911C4.62247 5.46575 3.75248 7.56273 3.75 9.75C3.75 16.8094 11.25 22.1409 11.5697 22.3641C11.6958 22.4524 11.846 22.4998 12 22.4998C12.154 22.4998 12.3042 22.4524 12.4303 22.3641C12.75 22.1409 20.25 16.8094 20.25 9.75C20.2475 7.56273 19.3775 5.46575 17.8309 3.91911C16.2843 2.37247 14.1873 1.50248 12 1.5ZM12 6.75C12.5933 6.75 13.1734 6.92595 13.6667 7.25559C14.1601 7.58524 14.5446 8.05377 14.7716 8.60195C14.9987 9.15013 15.0581 9.75333 14.9424 10.3353C14.8266 10.9172 14.5409 11.4518 14.1213 11.8713C13.7018 12.2909 13.1672 12.5766 12.5853 12.6924C12.0033 12.8081 11.4001 12.7487 10.8519 12.5216C10.3038 12.2946 9.83524 11.9101 9.50559 11.4167C9.17595 10.9234 9 10.3433 9 9.75C9 8.95435 9.31607 8.19129 9.87868 7.62868C10.4413 7.06607 11.2044 6.75 12 6.75Z" fill="#EE6C4D"/>
      </Svg>
      
      <View style={styles.locationText}>
        <Text style={styles.locationTitle}>Office</Text>
        <Text style={styles.locationSubtitle}>H-11, First Floor, Sector 63, Noida, Uttar...</Text>
      </View>

      <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.currentLocationIcon}>
        <Path d="M12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z" fill="#EE6C4D"/>
        <Path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C12.1989 1.25 12.3897 1.32902 12.5303 1.46967C12.671 1.61032 12.75 1.80109 12.75 2V3.282C14.8038 3.45905 16.7293 4.35539 18.1869 5.81306C19.6446 7.27073 20.541 9.19616 20.718 11.25H22C22.1989 11.25 22.3897 11.329 22.5303 11.4697C22.671 11.6103 22.75 11.8011 22.75 12C22.75 12.1989 22.671 12.3897 22.5303 12.5303C22.3897 12.671 22.1989 12.75 22 12.75H20.718C20.541 14.8038 19.6446 16.7293 18.1869 18.1869C16.7293 19.6446 14.8038 20.541 12.75 20.718V22C12.75 22.1989 12.671 22.3897 12.5303 22.5303C12.3897 22.671 12.1989 22.75 12 22.75C11.8011 22.75 11.6103 22.671 11.4697 22.5303C11.329 22.3897 11.25 22.1989 11.25 22V20.718C9.19616 20.541 7.27073 19.6446 5.81306 18.1869C4.35539 16.7293 3.45905 14.8038 3.282 12.75H2C1.80109 12.75 1.61032 12.671 1.46967 12.5303C1.32902 12.3897 1.25 12.1989 1.25 12C1.25 11.8011 1.32902 11.6103 1.46967 11.4697C1.61032 11.329 1.80109 11.25 2 11.25H3.282C3.45905 9.19616 4.35539 7.27073 5.81306 5.81306C7.27073 4.35539 9.19616 3.45905 11.25 3.282V2C11.25 1.80109 11.329 1.61032 11.4697 1.46967C11.6103 1.32902 11.8011 1.25 12 1.25ZM4.75 12C4.75 12.9521 4.93753 13.8948 5.30187 14.7745C5.66622 15.6541 6.20025 16.4533 6.87348 17.1265C7.5467 17.7997 8.34593 18.3338 9.22554 18.6981C10.1052 19.0625 11.0479 19.25 12 19.25C12.9521 19.25 13.8948 19.0625 14.7745 18.6981C15.6541 18.3338 16.4533 17.7997 17.1265 17.1265C17.7997 16.4533 18.3338 15.6541 18.6981 14.7745C19.0625 13.8948 19.25 12.9521 19.25 12C19.25 10.0772 18.4862 8.23311 17.1265 6.87348C15.7669 5.51384 13.9228 4.75 12 4.75C10.0772 4.75 8.23311 5.51384 6.87348 6.87348C5.51384 8.23311 4.75 10.0772 4.75 12Z" fill="#EE6C4D"/>
      </Svg>
    </View>
  );

  const BottomNavigation = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M16 28.0001L14.0667 26.2668C11.8222 24.2446 9.96669 22.5001 8.50002 21.0334C7.03335 19.5668 5.86669 18.2499 5.00002 17.0828C4.13335 15.9166 3.52802 14.8446 3.18402 13.8668C2.84002 12.889 2.66758 11.889 2.66669 10.8668C2.66669 8.77789 3.36669 7.03345 4.76669 5.63345C6.16669 4.23345 7.91113 3.53345 10 3.53345C11.1556 3.53345 12.2556 3.77789 13.3 4.26678C14.3445 4.75567 15.2445 5.44456 16 6.33345C16.7556 5.44456 17.6556 4.75567 18.7 4.26678C19.7445 3.77789 20.8445 3.53345 22 3.53345C24.0889 3.53345 25.8334 4.23345 27.2334 5.63345C28.6334 7.03345 29.3334 8.77789 29.3334 10.8668C29.3334 11.889 29.1614 12.889 28.8174 13.8668C28.4734 14.8446 27.8676 15.9166 27 17.0828C26.1334 18.2499 24.9667 19.5668 23.5 21.0334C22.0334 22.5001 20.1778 24.2446 17.9334 26.2668L16 28.0001ZM16 24.4001C18.1334 22.489 19.8889 20.8503 21.2667 19.4841C22.6445 18.1179 23.7334 16.929 24.5334 15.9174C25.3334 14.9059 25.8889 14.0054 26.2 13.2161C26.5111 12.4268 26.6667 11.6437 26.6667 10.8668C26.6667 9.53345 26.2222 8.42234 25.3334 7.53345C24.4445 6.64456 23.3334 6.20011 22 6.20011C20.9556 6.20011 19.9889 6.49434 18.1 7.08278C18.2111 7.67122 17.6 8.42145 17.2667 9.33345H14.7334C14.4 8.42234 13.7889 7.67256 12.9 7.08411C12.0111 6.49567 11.0445 6.201 10 6.20011C8.66669 6.20011 7.55558 6.64456 6.66669 7.53345C5.7778 8.42234 5.33335 9.53409 5.33335 10.8668C5.33335 11.6446 5.48891 12.4281 5.80002 13.2174C6.11113 14.0068 6.66669 14.9068 7.46669 15.9174C8.26669 16.9281 9.35558 18.117 10.7334 19.4841C12.1111 20.8512 13.8667 22.4899 16 24.4001Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M16 2.66675C8.64002 2.66675 2.66669 8.64008 2.66669 16.0001C2.66669 23.3601 8.64002 29.3334 16 29.3334C23.36 29.3334 29.3334 23.3601 29.3334 16.0001C29.3334 8.64008 23.36 2.66675 16 2.66675ZM16 26.6667C10.12 26.6667 5.33335 21.8801 5.33335 16.0001C5.33335 10.1201 10.12 5.33341 16 5.33341C21.88 5.33341 26.6667 10.1201 26.6667 16.0001C26.6667 21.8801 21.88 26.6667 16 26.6667ZM8.66669 23.3334L18.68 18.6801L23.3334 8.66675L13.32 13.3201L8.66669 23.3334ZM16 14.5334C16.8134 14.5334 17.4667 15.1867 17.4667 16.0001C17.4667 16.8134 16.8134 17.4667 16 17.4667C15.1867 17.4667 14.5334 16.8134 14.5334 16.0001C14.5334 15.1867 15.1867 14.5334 16 14.5334Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M28.707 19.293L26 16.586V13C25.9969 10.5218 25.075 8.13285 23.4126 6.29498C21.7502 4.45712 19.4654 3.30093 17 3.05V1H15V3.05C12.5346 3.30093 10.2498 4.45712 8.58737 6.29498C6.92498 8.13285 6.0031 10.5218 6 13V16.586L3.293 19.293C3.10545 19.4805 3.00006 19.7348 3 20V23C3 23.2652 3.10536 23.5196 3.29289 23.7071C3.48043 23.8946 3.73478 24 4 24H11V24.777C10.9782 26.0456 11.4254 27.2777 12.2558 28.237C13.0862 29.1964 14.2414 29.8156 15.5 29.976C16.1952 30.0449 16.8971 29.9676 17.5606 29.749C18.2241 29.5304 18.8345 29.1753 19.3525 28.7066C19.8706 28.2379 20.2848 27.666 20.5685 27.0277C20.8522 26.3893 20.9992 25.6986 21 25V24H28C28.2652 24 28.5196 23.8946 28.7071 23.7071C28.8946 23.5196 29 23.2652 29 23V20C28.9999 19.7348 28.8946 19.4805 28.707 19.293ZM19 25C19 25.7956 18.6839 26.5587 18.1213 27.1213C17.5587 27.6839 16.7956 28 16 28C15.2044 28 14.4413 27.6839 13.8787 27.1213C13.3161 26.5587 13 25.7956 13 25V24H19V25ZM27 22H5V20.414L7.707 17.707C7.89455 17.5195 7.99994 17.2652 8 17V13C8 10.8783 8.84285 8.84344 10.3431 7.34315C11.8434 5.84285 13.8783 5 16 5C18.1217 5 20.1566 5.84285 21.6569 7.34315C23.1571 8.84344 24 10.8783 24 13V17C24.0001 17.2652 24.1054 17.5195 24.293 17.707L27 20.414V22Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M5.33331 29.3333C5.33331 26.5043 6.45712 23.7912 8.45751 21.7908C10.4579 19.7904 13.171 18.6666 16 18.6666C18.829 18.6666 21.5421 19.7904 23.5425 21.7908C25.5428 23.7912 26.6666 26.5043 26.6666 29.3333H24C24 27.2115 23.1571 25.1767 21.6568 23.6764C20.1565 22.1761 18.1217 21.3333 16 21.3333C13.8782 21.3333 11.8434 22.1761 10.3431 23.6764C8.84283 25.1767 7.99998 27.2115 7.99998 29.3333H5.33331ZM16 17.3333C11.58 17.3333 7.99998 13.7533 7.99998 9.33325C7.99998 4.91325 11.58 1.33325 16 1.33325C20.42 1.33325 24 4.91325 24 9.33325C24 13.7533 20.42 17.3333 16 17.3333ZM16 14.6666C18.9466 14.6666 21.3333 12.2799 21.3333 9.33325C21.3333 6.38659 18.9466 3.99992 16 3.99992C13.0533 3.99992 10.6666 6.38659 10.6666 9.33325C10.6666 12.2799 13.0533 14.6666 16 14.6666Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path d="M19 12H5M12 19L5 12L12 5" stroke="#2D1E2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Map</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Search Bar */}
      <SearchBar />
      
      {/* Location Bar */}
      <LocationBar />
      
      {/* Map Component */}
      <Map
        ref={mapRef}
        webViewReady={webViewReady}
        setWebViewReady={setWebViewReady}
        userLocation={userLocation}
        locationPermissionGranted={locationPermissionGranted}
        onGPSButtonPress={handleGPSButtonPress}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('✅ Map message received:', data);
            
            switch (data.type) {
              case 'mapLoaded':
                console.log('🗺️ Mapbox map loaded successfully');
                setWebViewReady(true);
                break;
              case 'mapError':
                console.error('❌ Map error:', data.error);
                Alert.alert('Map Error', `Failed to load map: ${data.error}`);
                break;
              case 'webViewReady':
                console.log('🌐 WebView is ready');
                setWebViewReady(true);
                break;
              case 'debug':
                console.log('🐛 Debug message:', data.message);
                break;
              case 'mapClick':
                console.log('👆 Map clicked at:', data.coordinates);
                break;
              case 'userLocation':
                console.log('📍 User location:', data.coordinates);
                break;
              case 'userLocationMarkerAdded':
                console.log('📍 User location marker added at:', data.coordinates);
                break;
              case 'centerMapOnUserLocation':
                console.log('🎯 GPS button message received - centering map on user location');
                break;
              case 'gpsButtonPressed':
                console.log('🎯 GPS button pressed in WebView, triggering GPS button handler');
                handleGPSButtonPress();
                break;
              case 'userLocationUpdate':
                console.log('🔄 User location update received:', data.coordinates);
                break;
              case 'userLocationObtained':
                console.log('📍 User location obtained from WebView:', data.coordinates);
                break;
              case 'moveBlueDot':
                console.log('🎯 Move blue dot request received:', data.coordinates);
                break;
              case 'markerMoved':
                console.log('📍 Marker moved to:', data.coordinates);
                updateMarkerPosition(data.coordinates);
                break;
              case 'markerMoveError':
                console.error('❌ Error moving marker:', data.error);
                Alert.alert('Marker Error', `Failed to move marker: ${data.error}`);
                break;
              case 'test':
                console.log('🧪 Test message received:', data.message);
                Alert.alert('Test Message', `WebView received: ${data.message}`);
                break;
              default:
                console.log('❓ Unknown message type:', data.type);
                break;
            }
          } catch (error) {
            console.error('❌ Error parsing map message:', error, 'Raw data:', event.nativeEvent.data);
          }
        }}
        onLoadStart={() => {
          console.log('🌐 WebView started loading');
        }}
        onLoadEnd={() => {
          console.log('🌐 WebView finished loading');
        }}
        onLoadProgress={({ nativeEvent }) => {
          console.log('🌐 WebView loading progress:', nativeEvent.progress);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
          Alert.alert('WebView Error', `Failed to load WebView: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView HTTP error:', nativeEvent);
          Alert.alert('WebView HTTP Error', `HTTP Error: ${nativeEvent.statusCode}`);
        }}
        renderError={(errorName) => {
          console.error('❌ WebView render error:', errorName);
          return (
            <View style={styles.webViewError}>
              <Text style={styles.webViewErrorText}>Failed to load map</Text>
              <Text style={styles.webViewErrorText}>{errorName}</Text>
            </View>
          );
        }}
      />
      
      {/* View List Button */}
      <TouchableOpacity style={styles.viewListButton}>
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path d="M4 13C4.55 13 5 12.55 5 12C5 11.45 4.55 11 4 11C3.45 11 3 11.45 3 12C3 12.55 3.45 13 4 13ZM4 17C4.55 17 5 16.55 5 16C5 15.45 4.55 15 4 15C3.45 15 3 15.45 3 16C3 16.55 3.45 17 4 17ZM4 9C4.55 9 5 8.55 5 8C5 7.45 4.55 7 4 7C3.45 7 3 7.45 3 8C3 8.55 3.45 9 4 9ZM8 13H20C20.55 13 21 12.55 21 12C21 11.45 20.55 11 20 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13ZM8 17H20C20.55 17 21 16.55 21 16C21 15.45 20.55 15 20 15H8C7.45 15 7 15.45 7 16C7 16.55 7.45 17 8 17ZM7 8C7 8.55 7.45 9 8 9H20C20.55 9 21 8.55 21 8C21 7.45 20.55 7 20 7H8C7.45 7 7 7.45 7 8Z" fill="red"/>
        </Svg>
        <Text style={styles.viewListText}>View List</Text>
      </TouchableOpacity>
      
      {/* Target/GPS Button */}
      <TouchableOpacity style={styles.targetButton} onPress={handleGPSButtonPress}>
        <Svg width="36" height="36" viewBox="0 0 36 36">
          <Path d="M29.907 19.5C29.5731 22.1436 28.3693 24.601 26.4851 26.4851C24.601 28.3693 22.1436 29.5731 19.5 29.907V33H16.5V29.907C13.8564 29.5731 11.399 28.3693 9.51485 26.4851C7.6307 24.601 6.42688 22.1436 6.093 19.5H3V16.5H6.093C6.42688 13.8564 7.6307 11.399 9.51485 9.51485C11.399 7.6307 13.8564 6.42688 16.5 6.093V3H19.5V6.093C22.1436 6.42688 24.601 7.6307 26.4851 9.51485C28.3693 11.399 29.5731 13.8564 29.907 16.5H33V19.5H29.907ZM18 27C20.3869 27 22.6761 26.0518 24.364 24.364C26.0518 22.6761 27 20.3869 27 18C27 15.6131 26.0518 13.3239 24.364 11.636C22.6761 9.94821 20.3869 9 18 9C15.6131 9 13.3239 9.94821 11.636 11.636C9.94821 13.3239 9 15.6131 9 18C9 20.3869 9.94821 22.6761 11.636 24.364C13.3239 26.0518 15.6131 27 18 27ZM18 22.5C19.1935 22.5 20.3381 22.0259 21.182 21.182C22.0259 20.3381 22.5 19.1935 22.5 18C22.5 16.8065 22.0259 15.6619 21.182 14.818C20.3381 13.9741 19.1935 13.5 18 13.5C16.8065 13.5 15.6619 13.9741 14.818 14.818C13.9741 15.6619 13.5 16.8065 13.5 18C13.5 19.1935 13.9741 20.3381 14.818 21.182C15.6619 22.0259 16.8065 22.5 18 22.5Z" fill="#E6521F"/>
        </Svg>
      </TouchableOpacity>
      
      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Debug Modal - User Address */}
      {/* Modal removed as requested */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    height: 77,
    backgroundColor: '#fecd15',
    justifyContent: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 27,
    paddingTop: 17,
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Inter',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 4,
  },
  searchContainer: {
    height: 40,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Inter',
  },
  micIcon: {
    marginLeft: 8,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationPin: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  currentLocationIcon: {
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapImage: {
    flex: 1,
    borderRadius: 12,
  },
  mapMarker: {
    position: 'absolute',
  },
  largeMarkerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EE6C4D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  largeMarkerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EE6C4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  ratingContainer: {
    width: 68,
    height: 36,
    borderRadius: 10,
    borderWidth: 0.1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 5,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#000',
    fontFamily: 'Poppins',
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
});
