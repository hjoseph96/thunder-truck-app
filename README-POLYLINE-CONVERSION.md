# Polyline to GeoJSON Conversion Utility

This utility converts Google Directions API encoded polyline strings to GeoJSON format and provides additional route analysis functions.

## 🚀 Installation

The required dependencies are already installed:

```bash
npm install @mapbox/polyline
```

## 📁 Files

- **`polyline-to-geojson.js`** - Main utility module with conversion functions
- **`example-usage.js`** - Examples showing how to use the utility
- **`README-POLYLINE-CONVERSION.md`** - This documentation file

## 🔧 API Reference

### `polylineToGeoJSON(encodedPolyline, options)`

Converts an encoded polyline string to a GeoJSON Feature object.

**Parameters:**
- `encodedPolyline` (string): The encoded polyline string from Google Directions API
- `options` (object, optional): Configuration options
  - `name` (string): Name for the route (default: "Route")
  - `description` (string): Description for the route (default: "Decoded polyline route")

**Returns:** GeoJSON Feature object with LineString geometry

**Example:**
```javascript
const { polylineToGeoJSON } = require('./polyline-to-geojson');

const geoJson = polylineToGeoJSON(encodedPolyline, {
  name: "My Route",
  description: "Route from home to work"
});
```

### `polylineToCoordinates(encodedPolyline)`

Converts an encoded polyline string to an array of coordinate pairs.

**Parameters:**
- `encodedPolyline` (string): The encoded polyline string from Google Directions API

**Returns:** Array of coordinate pairs `[longitude, latitude]`

**Example:**
```javascript
const { polylineToCoordinates } = require('./polyline-to-geojson');

const coordinates = polylineToCoordinates(encodedPolyline);
// Returns: [[-73.75724, 40.65792], [-73.75661, 40.65891], ...]
```

### `getRouteStats(encodedPolyline)`

Gets statistics about a route from an encoded polyline.

**Parameters:**
- `encodedPolyline` (string): The encoded polyline string from Google Directions API

**Returns:** Object containing route statistics
- `coordinateCount`: Number of coordinates in the route
- `startCoordinates`: Object with `longitude` and `latitude`
- `endCoordinates`: Object with `longitude` and `latitude`
- `approximateDistance`: Rough distance estimate in kilometers

**Example:**
```javascript
const { getRouteStats } = require('./polyline-to-geojson');

const stats = getRouteStats(encodedPolyline);
console.log(`Route has ${stats.coordinateCount} coordinates`);
console.log(`Distance: ${stats.approximateDistance.toFixed(2)} km`);
```

## 📊 Output Format

### GeoJSON Feature Structure

```json
{
  "type": "Feature",
  "properties": {
    "name": "Route Name",
    "description": "Route Description",
    "coordinateCount": 251
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [longitude1, latitude1],
      [longitude2, latitude2],
      ...
    ]
  }
}
```

### Coordinates Format

Coordinates are returned as `[longitude, latitude]` pairs (following GeoJSON standard):
- **Longitude**: X coordinate (-180 to +180)
- **Latitude**: Y coordinate (-90 to +90)

## 🧪 Testing

Run the example usage file to see the utility in action:

```bash
node example-usage.js
```

Or test with your own polyline:

```bash
node polyline-to-geojson.js
```

## 🔍 Example Results

For the sample polyline provided, the utility successfully:

- **Decoded 251 coordinate pairs** from the encoded string
- **Route spans approximately 22.52 km** (straight-line distance)
- **Start coordinates**: [40.65792, -73.75724] (Queens, NY area)
- **End coordinates**: [40.63278, -73.9586] (Brooklyn, NY area)

## 🚨 Error Handling

All functions include proper error handling and will throw descriptive error messages if:

- The polyline string is invalid or corrupted
- The polyline cannot be decoded
- Required parameters are missing

## 💡 Use Cases

This utility is perfect for:

- **Mapping applications** that need to display Google Directions routes
- **Route analysis** and statistics
- **Data conversion** between Google APIs and GeoJSON-compatible systems
- **Web mapping libraries** like Mapbox GL JS, Leaflet, or Google Maps
- **Mobile apps** that need to process route data

## 🔗 Integration with Your App

To use this utility in your ThunderTruck app:

1. **Import the utility:**
```javascript
const { polylineToGeoJSON } = require('./polyline-to-geojson');
```

2. **Convert polyline from Google Directions API:**
```javascript
const routeGeoJson = polylineToGeoJSON(response.routes[0].overview_polyline.points);
```

3. **Use with your mapping components:**
```javascript
// For Mapbox GL JS
map.addSource('route', {
  type: 'geojson',
  data: routeGeoJson
});
```

## 📚 Dependencies

- **`@mapbox/polyline`**: Industry-standard polyline encoding/decoding library
- **Node.js**: For running the utility scripts

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot find module '@mapbox/polyline'"**
   - Run `npm install @mapbox/polyline`

2. **"Invalid polyline string"**
   - Ensure the polyline string is complete and properly encoded
   - Check that it comes from a valid Google Directions API response

3. **Coordinates seem wrong**
   - Remember: coordinates are `[longitude, latitude]` not `[latitude, longitude]`
   - This follows the GeoJSON standard

### Support

For issues specific to this utility, check the error messages and ensure your polyline string is valid. For general polyline encoding questions, refer to the [Google Directions API documentation](https://developers.google.com/maps/documentation/directions/get-directions).
