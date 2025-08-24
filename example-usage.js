// Example usage of the polyline-to-geojson utility
const { polylineToGeoJSON, polylineToCoordinates, getRouteStats } = require('./polyline-to-geojson');

// Example 1: Convert polyline to GeoJSON
function example1() {
  console.log('=== Example 1: Convert to GeoJSON ===\n');
  
  const encodedPolyline = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";
  
  try {
    const geoJson = polylineToGeoJSON(encodedPolyline, {
      name: "Sample Route",
      description: "Example route from Google Directions API"
    });
    
    console.log('GeoJSON Output:');
    console.log(JSON.stringify(geoJson, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Get just the coordinates
function example2() {
  console.log('\n=== Example 2: Get Coordinates Only ===\n');
  
  const encodedPolyline = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";
  
  try {
    const coordinates = polylineToCoordinates(encodedPolyline);
    
    console.log(`Total coordinates: ${coordinates.length}`);
    console.log('First 3 coordinates:');
    coordinates.slice(0, 3).forEach((coord, index) => {
      console.log(`  ${index + 1}: [${coord[0]}, ${coord[1]}]`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Get route statistics
function example3() {
  console.log('\n=== Example 3: Get Route Statistics ===\n');
  
  const encodedPolyline = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";
  
  try {
    const stats = getRouteStats(encodedPolyline);
    
    console.log('Route Statistics:');
    console.log(`Coordinate count: ${stats.coordinateCount}`);
    console.log(`Start: [${stats.startCoordinates.longitude}, ${stats.startCoordinates.latitude}]`);
    console.log(`End: [${stats.endCoordinates.longitude}, ${stats.endCoordinates.latitude}]`);
    console.log(`Approximate distance: ${stats.approximateDistance.toFixed(2)} km`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all examples
console.log('Polyline to GeoJSON Utility - Usage Examples\n');
example1();
example2();
example3();
