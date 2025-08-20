# Mapbox Setup for ThunderTruck App (Expo Go Compatible)

## 🔐 Security Setup

### 1. Configuration Files
- **`config/mapbox-config.js`** - Contains your actual Mapbox token (NOT committed to git)
- **`config/mapbox-config.template.js`** - Template file (safe to commit to git)

### 2. Git Ignore
The actual config file is already added to `.gitignore` to prevent committing sensitive tokens.

## 📱 Installation

The Mapbox library has been implemented using **WebView** for Expo Go compatibility:
```bash
npm install react-native-webview
```

## ⚙️ Configuration Steps

### Step 1: Copy Template
```bash
cp config/mapbox-config.template.js config/mapbox-config.js
```

### Step 2: Add Your Token
Edit `config/mapbox-config.js` and replace:
```javascript
PUBLIC_ACCESS_TOKEN: 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE'
```
with your actual token:
```javascript
PUBLIC_ACCESS_TOKEN: 'pk.eyJ1IjoidGh1bmRlcnRydWNrIiwiYSI6ImNtZWpjdzdscDBiengya29va3duNHBzbDQifQ.2q8IcDq0Yuk-guEpdyro5g'
```

## 🗺️ Map Configuration

### Default Settings
- **Style**: Streets v12 (modern street map)
- **Center**: Noida, India (77.3910, 28.5355)
- **Zoom Level**: 15 (neighborhood level)
- **Features**: User location, compass, scale, attribution

### Customization
You can modify the map settings in `config/mapbox-config.js`:
- Change map style
- Update default center coordinates
- Modify map behavior (zoom, scroll, etc.)

## 🔒 Security Notes

### Public Token Safety
- The provided token is a **public access token**
- Safe to use in client-side code
- Has restricted permissions set by Mapbox
- Cannot be used to access private data or make unauthorized requests

### Production Considerations
For production apps, consider:
- Using environment variables
- Implementing token rotation
- Setting up proper token scoping in Mapbox dashboard

## 🚀 Implementation Details

### WebView Approach
- **Why WebView?** Native Mapbox requires native compilation, incompatible with Expo Go
- **Solution**: Mapbox GL JS loaded in WebView provides full functionality
- **Benefits**: Works with Expo Go, no build required, full Mapbox features

### Location Permission Management
- **Native Permission Modal**: Shows on first visit to MapPage
- **Persistent State**: Uses AsyncStorage to remember user's choice
- **Smart Behavior**: Only shows modal if user hasn't been asked before
- **WebView Integration**: Sends permission status to Mapbox map
- **Dynamic Location Updates**: Map centers on user's location after permission granted
- **Default Fallback**: Williamsburg, Brooklyn as default location if no user location

### Dynamic Location Features
- **User Location Priority**: After permission granted, map centers on user's actual location
- **Default Location**: Williamsburg, Brooklyn (40.7081, -73.9571) as fallback
- **Smooth Transitions**: Map flies to new location with smooth animations
- **User Marker**: Blue pulsing marker shows user's current position
- **Restaurant Markers**: Local restaurants around Williamsburg area
- **Real-time Updates**: Location changes trigger immediate map updates

### Features Implemented
- Interactive map with touch controls (zoom, pan, rotate)
- User location tracking with geolocation
- Custom restaurant markers with popups
- Professional map styling
- Real-time map data from Mapbox
- Native location permission handling
- Dynamic location centering (user location or Williamsburg default)
- Local restaurant data around Williamsburg, Brooklyn

### Communication Bridge
- WebView communicates with React Native via `postMessage`
- Map events (clicks, location updates) sent to React Native
- Error handling and status updates available
- Location permission status sent from React Native to WebView
- User location coordinates sent to WebView for map centering
- Default location fallback sent to WebView

## 📋 Dependencies

- `react-native-webview` - WebView component for React Native
- `expo-location` - Location services and permissions
- `@react-native-async-storage/async-storage` - Persistent storage for user preferences
- **No native Mapbox dependencies** - Pure web implementation
- Compatible with Expo Go and managed workflow
- Includes all necessary map components and utilities

## 🆘 Troubleshooting

