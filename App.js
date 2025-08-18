import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
