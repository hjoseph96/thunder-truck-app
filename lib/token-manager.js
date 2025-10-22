// Token Manager Utility
// Handles JWT token storage, retrieval, and validation
// Platform-aware: Uses localStorage on web, AsyncStorage on native

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'thunder_truck_jwt_token';
const USER_KEY = 'thunder_truck_user_data';

/**
 * Platform-aware storage abstraction
 * Uses localStorage on web, AsyncStorage on native platforms
 */
const storage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      // Use browser's localStorage for web
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('localStorage.setItem error:', error);
        throw error;
      }
    } else {
      // Use AsyncStorage for native platforms
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key) {
    if (Platform.OS === 'web') {
      // Use browser's localStorage for web
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage.getItem error:', error);
        return null;
      }
    } else {
      // Use AsyncStorage for native platforms
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      // Use browser's localStorage for web
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('localStorage.removeItem error:', error);
        throw error;
      }
    } else {
      // Use AsyncStorage for native platforms
      await AsyncStorage.removeItem(key);
    }
  },
};

/**
 * Store JWT token securely
 * Uses localStorage on web, AsyncStorage on native
 * @param {string} token - JWT token to store
 * @returns {Promise<void>}
 */
export const storeToken = async (token) => {
  try {
    await storage.setItem(TOKEN_KEY, token);
    console.log('JWT token stored successfully');
  } catch (error) {
    console.error('Error storing JWT token:', error);
    throw error;
  }
};

/**
 * Retrieve stored JWT token
 * Uses localStorage on web, AsyncStorage on native
 * @returns {Promise<string|null>} JWT token or null if not found
 */
export const getStoredToken = async () => {
  try {
    const token = await storage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving JWT token:', error);
    return null;
  }
};

/**
 * Remove stored JWT token
 * Uses localStorage on web, AsyncStorage on native
 * @returns {Promise<void>}
 */
export const removeToken = async () => {
  try {
    await storage.removeItem(TOKEN_KEY);
    console.log('JWT token removed successfully');
  } catch (error) {
    console.error('Error removing JWT token:', error);
    throw error;
  }
};

/**
 * Store user data
 * Uses localStorage on web, AsyncStorage on native
 * @param {Object} userData - User object to store
 * @returns {Promise<void>}
 */
export const storeUserData = async (userData) => {
  try {
    await storage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('User data stored successfully');
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieve stored user data
 * Uses localStorage on web, AsyncStorage on native
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getStoredUserData = async () => {
  try {
    const userData = await storage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Remove stored user data
 * Uses localStorage on web, AsyncStorage on native
 * @returns {Promise<void>}
 */
export const removeUserData = async () => {
  try {
    await storage.removeItem(USER_KEY);
    console.log('User data removed successfully');
  } catch (error) {
    console.error('Error removing user data:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if token exists
 */
export const isAuthenticated = async () => {
  const token = await getStoredToken();
  const isAuth = !!token;
  
  // Debug logging for web
  if (Platform.OS === 'web') {
    console.log('isAuthenticated check:', {
      hasToken: isAuth,
      tokenLength: token ? token.length : 0,
      storageValue: typeof localStorage !== 'undefined' ? localStorage.getItem('thunder_truck_jwt_token') : 'N/A'
    });
  }
  
  return isAuth;
};

/**
 * Clear all authentication data
 * @returns {Promise<void>}
 */
export const clearAuthData = async () => {
  try {
    await Promise.all([
      removeToken(),
      removeUserData()
    ]);
    console.log('All authentication data cleared');
  } catch (error) {
    console.error('Error clearing authentication data:', error);
    throw error;
  }
};
