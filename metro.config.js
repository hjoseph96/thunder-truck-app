const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add react-native-maps support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Fix for RCTPackagerConnection issues
config.resolver.alias = {
  'react-native-reanimated': require.resolve('react-native-reanimated'),
};

// Ensure proper Metro configuration for Expo SDK 54
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Fix for ExpoMetroConfig.loadAsync error
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Additional fixes for Expo SDK 54 compatibility
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Ensure proper module resolution
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

module.exports = config;