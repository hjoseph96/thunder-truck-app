/**
 * Polyline utilities to avoid Babel parsing issues with special characters
 */

// Complex polyline from user's request - stored as character codes to avoid Babel parsing issues
const COMPLEX_POLYLINE_CODES = [
  95, 95, 100, 119, 70, 118, 117, 100, 97, 77, 101, 69, 125, 66, 119, 64, 98, 70, 117, 64, 116, 85, 83, 106, 71, 93, 120, 68, 107, 64, 126, 72, 123, 64, 112, 75, 81, 106, 67, 73, 66, 103, 66, 126, 73, 99, 64, 106, 67, 85, 108, 65, 77, 106, 65, 75, 126, 64, 63, 74, 70, 104, 64, 122, 69, 100, 78, 121, 65, 114, 65, 101, 69, 126, 67, 109, 73, 106, 71, 105, 68, 114, 67, 111, 79, 106, 77, 97, 71, 106, 70, 123, 75, 100, 76, 101, 74, 96, 74, 97, 65, 116, 65, 107, 64, 116, 65, 95, 65, 106, 68, 73, 98, 64, 121, 65, 110, 79, 64, 118, 69, 101, 68, 106, 121, 64, 89, 118, 71, 77, 108, 68, 71, 100, 64, 95, 64, 118, 76, 65, 96, 64, 73, 108, 66, 69, 90, 69, 114, 65, 73, 116, 66, 71, 126, 64, 66, 100, 64, 111, 66, 96, 102, 64, 89, 124, 71, 115, 64, 120, 79, 73, 112, 64, 109, 67, 96, 90, 79, 74, 103, 66, 122, 83, 111, 65, 122, 77, 123, 64, 118, 74, 99, 65, 100, 73, 103, 67, 100, 81, 90, 102, 64, 126, 68, 106, 66, 126, 68, 110, 66, 126, 74, 98, 69, 110, 65, 118, 71, 110, 69, 95, 66, 98, 64, 63, 122, 64, 84, 124, 77, 102, 69, 98, 67, 103, 80, 66, 75, 96, 69, 123, 65, 74, 65, 96, 70, 113, 66, 80, 63, 122, 89, 104, 71, 94, 82, 98, 67, 102, 92, 90, 100, 69, 120, 69, 124, 109, 64, 113, 66, 90, 85, 74, 105, 64, 74, 108, 64, 110, 66, 124, 64, 96, 67, 112, 64, 118, 65, 98, 67, 104, 69, 102, 66, 112, 67, 120, 69, 112, 71, 120, 67, 122, 68, 104, 72, 96, 75, 98, 67, 120, 68, 86, 98, 64, 84, 63, 102, 64, 84, 92, 90, 90, 100, 64, 70, 64, 122, 64, 116, 66, 65, 98, 64, 77, 94, 120, 68, 108, 64, 122, 98, 65, 106, 66, 110, 74, 98, 68, 106, 68, 102, 67, 98, 70, 96, 65, 108, 66, 98, 66, 104, 67, 114, 65, 106, 66, 120, 64, 98, 66, 96, 65, 102, 68, 126, 64, 104, 68, 112, 64, 120, 66, 120, 64, 114, 66, 92, 108, 64, 96, 66, 120, 68, 104, 67, 126, 69, 120, 66, 108, 68, 100, 68, 114, 69, 102, 98, 100, 67, 122, 66, 122, 66, 110, 64, 92, 98, 64, 92, 102, 64, 84, 124, 66, 126, 65, 108, 67, 126, 65, 92, 72, 100, 65, 74, 118, 64, 94, 100, 64, 63, 100, 64, 66, 108, 65, 116, 64, 120, 66, 120, 66, 124, 110, 64, 122, 67, 120, 65, 106, 69, 124, 65, 120, 66, 122, 64, 116, 64, 100, 64, 102, 73, 96, 68, 108, 65, 98, 64, 118, 67, 116, 65, 96, 68, 106, 66, 98, 66, 104, 65, 104, 65, 104, 66, 114, 65, 108, 68, 126, 67, 106, 66, 98, 66, 112, 66, 114, 65, 106, 64, 112, 64, 120, 64, 120, 98, 66, 92, 106, 64, 120, 64, 124, 114, 65, 116, 64, 98, 65, 92, 116, 66, 82, 122, 64, 72, 110, 64, 82, 108, 64, 100, 64, 80, 92, 76, 102, 64, 74, 122, 65, 67, 108, 65, 67, 108, 65, 70, 102, 67, 82, 106, 66, 88, 96, 65, 112, 64, 118, 65, 114, 69, 106, 73, 112, 65, 110, 65, 102, 67, 108, 69, 98, 64, 108, 64, 90, 90, 112, 64, 104, 64, 96, 104, 64, 96, 116, 65, 110, 64, 124, 66, 116, 65, 116, 65, 112, 67, 118, 67, 126, 66, 120, 65, 84, 84, 72, 86, 63, 114, 64, 65, 100, 64, 68, 86, 64, 106, 64, 70, 86, 63, 96, 64, 81, 98, 64, 79, 76, 85, 66, 125, 64, 64, 64, 83, 76, 75, 84, 77, 124, 64, 95, 64, 126, 64, 69, 88, 69, 98, 65, 69, 78, 77, 80, 111, 64, 86, 113, 64, 70, 83, 76, 79, 92, 73, 102, 65, 67, 72, 84, 108, 64, 72, 108, 64, 65, 120, 64, 73, 102, 64, 85, 108, 64, 99, 64, 100, 64, 89, 78, 97, 66, 80, 111, 64, 104, 64, 64, 64, 84, 71, 94, 64, 87, 79, 100, 64, 73, 78, 75, 94, 115, 67, 112, 73, 67, 84, 101, 64, 116, 65, 77, 76, 95, 64, 112, 65, 64, 102, 65, 91, 126, 64, 103, 64, 126, 65, 97, 70, 109, 68, 103, 65, 126, 67, 84, 90, 100, 69, 120, 67, 81, 96, 64, 65, 76, 125, 69, 102, 78, 123, 68, 102, 76, 73, 68, 113, 65, 96, 69, 101, 67, 124, 79, 108, 64, 69, 90, 109, 64, 98, 66, 67, 81, 68, 89, 75, 97, 64, 117, 74, 124, 75, 120, 93, 114, 110, 64, 97, 73, 96, 64, 110, 66, 118, 119, 64, 106, 110, 84, 102, 66, 126, 114, 64, 114, 71, 124, 109, 65, 121, 77, 122, 65, 63, 90, 88, 126, 69, 119, 77, 120, 65, 71, 101, 65
];

