import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
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
import WebSocketTestScreen from './components/WebSocketTestScreen';
import EnhancedCourierDemo from './components/EnhancedCourierDemo';
import EditUserName from './components/EditUserName';
import EditUserPhoneNumber from './components/EditUserPhoneNumber';

import { STRIPE_CONFIG } from './config/stripe-config';
import { toastConfig } from './config/toast-config';

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef(null);

  const onReady = () => {
    // Set the navigation reference for session management
    setNavigationRef(navigationRef.current);
  };

  return (
    <StripeProvider
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
      urlScheme={STRIPE_CONFIG.urlScheme}
    >
      <NavigationContainer ref={navigationRef} onReady={onReady}>
        <Stack.Navigator
          initialRouteName="LandingPage"
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
            name="WebSocketTest"
            component={WebSocketTestScreen}
            options={{
              title: 'WebSocket Test',
            }}
          />
          <Stack.Screen
            name="EnhancedCourierDemo"
            component={EnhancedCourierDemo}
            options={{
              title: 'Enhanced Courier Demo',
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
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </StripeProvider>
  );
}
