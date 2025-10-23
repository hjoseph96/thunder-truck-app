import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isAuthenticated } from '../lib/token-manager';

/**
 * ProtectedRoute - Wrapper component that requires authentication
 * Redirects to SignIn if user is not authenticated
 * 
 * @param {React.Component} component - The component to render if authenticated
 * @param {Object} props - Props to pass to the component
 */
const ProtectedRoute = ({ component: Component, ...props }) => {
  const navigation = useNavigation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authed = await isAuthenticated();
      setAuthenticated(authed);
      
      if (!authed) {
        // User not authenticated, redirect to SignIn
        navigation.replace('SignIn', {
          message: 'Please sign in to continue'
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      navigation.replace('SignIn', {
        message: 'Please sign in to continue'
      });
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#fecd15" />
      </View>
    );
  }

  if (!authenticated) {
    return null; // Navigation redirect is happening
  }

  return <Component {...props} />;
};

export default ProtectedRoute;

