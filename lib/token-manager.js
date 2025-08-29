// Token Manager Utility
// Handles JWT token storage, retrieval, and validation

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'thunder_truck_jwt_token';
const USER_KEY = 'thunder_truck_user_data';

/**
 * Store JWT token securely
 * @param {string} token - JWT token to store
 * @returns {Promise<void>}
 */
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('JWT token stored successfully');
  } catch (error) {
    console.error('Error storing JWT token:', error);
    throw error;
  }
};

/**
 * Retrieve stored JWT token
 * @returns {Promise<string|null>} JWT token or null if not found
 */
export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving JWT token:', error);
    return null;
  }
};

/**
 * Remove stored JWT token
 * @returns {Promise<void>}
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('JWT token removed successfully');
  } catch (error) {
    console.error('Error removing JWT token:', error);
    throw error;
  }
};

/**
 * Store user data
 * @param {Object} userData - User object to store
 * @returns {Promise<void>}
 */
export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('User data stored successfully');
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieve stored user data
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getStoredUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Remove stored user data
 * @returns {Promise<void>}
 */
export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
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
  return !!token;
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
