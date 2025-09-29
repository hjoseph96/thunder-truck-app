module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        ios: {
          project: 'AirGoogleMaps.xcodeproj',
          sharedLibraries: ['libc++', 'libz'],
          podspecPath: 'react-native-maps.podspec',
        },
      },
    },
  },
};