### Common Issues
1. **Map not loading**: Check if token is properly set in HTML
2. **WebView errors**: Ensure react-native-webview is properly installed
3. **Location not working**: Check device location permissions and expo-location installation
4. **Permission modal not showing**: Verify AsyncStorage is working properly
5. **Performance issues**: Consider adjusting zoom levels and map features
6. **Location not centering**: Check if location permission was granted and coordinates are being sent

### Expo Go Compatibility
- ✅ **Fully compatible** with Expo Go
- ✅ **No native build required**
- ✅ **All Mapbox features available**
- ✅ **Cross-platform support**
- ✅ **Native location permissions**

### Support
- Mapbox documentation: https://docs.mapbox.com/
- React Native WebView: https://github.com/react-native-webview/react-native-webview
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
- ThunderTruck team for app-specific issues

## 🔄 Migration from Native Mapbox

This app was migrated from native Mapbox to WebView-based implementation:
- **Before**: Native Mapbox (required native build, incompatible with Expo Go)
- **After**: WebView + Mapbox GL JS (works with Expo Go, no build issues)
- **Benefits**: Expo Go compatibility, easier development, same functionality

## 📍 Location Permission Features

### Permission Flow
1. **First Visit**: Modal appears asking for location permission
2. **User Choice**: Allow, Deny, or Skip options
3. **Persistent State**: Choice saved in AsyncStorage
4. **Subsequent Visits**: Modal only shows if permission status changes
5. **WebView Sync**: Permission status sent to Mapbox map
6. **Location Update**: User's actual location sent to map if permission granted

### Permission States
- **Granted**: Full location features enabled, map centers on user location
- **Denied**: Location features disabled, map shows Williamsburg default
- **Skipped**: Location features disabled, map shows Williamsburg default

### User Experience
- **Non-intrusive**: Only shows when necessary
- **Clear Options**: Allow, Deny, or Skip choices
- **Persistent**: Remembers user's choice
- **Informative**: Explains why location is needed
- **Dynamic**: Map automatically updates based on permission status

## 🗺️ Map Features & Locations

### Default Location
- **Williamsburg, Brooklyn**: 40.7081°N, 73.9571°W
- **Zoom Level**: 15 (neighborhood view)
- **Map Style**: Streets v12 (modern appearance)

### Restaurant Markers
- **L'Artusi**: Modern Italian cuisine (4.8★)
- **Peter Luger Steak House**: Legendary steakhouse (4.3★)
- **Tacos El Bronco**: Authentic Mexican street food (4.0★)

### User Location Features
- **Blue Pulsing Marker**: Shows user's current position
- **Smooth Animations**: Map flies to user location with 2-second animation
- **High Accuracy**: Uses device GPS for precise location
- **Real-time Updates**: Location changes trigger immediate map updates
- **GPS Button**: Floating action button to center map on user's current location
- **Touch Gestures**: Full pinch-to-zoom, pan, and rotate support

### Interactive Map Controls
- **Pinch Zoom**: Multi-touch pinch gestures for zooming in/out
- **Pan & Drag**: Touch and drag to move around the map
- **Rotate**: Two-finger rotation gestures
- **Double-tap Zoom**: Double-tap to zoom in
- **GPS Button**: One-tap centering on user's current location
- **Navigation Controls**: Built-in zoom and compass controls

## 🎯 GPS Button Functionality

### GPS Button Features
- **One-Tap Centering**: Instantly centers map on user's current location
- **Smart Location Detection**: Automatically detects and uses user's GPS coordinates
- **Fallback Handling**: Falls back to Williamsburg if location unavailable
- **Smooth Animations**: 1.5-second fly-to animation for smooth user experience
- **User Marker**: Ensures user location marker is visible after centering

### How It Works
1. **User Presses GPS Button**: Floating action button in bottom-right corner
2. **Location Check**: Checks if user location is already known
3. **Smart Centering**: 
   - If location known: Flies to user's coordinates
   - If location unknown: Requests current GPS position
4. **Fallback**: If GPS fails, centers on Williamsburg default
5. **Visual Feedback**: Smooth animation and user marker placement

### Technical Implementation
- **React Native Integration**: Button press sends message to WebView
- **WebView Communication**: Uses postMessage for seamless integration
- **Geolocation API**: Leverages browser's native geolocation
- **Mapbox GL JS**: Smooth fly-to animations and marker management
- **Error Handling**: Graceful fallback to default location