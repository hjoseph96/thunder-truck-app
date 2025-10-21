import React, { useRef, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View, Platform } from 'react-native';
import StripeProviderWrapper from './lib/stripe/StripeProviderWrapper';
import Toast from 'react-native-toast-message';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import MarkdownViewer from './components/MarkdownViewer';
import VerifyOTP from './components/VerifyOTP';
import ExplorerHome from './components/ExplorerHome';
import MapPage from './components/MapPage';
import FoodTypeViewer from './components/FoodTypeViewer';
import FoodTruckViewer from './components/FoodTruckViewer';
import MenuItemViewer from './components/MenuItemViewer';
import { setNavigationRef } from './lib/session-manager';
import PaymentScreen from './components/PaymentScreen';
import CheckoutForm from './components/CheckoutForm';
import AddAddressForm from './components/AddAddressForm';
import UserAddressList from './components/UserAddressList';

import EditUserName from './components/EditUserName';
import EditUserPhoneNumber from './components/EditUserPhoneNumber';
import EditUserEmail from './components/EditUserEmail';
import EditUserSpokenLanguages from './components/EditUserSpokenLanguages';
import PaymentMethodManager from './components/PaymentMethodManager';
import OrderIndexScreen from './components/OrderIndexScreen';
import OrderDetailScreen from './components/OrderDetailScreen';

