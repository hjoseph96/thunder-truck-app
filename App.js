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
import OrderBreakdownView from './components/OrderBreakdownView';

import { toastConfig } from './config/toast-config';
import { isAuthenticated } from './lib/token-manager';

const Stack = createStackNavigator();

// Helper function to get page title based on route
const getPageTitle = (routeName, params = {}) => {
  const titles = {
    LandingPage: 'Welcome',
    SignIn: 'Log In',
    SignUp: 'Sign Up',
    ExplorerHome: '',
    MapPage: 'Discover',
    FoodTypeViewer: params?.foodTypeName || 'Food Types',
    FoodTruckViewer: params?.foodTruckName || 'Food Truck',
    MenuItemViewer: params?.foodTruckName ? `${params.foodTruckName}'s Menu` : 'Menu',
    CheckoutForm: 'Cart',
    PaymentScreen: 'Payment',
    AddAddressForm: 'Add Address',
    UserAddressList: 'Addresses',
    EditUserName: 'Edit Name',
    EditUserPhoneNumber: 'Edit Phone',
    EditUserEmail: 'Edit Email',
    EditUserSpokenLanguages: 'Languages',
    PaymentMethodManager: 'Payment Methods',
    OrderIndex: 'Orders',
    OrderDetail: 'Track Order',
    MarkdownViewer: 'Document',
    VerifyOTP: 'Verify',
  };

  const pageTitle = titles[routeName] || '';
  return pageTitle ? `ThunderTruck | ${pageTitle}` : 'ThunderTruck';
};

// Update document title on web
const updateDocumentTitle = (routeName, params) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.title = getPageTitle(routeName, params);
  }
};

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
          console.log('✅ User authenticated - setting initial route to ExplorerHome');
          setInitialRoute('ExplorerHome');
        } else {
          // No token found, show LandingPage
          console.log('❌ User not authenticated - setting initial route to LandingPage');
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

    // On web, listen for localStorage changes (e.g., when user clears storage)
    // Note: storage event only fires for changes in OTHER tabs
    // For same-tab changes, we rely on proper logout flow using clearAuthData()
    if (Platform.OS === 'web') {
      const handleStorageChange = async (e) => {
        // Check if token was removed in another tab
        if (e.key === 'thunder_truck_jwt_token' && !e.newValue) {
          console.log('Token removed from localStorage (other tab), reloading page');
          window.location.reload();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  // Inject Google Fonts and Global CSS for web platform
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

      // Inject global CSS for scrolling
      const styleId = 'thundertruck-global-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Global scrolling for React Native Web */
          body {
            overflow-y: scroll;
          }
          
          #root {
            overflow-y: scroll !important;
          }
          
          /* Make all flex containers scrollable */
          .r-flex-13awgt0 {
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          
          /* Target React Native Web view containers */
          .css-view-g5y9jx {
          }
          
          /* Nested containers */
          #root > div,
          #root > div > div {
            height: 100%;
            overflow-y: scroll;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Data attribute scroll containers */
          [data-scroll-container] {
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
        `;
        document.head.appendChild(style);
      }

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
    
    // Set initial page title on web
    if (navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      if (currentRoute) {
        updateDocumentTitle(currentRoute.name, currentRoute.params);
      }
    }
  };

  // Handle navigation state changes to update document title
  const onNavigationStateChange = () => {
    if (Platform.OS === 'web' && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      if (currentRoute) {
        updateDocumentTitle(currentRoute.name, currentRoute.params);
      }
    }
  };

  // Deep linking configuration for web URLs
  // Enables proper URL routing with browser history and deep links
  // Note: We check authentication state to determine if root should go to ExplorerHome or LandingPage
  const linking = Platform.OS === 'web' ? {
    prefixes: ['https://web.thundertruck.app', 'http://localhost:8081', 'http://localhost:19006'],
    config: {
      screens: {
        LandingPage: '',  // Root path for unauthenticated users
        SignIn: 'signin',
        SignUp: 'signup',
        VerifyOTP: 'verify',
        MarkdownViewer: 'document/:documentType',
        ExplorerHome: 'home',  // Changed from '' to 'home' to avoid conflict
        MapPage: 'map',
        FoodTypeViewer: 'food-types/:foodTypeId',
        FoodTruckViewer: 'vendor/:foodTruckId',
        MenuItemViewer: 'vendor/:foodTruckId/item/:menuItemId',
        CheckoutForm: 'cart',
        PaymentScreen: 'cart/pay',
        AddAddressForm: 'address/add',
        UserAddressList: 'addresses',
        EditUserName: 'profile/name',
        EditUserPhoneNumber: 'profile/phone',
        EditUserEmail: 'profile/email',
        EditUserSpokenLanguages: 'profile/languages',
        PaymentMethodManager: 'profile/payment-methods',
        OrderIndex: 'orders',
        OrderBreakdownView: 'orders/breakdown',
        OrderDetail: 'track/:orderId',
      },
    },
  } : undefined;

  // Display loading indicator while checking auth or loading fonts
  // 1. First, check authentication status
  // 2. Then wait for fonts to load
  // Mobile: Wait for Cairo fonts to load via expo-font (with 3s timeout fallback)
  // Web: Wait for Google Fonts CSS to load and apply (with 2s timeout fallback)
  const fontsAreReady = Platform.OS === 'web' ? webFontsReady : mobileFontsReady;
  
  console.log('App render state:', {
    isCheckingAuth,
    fontsAreReady,
    initialRoute,
    webFontsReady,
    mobileFontsReady
  });
  
  if (isCheckingAuth || !fontsAreReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#fecd15" />
      </View>
    );
  }

  console.log('🚀 Rendering NavigationContainer with initialRoute:', initialRoute);

  return (
    <StripeProviderWrapper>
      <NavigationContainer 
        ref={navigationRef} 
        onReady={onReady}
        onStateChange={onNavigationStateChange}
        linking={linking}
        fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
          <ActivityIndicator size="large" color="#fecd15" />
        </View>}
      >
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
              title: 'Document',
            }}
          />
          <Stack.Screen
            name="VerifyOTP"
            component={VerifyOTP}
            options={{
              title: 'Verify',
            }}
          />
          <Stack.Screen
            name="ExplorerHome"
            component={ExplorerHome}
            options={{
              title: 'ThunderTruck',
            }}
          />
          <Stack.Screen
            name="MapPage"
            component={MapPage}
            options={{
              title: 'Discover',
            }}
          />
          <Stack.Screen
            name="FoodTypeViewer"
            component={FoodTypeViewer}
            options={{
              title: 'Food Types',
            }}
          />
          <Stack.Screen
            name="FoodTruckViewer"
            component={FoodTruckViewer}
            options={{
              title: 'Food Truck',
            }}
          />
          <Stack.Screen
            name="MenuItemViewer"
            component={MenuItemViewer}
            options={{
              title: 'Menu',
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
              title: 'Cart',
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
            name="OrderBreakdownView"
            component={OrderBreakdownView}
            options={{
              title: 'Order Breakdown',
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
