# Cairo Font Integration

This document explains how to use the Cairo font family in your React Native app.

## Font Files Added

The following Cairo font files have been added to `assets/fonts/`:

- **Cairo-Regular.ttf** - Regular weight (400)
- **Cairo-Light.ttf** - Light weight (300)
- **Cairo-Medium.ttf** - Medium weight (500)
- **Cairo-Bold.ttf** - Bold weight (700)

## Configuration

The fonts are configured in `app.json` under the `fonts` section:

```json
"fonts": [
  {
    "asset": "./assets/fonts/Cairo-Regular.ttf",
    "family": "Cairo"
  },
  {
    "asset": "./assets/fonts/Cairo-Light.ttf",
    "family": "Cairo",
    "weight": "300"
  },
  {
    "asset": "./assets/fonts/Cairo-Medium.ttf",
    "family": "Cairo",
    "weight": "500"
  },
  {
    "asset": "./assets/fonts/Cairo-Bold.ttf",
    "family": "Cairo",
    "weight": "700"
  }
]
```

## Usage in Components

### Basic Usage

```javascript
const styles = StyleSheet.create({
  title: {
    fontFamily: 'Cairo',
    fontSize: 24,
    fontWeight: '700', // Bold
  },
  subtitle: {
    fontFamily: 'Cairo',
    fontSize: 18,
    fontWeight: '500', // Medium
  },
  body: {
    fontFamily: 'Cairo',
    fontSize: 16,
    fontWeight: '400', // Regular
  },
  caption: {
    fontFamily: 'Cairo',
    fontSize: 14,
    fontWeight: '300', // Light
  },
});
```

### Font Weight Mapping

- `fontWeight: '300'` → Cairo-Light.ttf
- `fontWeight: '400'` → Cairo-Regular.ttf (default)
- `fontWeight: '500'` → Cairo-Medium.ttf
- `fontWeight: '700'` → Cairo-Bold.ttf

### Example Implementation

```javascript
import React from 'react';
import { Text, StyleSheet } from 'react-native';

const MyComponent = () => {
  return (
    <>
      <Text style={styles.heading}>Welcome to ThunderTruck</Text>
      <Text style={styles.subheading}>Delicious food delivery</Text>
      <Text style={styles.body}>Order your favorite meals from local food trucks.</Text>
    </>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontFamily: 'Cairo',
    fontSize: 28,
    fontWeight: '700',
    color: '#2D1E2F',
  },
  subheading: {
    fontFamily: 'Cairo',
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
  },
  body: {
    fontFamily: 'Cairo',
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
    lineHeight: 24,
  },
});

export default MyComponent;
```

## Current Usage in App

The Cairo font is currently used in:

### FoodTruckViewer.jsx
```javascript
foodTruckName: {
  color: 'white',
  fontSize: 28,
  fontFamily: 'Cairo',
  fontWeight: 'bold',
  marginBottom: 5,
},
```

### MenuItemComponent.jsx
```javascript
itemName: {
  fontSize: 18,
  fontWeight: 'bold', // Will use Cairo-Bold.ttf
  color: '#2D1E2F',
  marginBottom: 4,
},
itemPrice: {
  fontSize: 16,
  fontWeight: '300', // Will use Cairo-Light.ttf
  color: 'black',
  marginBottom: 6,
},
```

## Building and Testing

After adding the fonts:

1. **Clear Metro cache**: `npx expo start --clear`
2. **Rebuild the app**: The fonts will be automatically included in your build
3. **Test on device**: Fonts may not display correctly in the Expo Go app - test on a built version

## Troubleshooting

### Font Not Loading
- Ensure font files are in the correct `assets/fonts/` directory
- Check that `app.json` has the correct font configuration
- Clear Metro cache and restart the development server

### Font Weight Issues
- Use numeric values: `'300'`, `'400'`, `'500'`, `'700'`
- Ensure the font weight exists in your font files
- Fallback to `'400'` (Regular) if a specific weight isn't available

### Platform Differences
- iOS and Android handle fonts slightly differently
- Test on both platforms to ensure consistent appearance
- Web builds may require additional CSS configuration

## Font Characteristics

Cairo is a contemporary Arabic typeface family designed for functionality, aesthetics, and legibility. It features:

- **Excellent readability** at various sizes
- **Modern design** that works well in digital interfaces
- **Multiple weights** for design flexibility
- **Arabic script support** (if needed for internationalization)
- **Professional appearance** suitable for food delivery apps

## Performance Considerations

- Font files are bundled with your app, increasing bundle size
- Consider using only the weights you need
- Fonts are loaded once and cached by the system
- No network requests for font loading during app usage
