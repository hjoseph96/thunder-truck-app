const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add react-native-maps support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
