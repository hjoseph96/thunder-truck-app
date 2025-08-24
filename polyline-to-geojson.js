const polyline = require('@mapbox/polyline');

/**
 * Convert a Google Directions API encoded polyline to GeoJSON
 * @param {string} encodedPolyline - The encoded polyline string from Google Directions API
 * @param {Object} options - Optional configuration
 * @param {string} options.name - Name for the route (default: "Route")
 * @param {string} options.description - Description for the route (default: "Decoded polyline route")
 * @returns {Object} GeoJSON Feature object with LineString geometry
 */
function polylineToGeoJSON(encodedPolyline, options = {}) {
  try {
    // Decode the polyline to coordinates array
    const coordinates = polyline.decode(encodedPolyline);
    
    // Create GeoJSON Feature
    const geoJson = {
      type: "Feature",
      properties: {
        name: options.name || "Route",
        description: options.description || "Decoded polyline route",
        coordinateCount: coordinates.length
      },
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
    
    return geoJson;
  } catch (error) {
    throw new Error(`Failed to convert polyline to GeoJSON: ${error.message}`);
  }
}

/**
 * Convert a Google Directions API encoded polyline to coordinates array
 * @param {string} encodedPolyline - The encoded polyline string from Google Directions API
 * @returns {Array} Array of coordinate pairs [longitude, latitude]
 */
function polylineToCoordinates(encodedPolyline) {
  try {
    return polyline.decode(encodedPolyline);
  } catch (error) {
    throw new Error(`Failed to decode polyline: ${error.message}`);
  }
}

/**
 * Get route statistics from a polyline
 * @param {string} encodedPolyline - The encoded polyline string from Google Directions API
 * @returns {Object} Object containing route statistics
 */
function getRouteStats(encodedPolyline) {
  try {
    const coordinates = polyline.decode(encodedPolyline);
    
    if (coordinates.length === 0) {
      return {
        coordinateCount: 0,
        startCoordinates: null,
        endCoordinates: null,
        approximateDistance: 0
      };
    }
    
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    
    // Calculate approximate distance (very rough estimation)
    const latDiff = Math.abs(lastCoord[1] - firstCoord[1]);
    const lonDiff = Math.abs(lastCoord[0] - firstCoord[0]);
    const roughDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
    
    return {
      coordinateCount: coordinates.length,
      startCoordinates: {
        longitude: firstCoord[0],
        latitude: firstCoord[1]
      },
      endCoordinates: {
        longitude: lastCoord[0],
        latitude: lastCoord[1]
      },
      approximateDistance: roughDistance
    };
  } catch (error) {
    throw new Error(`Failed to get route stats: ${error.message}`);
  }
}

module.exports = {
  polylineToGeoJSON,
  polylineToCoordinates,
  getRouteStats
};

// Example usage (when run directly)
if (require.main === module) {
  const encodedPolyline = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";
  
  console.log('Example: Converting polyline to GeoJSON\n');
  
  try {
    // Convert to GeoJSON
    const geoJson = polylineToGeoJSON(encodedPolyline, {
      name: "Sample Route",
      description: "Example route from Google Directions API"
    });
    
    console.log('GeoJSON Output:');
    console.log(JSON.stringify(geoJson, null, 2));
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Get route statistics
    const stats = getRouteStats(encodedPolyline);
    
    console.log('Route Statistics:');
    console.log(`Number of coordinates: ${stats.coordinateCount}`);
    console.log(`Start: [${stats.startCoordinates.longitude}, ${stats.startCoordinates.latitude}]`);
    console.log(`End: [${stats.endCoordinates.longitude}, ${stats.endCoordinates.latitude}]`);
    console.log(`Approximate distance: ${stats.approximateDistance.toFixed(2)} km`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