// Simple test polyline for basic functionality
const SIMPLE_POLYLINE_CODES = [95, 112, 126, 105, 70, 126, 112, 115, 124, 85, 95, 117, 108, 76, 110, 110, 113, 67, 95, 109, 113, 78, 118, 120, 113, 96, 64];

/**
 * Get the complex polyline string without Babel parsing issues
 * @returns {string} The decoded polyline string
 */
export function getComplexPolyline() {
  return String.fromCharCode(...COMPLEX_POLYLINE_CODES);
}

/**
 * Get the simple test polyline string
 * @returns {string} The simple polyline string
 */
export function getSimplePolyline() {
  return String.fromCharCode(...SIMPLE_POLYLINE_CODES);
}

/**
 * Convert a polyline string to GeoJSON coordinates
 * @param {string} encoded - The encoded polyline string
 * @returns {Array} Array of [longitude, latitude] coordinates
 */
export function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('Invalid polyline string provided');
  }

  const poly = [];
  let index = 0;
  let len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let shift = 0;
    let result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lng / 1e5, lat / 1e5]);
  }

  return poly;
}

/**
 * Convert polyline to GeoJSON FeatureCollection
 * @param {string} polyline - The encoded polyline string
 * @param {Object} properties - Properties for the feature
 * @returns {Object} GeoJSON FeatureCollection
 */
export function polylineToGeoJSON(polyline, properties = {}) {
  const coordinates = decodePolyline(polyline);
  
  if (coordinates.length < 2) {
    throw new Error('Polyline must have at least 2 coordinates to form a line');
  }

  return {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "id": 1,
      "properties": { "ID": 1, "source": "polyline", ...properties },
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates
      }
    }]
  };
}
