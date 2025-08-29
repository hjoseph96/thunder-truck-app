import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
            title: 'Welcome to ThunderTruck'
          }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{
            title: 'Sign In'
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUp}
          options={{
            title: 'Sign Up'
          }}
        />
        <Stack.Screen
          name="MarkdownViewer"
          component={MarkdownViewer}
          options={{
            title: 'Document Viewer'
          }}
        />
        <Stack.Screen
          name="VerifyOTP"
          component={VerifyOTP}
          options={{
            title: 'Verify OTP'
          }}
        />
        <Stack.Screen
          name="ExplorerHome"
          component={ExplorerHome}
          options={{
            title: 'Explorer Home'
          }}
        />
        <Stack.Screen
          name="MapPage"
          component={MapPage}
          options={{
            title: 'Map'
          }}
        />
        <Stack.Screen
          name="FoodTypeViewer"
          component={FoodTypeViewer}
          options={{
            title: 'Food Type Viewer'
          }}
        />
        <Stack.Screen
          name="FoodTruckViewer"
          component={FoodTruckViewer}
          options={{
            title: 'Food Truck Viewer'
          }}
        />
        <Stack.Screen
          name="MenuItemViewer"
          component={MenuItemViewer}
          options={{
            title: 'Menu Item Viewer'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
