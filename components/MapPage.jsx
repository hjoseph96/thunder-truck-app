import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, G, ClipPath, Rect, Defs, ForeignObject } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultCenter } from '../config/mapbox-config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MapPage({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const webViewRef = useRef(null);

  // Check location permission on component mount
  useEffect(() => {
    checkLocationPermission();
    
    // Send default location to WebView after a short delay to ensure it's loaded
    const timer = setTimeout(() => {
      sendDefaultLocationToWebView();
    }, 1000);
    
    // Fallback: Set webViewReady to true after 15 seconds regardless
    const fallbackTimer = setTimeout(() => {
      if (!webViewReady) {
        console.log('⚠️ Fallback: Setting webViewReady to true after 15 seconds');
        setWebViewReady(true);
      }
    }, 15000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [webViewReady]);

  const checkLocationPermission = async () => {
    try {
      // Check if we've already asked for permission
      const hasAskedBefore = await AsyncStorage.getItem('locationPermissionAsked');
      
      if (hasAskedBefore) {
        // User has been asked before, check current status
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status);
        
        if (status === 'granted') {
          // Permission granted, send to WebView
          sendLocationPermissionToWebView(true);
        }
      } else {
        // First time, show the modal
        setShowLocationModal(true);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setShowLocationModal(false);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      // Remember that we've asked
      await AsyncStorage.setItem('locationPermissionAsked', 'true');
      
      if (status === 'granted') {
        // Permission granted, send to WebView
        sendLocationPermissionToWebView(true);
        Alert.alert(
          'Location Access Granted',
          'Thank you! We can now show your location on the map.',
          [{ text: 'OK' }]
        );
      } else {
        // Permission denied
        sendLocationPermissionToWebView(false);
        Alert.alert(
          'Location Access Denied',
          'You can still use the map, but we won\'t be able to show your current location.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setShowLocationModal(false);
    }
  };

  const skipLocationPermission = async () => {
    try {
      setShowLocationModal(false);
      
      // Remember that we've asked
      await AsyncStorage.setItem('locationPermissionAsked', 'true');
      
      // Send denied status to WebView
      sendLocationPermissionToWebView(false);
      
      Alert.alert(
        'Location Access Skipped',
        'You can still use the map, but we won\'t be able to show your current location.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error skipping location permission:', error);
      setShowLocationModal(false);
    }
  };

  const sendLocationPermissionToWebView = (granted) => {
    const message = {
      type: 'locationPermission',
      granted: granted
    };
    sendMessageToWebView(message);
    
    // If permission granted, get user's current location and send to map
    if (granted) {
      getUserCurrentLocation();
    }
  };

  const getUserCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      if (location && webViewRef.current) {
        console.log('GPS button pressed - location obtained:', location.coords);
        
        // Get the user's address from coordinates
        const address = await getUserAddress(location.coords.latitude, location.coords.longitude);
        if (address) {
          setUserAddress(address);
          setShowDebugModal(true);
        }
        
        // Send the user's current location to the WebView
        const message = JSON.stringify({
          type: 'userLocationUpdate',
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          }
        });
        sendMessageToWebView(message);
        
        // Also send a message to center the map on this location
        setTimeout(() => {
          sendMessageToWebView({
            type: 'centerMapOnUserLocation'
          });
        }, 500);
        
        console.log('GPS button pressed - location sent to map:', location.coords);
      } else {
        console.log('GPS button pressed - could not get location');
        // Fallback: just send the center message
        sendMessageToWebView({
          type: 'centerMapOnUserLocation'
        });
      }
    } catch (error) {
      console.error('Error getting user location for GPS button:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
      // Fallback: just send the center message
      sendMessageToWebView({
        type: 'centerMapOnUserLocation'
      });
    }
  };

  const sendDefaultLocationToWebView = () => {
    // Williamsburg, Brooklyn coordinates
    const defaultLocation = {
      latitude: 40.7081,
      longitude: -73.9571
    };
    
    const message = {
      type: 'defaultLocation',
      coordinates: defaultLocation
    };
    sendMessageToWebView(message);
  };

  const getUserAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoidGh1bmRlcnRydWNrIiwiYSI6ImNtZWpjdzdscDBiengya29va3duNHBzbDQifQ.2q8IcDq0Yuk-guEpdyro5g&types=address,poi&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          return {
            fullAddress: feature.place_name,
            street: feature.text,
            city: feature.context?.find(ctx => ctx.id.startsWith('place'))?.text || 'Unknown',
            state: feature.context?.find(ctx => ctx.id.startsWith('region'))?.text || 'Unknown',
            country: feature.context?.find(ctx => ctx.id.startsWith('country'))?.text || 'Unknown',
            coordinates: { latitude, longitude }
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  };

  const sendMessageToWebView = (message, retryCount = 0) => {
    if (!webViewRef.current) {
      console.log('WebView not ready, retrying...', retryCount);
      if (retryCount < 3) {
        setTimeout(() => sendMessageToWebView(message, retryCount + 1), 500);
      }
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      webViewRef.current.postMessage(messageString);
      console.log('Message sent to WebView:', message);
      return true;
    } catch (error) {
      console.error('Error sending message to WebView:', error);
      if (retryCount < 3) {
        setTimeout(() => sendMessageToWebView(message, retryCount + 1), 500);
      }
      return false;
    }
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

  const FloatingActionButton = ({ style, children, onPress }) => (
    <TouchableOpacity style={[styles.floatingButton, style]} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );

  const handleGPSButtonPress = async () => {
    try {
      // First, check if we have location permission
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('GPS button pressed - no location permission, requesting...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (newStatus !== 'granted') {
          console.log('GPS button pressed - location permission denied');
          Alert.alert(
            'Location Permission Required',
            'Please enable location access in your device settings to use the GPS feature.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      console.log('GPS button pressed - getting current location...');
      
      // Get the user's current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      if (location && webViewRef.current) {
        console.log('GPS button pressed - location obtained:', location.coords);
        
        // Get the user's address from coordinates
        const address = await getUserAddress(location.coords.latitude, location.coords.longitude);
        if (address) {
          setUserAddress(address);
          setShowDebugModal(true);
        }
        
        // Send the user's current location to the WebView
        const message = JSON.stringify({
          type: 'userLocationUpdate',
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          }
        });
        sendMessageToWebView(message);
        
        // Also send a message to center the map on this location
        setTimeout(() => {
          sendMessageToWebView({
            type: 'centerMapOnUserLocation'
          });
        }, 500);
        
        console.log('GPS button pressed - location sent to map:', location.coords);
      } else {
        console.log('GPS button pressed - could not get location');
        // Fallback: just send the center message
        sendMessageToWebView({
          type: 'centerMapOnUserLocation'
        });
      }
    } catch (error) {
      console.error('Error getting user location for GPS button:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
      // Fallback: just send the center message
      sendMessageToWebView({
        type: 'centerMapOnUserLocation'
      });
    }
  };

  const BottomNavigation = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M16 28.0001L14.0667 26.2668C11.8222 24.2446 9.96669 22.5001 8.50002 21.0334C7.03335 19.5668 5.86669 18.2499 5.00002 17.0828C4.13335 15.9166 3.52802 14.8446 3.18402 13.8668C2.84002 12.889 2.66758 11.889 2.66669 10.8668C2.66669 8.77789 3.36669 7.03345 4.76669 5.63345C6.16669 4.23345 7.91113 3.53345 10 3.53345C11.1556 3.53345 12.2556 3.77789 13.3 4.26678C14.3445 4.75567 15.2445 5.44456 16 6.33345C16.7556 5.44456 17.6556 4.75567 18.7 4.26678C19.7445 3.77789 20.8445 3.53345 22 3.53345C24.0889 3.53345 25.8334 4.23345 27.2334 5.63345C28.6334 7.03345 29.3334 8.77789 29.3334 10.8668C29.3334 11.889 29.1614 12.889 28.8174 13.8668C28.4734 14.8446 27.8676 15.9166 27 17.0828C26.1334 18.2499 24.9667 19.5668 23.5 21.0334C22.0334 22.5001 20.1778 24.2446 17.9334 26.2668L16 28.0001ZM16 24.4001C18.1334 22.489 19.8889 20.8503 21.2667 19.4841C22.6445 18.1179 23.7334 16.929 24.5334 15.9174C25.3334 14.9059 25.8889 14.0054 26.2 13.2161C26.5111 12.4268 26.6667 11.6437 26.6667 10.8668C26.6667 9.53345 26.2222 8.42234 25.3334 7.53345C24.4445 6.64456 23.3334 6.20011 22 6.20011C20.9556 6.20011 19.9889 6.49434 19.1 7.08278C18.2111 7.67122 17.6 8.42145 17.2667 9.33345H14.7334C14.4 8.42234 13.7889 7.67256 12.9 7.08411C12.0111 6.49567 11.0445 6.201 10 6.20011C8.66669 6.20011 7.55558 6.64456 6.66669 7.53345C5.7778 8.42234 5.33335 9.53409 5.33335 10.8668C5.33335 11.6446 5.48891 12.4281 5.80002 13.2174C6.11113 14.0068 6.66669 14.9068 7.46669 15.9174C8.26669 16.9281 9.35558 18.117 10.7334 19.4841C12.1111 20.8512 13.8667 22.4899 16 24.4001Z" fill="#fecd15"/>
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
      
      {/* Map Area */}
      <View style={styles.mapContainer}>
        {/* WebView Ready Indicator */}
        {!webViewReady && (
          <View style={styles.webViewLoadingIndicator}>
            <Text style={styles.webViewLoadingText}>Loading Map...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ThunderTruck Map</title>
    <script src='https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css' rel='stylesheet' />
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map { 
            position: absolute; 
            top: 0; 
            bottom: 0; 
            width: 100%; 
            height: 100%;
            /* Ensure touch gestures work properly */
            touch-action: manipulation;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        .mapboxgl-ctrl-top-right {
            display: none;
        }
        .mapboxgl-ctrl-bottom-left {
            display: none;
        }
        .mapboxgl-ctrl-bottom-right {
            display: none;
        }
        .restaurant-marker {
            background-color: #fecd15;
            border: 2px solid #2D1E2F;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: #2D1E2F;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .restaurant-marker.large {
            width: 30px;
            height: 30px;
            font-size: 14px;
        }
        .restaurant-popup {
            background: white;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid #e0e0e0;
            max-width: 200px;
        }
        .restaurant-popup h3 {
            margin: 0 0 8px 0;
            color: #2D1E2F;
            font-size: 16px;
            font-weight: 600;
        }
        .restaurant-popup p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        .rating {
            color: #fecd15;
            font-weight: bold;
        }
        .user-location-marker {
            background-color: #4285f4;
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
            /* Ensure proper positioning */
            position: relative;
            transform: translate(-50%, -50%);
            z-index: 1000;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Send immediate message to React Native
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug',
                message: 'HTML loaded, script started'
            }));
        }
        // Debug function to send messages to React Native
        function debugLog(message) {
            console.log('🐛 WebView Debug:', message);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    message: message
                }));
            }
        }
        
        // Send initial debug message
        debugLog('WebView script started');
        
        // Test basic WebView functionality
        setTimeout(() => {
            debugLog('5 second test - WebView is working');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'webViewReady',
                    message: 'Basic WebView functionality confirmed'
                }));
            }
        }, 5000);
        
        // Mapbox configuration
        const MAPBOX_TOKEN = 'pk.eyJ1IjoidGh1bmRlcnRydWNrIiwiYSI6ImNtZWpjdzdscDBiengya29va3duNHBzbDQifQ.2q8IcDq0Yuk-guEpdyro5g';
        
        debugLog('Setting Mapbox token');
        
        // Check if Mapbox is available
        if (typeof mapboxgl === 'undefined') {
            debugLog('ERROR: Mapbox GL JS not loaded');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapError',
                    error: 'Mapbox GL JS library not loaded'
                }));
            }
        } else {
            debugLog('Mapbox GL JS loaded successfully');
            // Set the access token
            mapboxgl.accessToken = MAPBOX_TOKEN;
            debugLog('Mapbox token set');
        }
        
        // Default location (Williamsburg, Brooklyn)
        let defaultLocation = [-73.9571, 40.7081]; // [longitude, latitude]
        let currentUserLocation = null;
        let map = null;
        
        // Initialize the map
        function initializeMap(centerCoordinates = defaultLocation) {
            try {
                debugLog('Initializing map...');
                
                if (typeof mapboxgl === 'undefined') {
                    throw new Error('Mapbox GL JS not available');
                }
                
                debugLog('Creating map instance');
                map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: centerCoordinates,
                    zoom: 15,
                    attributionControl: false,
                    logoPosition: 'bottom-right',
                    // Enable pinch-based zooming and touch interactions
                    interactive: true,
                    scrollZoom: true,
                    dragPan: true,
                    dragRotate: true,
                    keyboard: true,
                    doubleClickZoom: true,
                    touchZoomRotate: true
                });
                
                debugLog('Map instance created, adding event listeners');
                
                // Add event listeners first (before adding markers/controls)
                addMapEventListeners();
                
                debugLog('Map initialization complete');
            } catch (error) {
                debugLog('ERROR initializing map: ' + error.message);
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: error.message
                    }));
                }
            }
        }
        
        // Initialize map with default location after a short delay to ensure DOM is ready
        setTimeout(() => {
            debugLog('DOM ready, initializing map');
            initializeMap();
        }, 100);
        
        // Fallback: If map doesn't load within 10 seconds, send ready signal anyway
        setTimeout(() => {
            if (!map || !map.loaded()) {
                debugLog('Map failed to load within 10 seconds, sending fallback ready signal');
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'webViewReady',
                        message: 'WebView ready (fallback)'
                    }));
                }
            }
        }, 10000);
        
        // Restaurant data around Williamsburg, Brooklyn
        const restaurants = [
            {
                id: 1,
                name: "L'Artusi",
                rating: "4.8★",
                coordinates: [-73.9591, 40.7091],
                description: "Modern Italian cuisine in a chic setting"
            },
            {
                id: 2,
                name: "Peter Luger Steak House",
                rating: "4.3★",
                coordinates: [-73.9551, 40.7071],
                description: "Legendary steakhouse since 1887"
            },
            {
                id: 3,
                name: "Tacos El Bronco",
                rating: "4.0★",
                coordinates: [-73.9581, 40.7061],
                description: "Authentic Mexican street food"
            }
        ];
        
        // Add restaurant markers
        function addRestaurantMarkers() {
            restaurants.forEach((restaurant, index) => {
                // Create marker element
                const markerEl = document.createElement('div');
                markerEl.className = \`restaurant-marker \${index === 0 ? 'large' : ''}\`;
                markerEl.innerHTML = restaurant.rating.charAt(0);
                
                // Create popup
                const popup = new mapboxgl.Popup({
                    offset: 25,
                    closeButton: false,
                    className: 'restaurant-popup'
                }).setHTML(\`
                    <h3>\${restaurant.name}</h3>
                    <p class="rating">\${restaurant.rating}</p>
                    <p>\${restaurant.description}</p>
                \`);
                
                // Add marker to map
                new mapboxgl.Marker(markerEl)
                    .setLngLat(restaurant.coordinates)
                    .setPopup(popup)
                    .addTo(map);
            });
        }
        
        // Add map controls
        function addMapControls() {
            // Add user location control
            map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            }));
            
            // Add navigation control
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Add scale control
            map.addControl(new mapboxgl.ScaleControl({
                maxWidth: 80,
                unit: 'metric'
            }), 'bottom-left');
        }
        
                // Add map event listeners
        function addMapEventListeners() {
            debugLog('Adding map event listeners');
            
            // Handle map load
            map.on('load', () => {
                debugLog('Map load event fired');
                console.log('Map loaded successfully');
                
                // Add restaurant markers and controls after map loads
                try {
                    addRestaurantMarkers();
                    addMapControls();
                    debugLog('Markers and controls added');
                } catch (error) {
                    debugLog('Error adding markers/controls: ' + error.message);
                }
                
                // Send message to React Native that map is ready
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapLoaded',
                        message: 'Mapbox map is ready'
                    }));
                    debugLog('Map loaded message sent to React Native');
                }
            });
            
            // Handle map errors
            map.on('error', (e) => {
                console.error('Map error:', e);
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: e.error.message
                    }));
                }
            });
            
            // Handle marker clicks
            map.on('click', (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: []
                });
                
                if (features.length === 0) {
                    // Send click coordinates to React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'mapClick',
                            coordinates: e.lngLat
                        }));
                    }
                }
            });
            
            // Handle user location updates
            map.on('geolocate', (e) => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'userLocation',
                        coordinates: e.coords
                    }));
                }
            });
        }

        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'locationPermission') {
              if (data.granted) {
                // Enable location features
                console.log('Location permission granted, enabling location features');
                // The geolocate control will automatically request location
              } else {
                // Disable location features
                console.log('Location permission denied, location features disabled');
                // Remove or disable location-related controls if needed
              }
            } else if (data.type === 'userLocationUpdate') {
              // Update map to user's current location
              console.log('Updating map to user location:', data.coordinates);
              currentUserLocation = [data.coordinates.longitude, data.coordinates.latitude];
              
              // Fly to user's location
              map.flyTo({
                center: currentUserLocation,
                zoom: 16,
                duration: 2000
              });
              
              // Add user location marker
              addUserLocationMarker(currentUserLocation);
              
              // Send confirmation back to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'userLocationMarkerAdded',
                  coordinates: currentUserLocation
                }));
              }
              
            } else if (data.type === 'defaultLocation') {
              // Set map to default location (Williamsburg)
              console.log('Setting map to default location (Williamsburg):', data.coordinates);
              const defaultCoords = [data.coordinates.longitude, data.coordinates.latitude];
              
              map.flyTo({
                center: defaultCoords,
                zoom: 15,
                duration: 2000
              });
            } else if (data.type === 'centerMapOnUserLocation') {
              // GPS button pressed - center map on user's current location
              console.log('GPS button pressed - centering map on user location');
              
              if (currentUserLocation) {
                // If we have user location, fly to it
                map.flyTo({
                  center: currentUserLocation,
                  zoom: 16,
                  duration: 1500
                });
                
                // Ensure user location marker is visible
                if (window.userLocationMarker) {
                  window.userLocationMarker.remove();
                }
                addUserLocationMarker(currentUserLocation);
              } else {
                // If no user location, try to get it
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const userCoords = [position.coords.longitude, position.coords.latitude];
                      currentUserLocation = userCoords;
                      
                      map.flyTo({
                        center: userCoords,
                        zoom: 16,
                        duration: 1500
                      });
                      
                      addUserLocationMarker(userCoords);
                    },
                    (error) => {
                      console.error('Error getting current location:', error);
                      // Fall back to default location
                      map.flyTo({
                        center: defaultLocation,
                        zoom: 15,
                        duration: 1500
                      });
                    }
                  );
                } else {
                  // Fall back to default location
                  map.flyTo({
                    center: defaultLocation,
                    zoom: 15,
                    duration: 1500
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error parsing message from React Native:', error);
          }
        });
        
        // Add user location marker
        function addUserLocationMarker(coordinates) {
          // Remove existing user marker if any
          if (window.userLocationMarker) {
            window.userLocationMarker.remove();
          }
          
          // Create user location marker
          const userMarker = document.createElement('div');
          userMarker.className = 'user-location-marker';
          userMarker.innerHTML = '📍';
          
          // Add marker to map with proper offset for alignment
          window.userLocationMarker = new mapboxgl.Marker({
            element: userMarker,
            anchor: 'center' // Center the marker on the coordinates
          })
            .setLngLat(coordinates)
            .addTo(map);
            
          console.log('User location marker added at:', coordinates);
        }
      </script>
    </body>
    </html>
          ` }}
          style={styles.mapImage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
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
                case 'userLocationUpdate':
                  console.log('🔄 User location update received:', data.coordinates);
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
        
        {/* User location indicator */}
        <View style={styles.userLocationIndicator}>
          <View style={styles.userLocationOuter}>
            <View style={styles.userLocationInner} />
          </View>
        </View>
      </View>
      
      {/* View List Button */}
      <TouchableOpacity style={styles.viewListButton}>
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path d="M4 13C4.55 13 5 12.55 5 12C5 11.45 4.55 11 4 11C3.45 11 3 11.45 3 12C3 12.55 3.45 13 4 13ZM4 17C4.55 17 5 16.55 5 16C5 15.45 4.55 15 4 15C3.45 15 3 15.45 3 16C3 16.55 3.45 17 4 17ZM4 9C4.55 9 5 8.55 5 8C5 7.45 4.55 7 4 7C3.45 7 3 7.45 3 8C3 8.55 3.45 9 4 9ZM8 13H20C20.55 13 21 12.55 21 12C21 11.45 20.55 11 20 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13ZM8 17H20C20.55 17 21 16.55 21 16C21 15.45 20.55 15 20 15H8C7.45 15 7 15.45 7 16C7 16.55 7.45 17 8 17ZM7 8C7 8.55 7.45 9 8 9H20C20.55 9 21 8.55 21 8C21 7.45 20.55 7 20 7H8C7.45 7 7 7.45 7 8Z" fill="red"/>
        </Svg>
        <Text style={styles.viewListText}>View List</Text>
      </TouchableOpacity>
      
      {/* Target/GPS Button */}
      <FloatingActionButton style={styles.targetButton} onPress={handleGPSButtonPress}>
        <Svg width="36" height="36" viewBox="0 0 36 36">
          <Path d="M29.907 19.5C29.5731 22.1436 28.3693 24.601 26.4851 26.4851C24.601 28.3693 22.1436 29.5731 19.5 29.907V33H16.5V29.907C13.8564 29.5731 11.399 28.3693 9.51485 26.4851C7.6307 24.601 6.42688 22.1436 6.093 19.5H3V16.5H6.093C6.42688 13.8564 7.6307 11.399 9.51485 9.51485C11.399 7.6307 13.8564 6.42688 16.5 6.093V3H19.5V6.093C22.1436 6.42688 24.601 7.6307 26.4851 9.51485C28.3693 11.399 29.5731 13.8564 29.907 16.5H33V19.5H29.907ZM18 27C20.3869 27 22.6761 26.0518 24.364 24.364C26.0518 22.6761 27 20.3869 27 18C27 15.6131 26.0518 13.3239 24.364 11.636C22.6761 9.94821 20.3869 9 18 9C15.6131 9 13.3239 9.94821 11.636 11.636C9.94821 13.3239 9 15.6131 9 18C9 20.3869 9.94821 22.6761 11.636 24.364C13.3239 26.0518 15.6131 27 18 27ZM18 22.5C19.1935 22.5 20.3381 22.0259 21.182 21.182C22.0259 20.3381 22.5 19.1935 22.5 18C22.5 16.8065 22.0259 15.6619 21.182 14.818C20.3381 13.9741 19.1935 13.5 18 13.5C16.8065 13.5 15.6619 13.9741 14.818 14.818C13.9741 15.6619 13.5 16.8065 13.5 18C13.5 19.1935 13.9741 20.3381 14.818 21.182C15.6619 22.0259 16.8065 22.5 18 22.5Z" fill="#E6521F"/>
        </Svg>
      </FloatingActionButton>
      
      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Location Permission Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={skipLocationPermission}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Svg width="48" height="48" viewBox="0 0 48 48" style={styles.locationIcon}>
                <Path d="M24 3C16.268 3 10 9.268 10 17C10 28.5 24 45 24 45C24 45 38 28.5 38 17C38 9.268 31.732 3 24 3ZM24 22C21.791 22 20 20.209 20 18C20 15.791 21.791 14 24 14C26.209 14 28 15.791 28 18C28 20.209 26.209 22 24 22Z" fill="#fecd15"/>
              </Svg>
              <Text style={styles.modalTitle}>Enable Location Services</Text>
              <Text style={styles.modalDescription}>
                Allow ThunderTruck to access your location to show you nearby restaurants and provide better navigation.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.allowButton}
                onPress={requestLocationPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.allowButtonText}>Allow Location Access</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={skipLocationPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Debug Modal - User Address */}
      <Modal
        visible={showDebugModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDebugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Svg width="48" height="48" viewBox="0 0 48 48" style={styles.locationIcon}>
                <Path d="M24 3C16.268 3 10 9.268 10 17C10 28.5 24 45 24 45C24 45 38 28.5 38 17C38 9.268 31.732 3 24 3ZM24 22C21.791 22 20 20.209 20 18C20 15.791 21.791 14 24 14C26.209 14 28 15.791 28 18C28 20.209 26.209 22 24 22Z" fill="#fecd15"/>
              </Svg>
              <Text style={styles.modalTitle}>Your Current Location</Text>
              <Text style={styles.modalDescription}>
                GPS coordinates and address information
              </Text>
            </View>
            
            {userAddress && (
              <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Full Address:</Text>
                  <Text style={styles.addressText}>{userAddress.fullAddress}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Street:</Text>
                  <Text style={styles.addressText}>{userAddress.street}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>City:</Text>
                  <Text style={styles.addressText}>{userAddress.city}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>State:</Text>
                  <Text style={styles.addressText}>{userAddress.state}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Country:</Text>
                  <Text style={styles.addressText}>{userAddress.country}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Coordinates:</Text>
                  <Text style={styles.addressText}>
                    {userAddress.coordinates.latitude.toFixed(6)}, {userAddress.coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDebugModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#000',
    fontFamily: 'Inter',
  },
  micIcon: {
    marginLeft: 5,
  },
  locationBar: {
    height: 45,
    backgroundColor: '#FCE1E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  locationPin: {
    marginRight: 3,
  },
  locationText: {
    flex: 1,
    marginLeft: 3,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Inter',
  },
  locationSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  currentLocationIcon: {
    marginLeft: 10,
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
    bottom: 118,
    right: 27,
    width: 100,
    height: 36,
    borderRadius: 4,
    borderWidth: 0.1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  viewListText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#E6521F',
    fontFamily: 'Poppins',
    marginLeft: 5,
  },
  targetButton: {
    position: 'absolute',
    bottom: 190,
    right: 52,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  bottomNav: {
    height: 50,
    backgroundColor: '#282828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  locationIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Inter',
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  allowButton: {
    backgroundColor: '#fecd15',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  allowButtonText: {
    color: '#282828',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: '#fecd15',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  skipButtonText: {
    color: '#2D1E2F',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  addressContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Inter',
    flex: 0.4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    fontFamily: 'Inter',
    flex: 0.6,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#fecd15',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: '#282828',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
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
});