import { toastConfig } from './config/toast-config';
import { isAuthenticated } from './lib/token-manager';

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef(null);
  const [webFontsReady, setWebFontsReady] = useState(Platform.OS !== 'web');
  const [mobileFontsReady, setMobileFontsReady] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [initialRoute, setInitialRoute] = useState('LandingPage');

  // Load Cairo fonts for mobile platforms only
  // Web platform uses Google Fonts CDN loaded via CSS injection
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web' 
      ? {} 
      : {
          'Cairo': require('./assets/fonts/Cairo-Regular.ttf'),
          'Cairo-Light': require('./assets/fonts/Cairo-Light.ttf'),
          'Cairo-Medium': require('./assets/fonts/Cairo-Medium.ttf'),
          'Cairo-Bold': require('./assets/fonts/Cairo-Bold.ttf'),
        }
  );

  // Fallback timeout for mobile fonts - if fonts don't load within 3 seconds, render anyway
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (fontsLoaded) {
        setMobileFontsReady(true);
      } else {
        const timeoutId = setTimeout(() => {
          console.warn('Mobile fonts timeout - rendering with system fonts');
          setMobileFontsReady(true);
        }, 3000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [fontsLoaded]);

  // Check for existing authentication on app startup
  // This enables auto-login for users with stored JWT tokens
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        console.log('Auth check on startup:', authenticated);
        
        if (authenticated) {
          // User has valid token, go directly to ExplorerHome
          setInitialRoute('ExplorerHome');
        } else {
          // No token found, show LandingPage
          setInitialRoute('LandingPage');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // On error, default to LandingPage
        setInitialRoute('LandingPage');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // Inject Google Fonts for web platform to support Inter and Poppins fonts
  // These fonts are used throughout the app but don't exist in assets folder
  // Cairo fonts are also loaded from Google Fonts on web to avoid TTF decoding issues
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Create link element for Google Fonts preconnect (performance optimization)
      const preconnectLink = document.createElement('link');
      preconnectLink.rel = 'preconnect';
      preconnectLink.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnectLink);

      const preconnectGstaticLink = document.createElement('link');
      preconnectGstaticLink.rel = 'preconnect';
      preconnectGstaticLink.href = 'https://fonts.gstatic.com';
      preconnectGstaticLink.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectGstaticLink);

      // Load Inter, Poppins, and Cairo fonts from Google Fonts
      // Multiple weights are loaded to match the fontWeight values used in components
      // Cairo is included here to avoid TTF file decoding errors on web
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap';
      fontLink.rel = 'stylesheet';
      
      // Wait for fonts to load before rendering app
      fontLink.onload = () => {
        setWebFontsReady(true);
      };
      
      // Fallback: if font loading takes too long, render anyway after 2 seconds
      const timeoutId = setTimeout(() => {
        setWebFontsReady(true);
      }, 2000);
      
      document.head.appendChild(fontLink);

      return () => {
        // Cleanup font links and timeout when component unmounts
        clearTimeout(timeoutId);
        if (preconnectLink.parentNode) {
          document.head.removeChild(preconnectLink);
        }
        if (preconnectGstaticLink.parentNode) {
          document.head.removeChild(preconnectGstaticLink);
        }
        if (fontLink.parentNode) {
          document.head.removeChild(fontLink);
        }
      };
    }
  }, []);

  const onReady = () => {
    // Set the navigation reference for session management
    setNavigationRef(navigationRef.current);
  };

  // Display loading indicator while checking auth or loading fonts
  // 1. First, check authentication status
  // 2. Then wait for fonts to load
  // Mobile: Wait for Cairo fonts to load via expo-font (with 3s timeout fallback)
  // Web: Wait for Google Fonts CSS to load and apply (with 2s timeout fallback)
  const fontsAreReady = Platform.OS === 'web' ? webFontsReady : mobileFontsReady;
  
  if (isCheckingAuth || !fontsAreReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#fecd15" />
      </View>
    );
  }

  return (
    <StripeProviderWrapper>
      <NavigationContainer ref={navigationRef} onReady={onReady}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="LandingPage"
            component={LandingPage}
            options={{
              title: 'Welcome to ThunderTruck',
            }}
          />
          <Stack.Screen
            name="SignIn"
            component={SignIn}
            options={{
              title: 'Sign In',
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUp}
            options={{
              title: 'Sign Up',
            }}
          />
          <Stack.Screen
            name="MarkdownViewer"
            component={MarkdownViewer}
            options={{
              title: 'Document Viewer',
            }}
          />
          <Stack.Screen
            name="VerifyOTP"
            component={VerifyOTP}
            options={{
              title: 'Verify OTP',
            }}
          />
          <Stack.Screen
            name="ExplorerHome"
            component={ExplorerHome}
            options={{
              title: 'Explorer Home',
            }}
          />
          <Stack.Screen
            name="MapPage"
            component={MapPage}
            options={{
              title: 'Map',
            }}
          />
          <Stack.Screen
            name="FoodTypeViewer"
            component={FoodTypeViewer}
            options={{
              title: 'Food Type Viewer',
            }}
          />
          <Stack.Screen
            name="FoodTruckViewer"
            component={FoodTruckViewer}
            options={{
              title: 'Food Truck Viewer',
            }}
          />
          <Stack.Screen
            name="MenuItemViewer"
            component={MenuItemViewer}
            options={{
              title: 'Menu Item Viewer',
            }}
          />
          <Stack.Screen
            name="PaymentScreen"
            component={PaymentScreen}
            options={{
              title: 'Payment',
            }}
          />
          <Stack.Screen
            name="CheckoutForm"
            component={CheckoutForm}
            options={{
              title: 'Checkout',
            }}
          />
          <Stack.Screen
            name="AddAddressForm"
            component={AddAddressForm}
            options={{
              title: 'Add Address',
            }}
          />
          <Stack.Screen
            name="UserAddressList"
            component={UserAddressList}
            options={{
              title: 'Select Address',
            }}
          />

          <Stack.Screen
            name="EditUserName"
            component={EditUserName}
            options={{
              title: 'Your Name',
            }}
          />
          <Stack.Screen
            name="EditUserPhoneNumber"
            component={EditUserPhoneNumber}
            options={{
              title: 'Your Phone Number',
            }}
          />
          <Stack.Screen
            name="EditUserEmail"
            component={EditUserEmail}
            options={{
              title: 'Your Email',
            }}
          />
          <Stack.Screen
            name="EditUserSpokenLanguages"
            component={EditUserSpokenLanguages}
            options={{
              title: 'Your Languages',
            }}
          />
          <Stack.Screen
            name="OrderIndex"
            component={OrderIndexScreen}
            options={{
              title: 'Orders',
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              title: 'Order Details',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </StripeProviderWrapper>
  );
}
