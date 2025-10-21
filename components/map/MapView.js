/**
 * Platform-agnostic MapView export
 * Automatically exports the correct implementation based on platform
 */

// React Native will automatically pick .native.js for iOS/Android
// and .web.js for web based on the platform
export * from './MapView.native.js';
