import { clearAuthData } from './token-manager';

// Global session state
let isSessionExpired = false;
let navigationRef = null;

/**
 * Set the navigation reference for session management
 * @param {Object} navigation - React Navigation reference
 */
export const setNavigationRef = (navigation) => {
  navigationRef = navigation;
};

/**
 * Handle session expiration
 * Clears auth data and navigates to SignIn page
 */
export const handleSessionExpiration = async () => {
  try {
    // Prevent multiple calls
    if (isSessionExpired) return;
    isSessionExpired = true;
    
    console.log('Handling session expiration...');
    
    // Clear all stored authentication data
    await clearAuthData();
    
    // Navigate to SignIn page if navigation is available
    if (navigationRef) {
      navigationRef.navigate('SignIn', { 
        message: 'Your session has expired. Please sign in again.' 
      });
    } else {
      console.warn('Navigation not available for session expiration redirect');
    }
    
    // Reset session state after a delay
    setTimeout(() => {
      isSessionExpired = false;
    }, 5000);
    
  } catch (error) {
    console.error('Error handling session expiration:', error);
    isSessionExpired = false;
  }
};

/**
 * Reset session expiration state
 * Useful after successful re-authentication
 */
export const resetSessionExpiration = () => {
  isSessionExpired = false;
};

/**
 * Check if session is currently expired
 * @returns {boolean} True if session is expired
 */
export const isSessionExpiredState = () => {
  return isSessionExpired;
};
