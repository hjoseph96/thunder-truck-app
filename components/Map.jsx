import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import { getMapboxAccessToken } from '../config/mapbox-config';
import { polylineToGeoJSON } from '../polyline-to-geojson';

const MAPBOX_TOKEN = getMapboxAccessToken();

// Default polyline from the utility
const DEFAULT_POLYLINE = "__dwFvudaMeE}Bw@bFu@tUSjG]xDk@~H{@pKQjCIBgB~Ic@jCUlAMjAK~@?JFh@zEdNyArAeE~CmIjGiDrCoOjMaGjF{KdLeJ`JaAtAk@tA_AjDIb@yAnO_@vEeDjy@YvGMlDGd@_@vLA`@IlBEZErAItBG~@Bd@oB`f@Y|Gs@xOIp@mC`ZOJgBzSoAzM{@vJcAdIgCdQZf@~DjB~DnB~JbEnAvGnE_Bb@?z@T|MfEbCgPBK`E{AJA`FqBP?zYhG^RbCf\\ZdExE|m@qBZUJi@Jl@nB|@`Cp@vAbChEfBpCxEpGxCzDhH`KbCxDVb@T?f@T\\ZZd@F@z@tBAb@M^xBxDl@z@bAjBnBjDfCbF`AlBbBhCrAjBx@bB`AfD~@hDp@xBx@rB\\l@`BxDhC~ExBlDdDrEfBdCzBzBn@\\b@\\f@T|B~AlC~A\\HdAJv@^d@?d@BlAt@xBxB|@n@zCxAjE|AxBz@t@d@fI`DlAb@vCtA`DjBbBhAhBrAlD~CjBbBpBrAj@p@x@bB\\j@x@|@rAt@bA\\tBRz@Hn@Rl@d@P\\Lf@JzAClAClAFfCRjBX`Ap@vArEjIpAnAfClEb@l@ZZp@h@`@h@`@tAn@|BtAtApCvC~BxATTHV?r@Ad@DV^j@FV?`@Qb@OLUB}@@SLKTM|@_@~@EXEbAENMPo@Vq@FSLO\\IfACHTl@Hl@Ax@If@Ul@c@d@YNaBPo@h@@TG^_@WOd@INK^sCpICTe@tAML_@pA_@fA[~@g@~AaFmDgA~CTZdExCQ`@AL}EfN{DfLIDqA`EeC|GOl@EZm@bBCQDYKa@uJ|Kx]rn@aI`@nBvw@j@nTfB~r@rG|mAyMzA?ZX~EwMxAGeA";

// New bike route polyline
const BIKE_ROUTE_POLYLINE = "gj_wFfhrbMuDnHlBpBvSga@nLiU_FgFdKiShC{E@KgBsBvAkCGm@{Qef@hHy@iDco@RCU_DIOGE}@}PwMxAGeA";

// Convert default polyline to GeoJSON
const DEFAULT_ROUTE_GEOJSON = polylineToGeoJSON(DEFAULT_POLYLINE, {
  name: "Default Route",
  description: "Sample route from Queens to Brooklyn"
});

// Convert bike route polyline to GeoJSON
const BIKE_ROUTE_GEOJSON = polylineToGeoJSON(BIKE_ROUTE_POLYLINE, {
  name: "Bike Route",
  description: "Bike route path"
});

const Map = forwardRef(({ 
  webViewReady, 
  setWebViewReady, 
  userLocation, 
  locationPermissionGranted, 
  onGPSButtonPress,
  onMessage,
  onLoadStart,
  onLoadEnd,
  onLoadProgress,
  onError,
  onHttpError,
  renderError
}, ref) => {
  const webViewRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    postMessage: (message) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(message);
      }
    }
  }));

  const sendMessageToWebView = (message) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  // Send user location to WebView when it changes
  useEffect(() => {
    if (userLocation && webViewReady) {
      console.log('Map: Sending user location to WebView:', userLocation);
      sendMessageToWebView({
        type: 'userLocationUpdate',
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy
        }
      });
    }
  }, [userLocation, webViewReady]);

  // Send location permission status to WebView
  useEffect(() => {
    if (webViewReady) {
      sendMessageToWebView({
        type: 'locationPermission',
        granted: locationPermissionGranted
      });
    }
  }, [locationPermissionGranted, webViewReady]);

  const webViewHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ThunderTruck Map</title>
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map { 
          position: absolute; 
          top: 0; 
          bottom: 0; 
          width: 100%; 
        }
        .mapboxgl-ctrl-top-right {
          top: 20px;
          right: 20px;
        }
        .mapboxgl-ctrl-top-left {
          top: 20px;
          left: 20px;
        }
        /* Ensure zoom controls maintain uniform size */
        .mapboxgl-ctrl-group {
          transform: scale(1) !important;
          transform-origin: top left !important;
        }
        .mapboxgl-ctrl-group button {
          transform: scale(1) !important;
        }
        .gps-button {
          background: #fecd15;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .gps-button:hover {
          background: #e6b800;
        }
        .user-location-marker {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #007cff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 1000;
          pointer-events: none;
          transform-origin: center;
          /* Ensure marker maintains uniform size regardless of zoom */
          transform: scale(1) !important;
        }
        .user-location-marker::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        /* Prevent any scaling effects on map controls and markers */
        .mapboxgl-ctrl-group,
        .mapboxgl-ctrl-group *,
        .user-location-marker,
        .user-location-marker * {
          transform: scale(1) !important;
          transform-origin: top left !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .user-location-marker {
          animation: pulse 2s infinite;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <button class="gps-button" onclick="centerOnUserLocation()" title="Center on my location">📍</button>
      
      <script>
        let map;
        let currentUserLocation;
        let defaultLocation = [-73.9571, 40.7081]; // Williamsburg, Brooklyn
        let hasLocationPermission = false;
        
        // Default route GeoJSON data
        const defaultRouteGeoJSON = ${JSON.stringify(DEFAULT_ROUTE_GEOJSON)};
        
        // New bike route GeoJSON data
        const bikeRouteGeoJSON = ${JSON.stringify(BIKE_ROUTE_GEOJSON)};
        
        // Function to wait for Mapbox to be fully loaded
        function waitForMapboxWithTimeout(timeout = 5000) {
          return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkMapbox = () => {
              if (typeof mapboxgl !== 'undefined' && mapboxgl.Map) {
                console.log('WebView: Mapbox GL JS is ready');
                resolve();
              } else if (Date.now() - startTime > timeout) {
                reject(new Error('Mapbox GL JS failed to load within timeout'));
              } else {
                setTimeout(checkMapbox, 100);
              }
            };
            
            checkMapbox();
          });
        }
        
        // Initialize the map
        async function initializeMap() {
          try {
            console.log('WebView: Initializing map...');
            
            // Set Mapbox access token
            mapboxgl.accessToken = '${MAPBOX_TOKEN}';
            
            if (mapboxgl.accessToken.length < 10) {
              throw new Error('Invalid Mapbox access token');
            }
            
            // Create map instance
            map = new mapboxgl.Map({
              container: 'map',
              style: 'mapbox://styles/mapbox/streets-v12',
              center: defaultLocation,
              zoom: 14
            });
            
            // Wait for map to load
            map.on('load', function() {
              console.log('WebView: Map loaded successfully');
              
              // Add both routes to the map
              addDefaultRoute();
              addBikeRoute();
              
              // Fit map to show all routes
              fitMapToAllRoutes();
              
              // Only add user location marker if user location is actually set
              if (currentUserLocation) {
                addUserLocationMarker(currentUserLocation);
                console.log('WebView: Added user location marker at:', currentUserLocation);
              } else {
                console.log('WebView: No user location set, skipping marker creation');
              }
              
              // Send ready message to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'webViewReady'
                }));
              }
              
              // Also check if we have location permission and should show marker
              if (hasLocationPermission && currentUserLocation) {
                console.log('WebView: Map loaded with permission, ensuring marker is visible');
                addUserLocationMarker(currentUserLocation);
              }
            });
            
            // Add navigation control
            map.addControl(new mapboxgl.NavigationControl(), 'top-left');
             
            // Add event listeners to update marker position when map moves
            map.on('move', updateMarkerPositionOnMapMove);
            map.on('zoom', updateMarkerPositionOnMapMove);
            
            // Add render event listener to draw the default route on every render
            map.on('render', function() {
              // Ensure the default route is always visible and drawn
              if (map.getSource('default-route') && map.getLayer('default-route-line')) {
                // Route exists, ensure it's visible
                console.log('WebView: Render event - ensuring default route is visible');
                
                // Force the route layer to be visible
                try {
                  map.setPaintProperty('default-route-line', 'line-opacity', 0.8);
                  map.setPaintProperty('default-route-line', 'line-width', 4);
                  map.setPaintProperty('default-route-line', 'line-color', '#219ebc');
                } catch (error) {
                  console.log('WebView: Could not update route paint properties:', error.message);
                }
              } else if (!map.getSource('default-route')) {
                // Route source missing, recreate it
                console.log('WebView: Render event - route source missing, recreating...');
                addDefaultRoute();
              } else if (!map.getLayer('default-route-line')) {
                // Route layer missing, recreate it
                console.log('WebView: Render event - route layer missing, recreating...');
                addDefaultRoute();
              }

              // Ensure the bike route is always visible and drawn
              if (map.getSource('bike-route') && map.getLayer('bike-route-line')) {
                // Route exists, ensure it's visible
                console.log('WebView: Render event - ensuring bike route is visible');
                
                // Force the route layer to be visible
                try {
                  map.setPaintProperty('bike-route-line', 'line-opacity', 0.8);
                  map.setPaintProperty('bike-route-line', 'line-width', 4);
                  map.setPaintProperty('bike-route-line', 'line-color', '#007cff'); // A different color for bike route
                } catch (error) {
                  console.log('WebView: Could not update bike route paint properties:', error.message);
                }
              } else if (!map.getSource('bike-route')) {
                // Route source missing, recreate it
                console.log('WebView: Render event - bike route source missing, recreating...');
                addBikeRoute();
              } else if (!map.getLayer('bike-route-line')) {
                // Route layer missing, recreate it
                console.log('WebView: Render event - bike route layer missing, recreating...');
                addBikeRoute();
              }
              
              // Ensure bike icon maintains position during map rerenders
              if (bikeAnimationState.isAnimating && bikeAnimationState.bikeMarker) {
                const coordinates = bikeRouteGeoJSON.geometry.coordinates; // Get coordinates from bikeRouteGeoJSON
                const currentIndex = bikeAnimationState.currentIndex;
                if (currentIndex < coordinates.length) {
                  const currentCoord = coordinates[currentIndex];
                  
                  // Check if bike marker is still valid and in the correct position
                  try {
                    const markerPosition = bikeAnimationState.bikeMarker.getLngLat();
                    const positionDiff = Math.abs(markerPosition.lng - currentCoord[0]) + Math.abs(markerPosition.lat - currentCoord[1]);
                    
                    if (positionDiff > 0.0001) { // If position is significantly off, restore it
                      bikeAnimationState.bikeMarker.setLngLat(currentCoord);
                      console.log('WebView: Render event - restored bike position to coordinate', currentIndex, 'at', currentCoord);
                    }
                  } catch (error) {
                    // If marker is invalid, recreate it
                    console.log('WebView: Render event - bike marker invalid, recreating...');
                    bikeAnimationState.bikeMarker.remove();
                    bikeAnimationState.bikeMarker = null;
                    
                    // Recreate bike marker at current position
                    const bikeIcon = document.createElement('div');
                    bikeIcon.className = 'bike-icon';
                    bikeIcon.innerHTML = '🚲';
                    bikeIcon.style.width = '30px';
                    bikeIcon.style.height = '30px';
                    bikeIcon.style.background = '#007cff';
                    bikeIcon.style.border = '3px solid white';
                    bikeIcon.style.borderRadius = '50%';
                    bikeIcon.style.display = 'flex';
                    bikeIcon.style.alignItems = 'center';
                    bikeIcon.style.justifyContent = 'center';
                    bikeIcon.style.fontSize = '18px';
                    bikeIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                    bikeIcon.style.zIndex = '1000';
                    
                    const newBikeMarker = new mapboxgl.Marker(bikeIcon)
                      .setLngLat(currentCoord)
                      .addTo(map);
                    
                    bikeAnimationState.bikeMarker = newBikeMarker;
                    console.log('WebView: Render event - recreated bike marker at coordinate', currentIndex, 'at', currentCoord);
                  }
                }
              }
              
              // Start bike animation automatically on first render if not already animating
              if (!bikeAnimationState.isAnimating) {
                console.log('WebView: Render event - starting bike animation automatically');
                setTimeout(() => {
                  animateBikeAlongRoute({ shouldLoop: false, speed: 500 });
                }, 500); // Small delay to ensure everything is ready
              }
            });
            
            console.log('WebView: Map initialization complete');
            
          } catch (error) {
            console.error('WebView: Error initializing map:', error);
            
            // Send error message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapError',
                error: error.message
              }));
            }
          }
        }
        
        // Function to add the default route to the map
        function addDefaultRoute() {
          try {
            console.log('WebView: Adding default route...');
            
            // Remove existing route if it exists
            if (map.getLayer('default-route-line')) {
              map.removeLayer('default-route-line');
            }
            if (map.getSource('default-route')) {
              map.removeSource('default-route');
            }
            
            // Add the route source
            map.addSource('default-route', {
              type: 'geojson',
              data: defaultRouteGeoJSON
            });
            
            // Get coordinates from the validated GeoJSON
            const coordinates = defaultRouteGeoJSON.geometry.coordinates;
            console.log('WebView: Route coordinates (first 3):', coordinates.slice(0, 3));
            
            // Add the route layer with the specified color #fecd15
            map.addLayer({
              id: 'default-route-line',
              type: 'line',
              source: 'default-route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#219ebc',
                'line-width': 4,
                'line-opacity': 0.8
              },
              minzoom: 0,
              maxzoom: 24
            });
            
            // Add markers at the exact start and end coordinates
            if (coordinates.length > 0) {
              // Start marker - coordinates are now in [longitude, latitude] format
              const startCoord = coordinates[0];
              console.log('WebView: Start coordinate:', startCoord);
              
              const startMarker = new mapboxgl.Marker({ color: '#00ff00' })
                .setLngLat(startCoord)
                .setPopup(new mapboxgl.Popup().setHTML('<b>Route Start</b><br>Lng: ' + startCoord[0].toFixed(6) + '<br>Lat: ' + startCoord[1].toFixed(6)))
                .addTo(map);
              
              // End marker - coordinates are now in [longitude, latitude] format
              const endCoord = coordinates[coordinates.length - 1];
              console.log('WebView: End coordinate:', endCoord);
              
              const endMarker = new mapboxgl.Marker({ color: '#ff0000' })
                .setLngLat(endCoord)
                .setPopup(new mapboxgl.Popup().setHTML('<b>Route End</b><br>Lng: ' + endCoord[0].toFixed(6) + '<br>Lat: ' + endCoord[1].toFixed(6)))
                .addTo(map);
              
              console.log('WebView: Added start marker at:', startCoord);
              console.log('WebView: Added end marker at:', endCoord);
            }
            
            console.log('WebView: Default route added successfully');
            
          } catch (error) {
            console.error('WebView: Error adding default route:', error);
          }
        }

        // Function to add the bike route to the map
        function addBikeRoute() {
          try {
            console.log('WebView: Adding bike route...');

            // Remove existing bike route if it exists
            if (map.getLayer('bike-route-line')) {
              map.removeLayer('bike-route-line');
            }
            if (map.getSource('bike-route')) {
              map.removeSource('bike-route');
            }

            // Add the bike route source
            map.addSource('bike-route', {
              type: 'geojson',
              data: bikeRouteGeoJSON
            });

            // Get coordinates from the validated GeoJSON
            const coordinates = bikeRouteGeoJSON.geometry.coordinates;
            console.log('WebView: Bike route coordinates (first 3):', coordinates.slice(0, 3));

            // Add the bike route layer with a different color
            map.addLayer({
              id: 'bike-route-line',
              type: 'line',
              source: 'bike-route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#007cff', // A different color for bike route
                'line-width': 4,
                'line-opacity': 0.8
              },
              minzoom: 0,
              maxzoom: 24
            });

            // Add markers at the exact start and end coordinates
            if (coordinates.length > 0) {
              // Start marker - coordinates are now in [longitude, latitude] format
              const startCoord = coordinates[0];
              console.log('WebView: Bike route start coordinate:', startCoord);
              
              // Note: Bike icon will be added by animation function, not here
              
              // End marker - coordinates are now in [longitude, latitude] format
              const endCoord = coordinates[coordinates.length - 1];
              console.log('WebView: Bike route end coordinate:', endCoord);
              
              const endMarker = new mapboxgl.Marker({ color: '#007cff' }) // Use the same color as the line
                .setLngLat(endCoord)
                .setPopup(new mapboxgl.Popup().setHTML('<b>Bike Route End</b><br>Lng: ' + endCoord[0].toFixed(6) + '<br>Lat: ' + endCoord[1].toFixed(6)))
                .addTo(map);
              
              console.log('WebView: Added bike route end marker at:', endCoord);
            }
            
            console.log('WebView: Bike route added successfully');

          } catch (error) {
            console.error('WebView: Error adding bike route:', error);
          }
        }
        
        // Function to fit map bounds to show both routes
        function fitMapToAllRoutes() {
          try {
            if (!map) return;
            
            const bounds = new mapboxgl.LngLatBounds();
            
            // Add default route coordinates to bounds
            if (defaultRouteGeoJSON && defaultRouteGeoJSON.geometry && defaultRouteGeoJSON.geometry.coordinates) {
              defaultRouteGeoJSON.geometry.coordinates.forEach(coord => bounds.extend(coord));
            }
            
            // Add bike route coordinates to bounds (static route only, no animation updates)
            if (bikeRouteGeoJSON && bikeRouteGeoJSON.geometry && bikeRouteGeoJSON.geometry.coordinates) {
              bikeRouteGeoJSON.geometry.coordinates.forEach(coord => bounds.extend(coord));
            }
            
            // Fit map to show all routes
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 50, duration: 2000 });
              console.log('WebView: Map bounds updated to show all routes');
            }
          } catch (error) {
            console.error('WebView: Error fitting map bounds:', error);
          }
        }
        
        // Bike animation variables
        let bikeAnimationState = {
          isAnimating: false,
          currentIndex: 0,
          bikeMarker: null,
          animationInterval: null,
          totalCoordinates: 0,
          isCompleted: false,
          completionCallback: null,
          shouldLoop: false,
          progress: 0
        };
        
        // Function to animate bike icon along the bike route
        function animateBikeAlongRoute(options = {}) {
          try {
            if (!map || !bikeRouteGeoJSON || !bikeRouteGeoJSON.geometry || !bikeRouteGeoJSON.geometry.coordinates) {
              console.log('WebView: Cannot animate bike - missing route data');
              return;
            }
            
            const coordinates = bikeRouteGeoJSON.geometry.coordinates;
            if (coordinates.length < 2) {
              console.log('WebView: Cannot animate bike - insufficient coordinates');
              return;
            }
            
            // Stop any existing animation
            if (bikeAnimationState.isAnimating) {
              stopBikeAnimation();
            }
            
            // Apply options
            const shouldLoop = options.shouldLoop || false;
            const speed = options.speed || 500; // Default 500ms between moves
            
            console.log('WebView: Starting bike animation along route with options:', { shouldLoop, speed });
            
            // Remove existing bike icon if it exists
            const existingBikeIcon = document.querySelector('.bike-icon');
            if (existingBikeIcon) {
              existingBikeIcon.remove();
            }
            
            // Create new bike icon element
            const bikeIcon = document.createElement('div');
            bikeIcon.className = 'bike-icon';
            bikeIcon.innerHTML = '🚲';
            bikeIcon.style.width = '30px';
            bikeIcon.style.height = '30px';
            bikeIcon.style.background = '#007cff';
            bikeIcon.style.border = '3px solid white';
            bikeIcon.style.borderRadius = '50%';
            bikeIcon.style.display = 'flex';
            bikeIcon.style.alignItems = 'center';
            bikeIcon.style.justifyContent = 'center';
            bikeIcon.style.fontSize = '18px';
            bikeIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            bikeIcon.style.zIndex = '1000';
            // Removed CSS transitions to prevent unwanted movement
            
            // Create bike marker starting at the first coordinate
            const bikeMarker = new mapboxgl.Marker(bikeIcon)
              .setLngLat(coordinates[0])
              .addTo(map);
            
            // Store bike marker reference and initialize state
            bikeAnimationState.bikeMarker = bikeMarker;
            bikeAnimationState.currentIndex = 0;
            bikeAnimationState.isAnimating = true;
            bikeAnimationState.totalCoordinates = coordinates.length;
            bikeAnimationState.isCompleted = false;
            bikeAnimationState.progress = 0;
            bikeAnimationState.shouldLoop = shouldLoop;
            bikeAnimationState.animationSpeed = speed;
            
            // Function to update the route path from current bike position
            function updateRouteFromBikePosition(bikePosition, remainingCoords) {
              try {
                // Create dynamic route from bike position to end
                const dynamicRouteGeoJSON = {
                  type: "Feature",
                  properties: {
                    name: "Dynamic Bike Route",
                    description: "Route from current bike position to destination"
                  },
                  geometry: {
                    type: "LineString",
                    coordinates: [bikePosition, ...remainingCoords]
                  }
                };
                
                // Update the bike route source with new data
                if (map.getSource('bike-route')) {
                  map.getSource('bike-route').setData(dynamicRouteGeoJSON);
                }
                
                // Note: No map bounds updates during animation to prevent map movement
              } catch (error) {
                console.error('WebView: Error updating route from bike position:', error);
              }
            }
            
            // Function to move bike to next position
            function moveBikeToNextPosition() {
              if (!bikeAnimationState.isAnimating) {
                console.log('WebView: Bike animation stopped');
                return;
              }
              
              const currentIndex = bikeAnimationState.currentIndex;
              
              // Get current and next position
              const currentCoord = coordinates[currentIndex];
              const nextIndex = currentIndex + 1;
              
              // Check if we've reached the destination
              if (nextIndex >= coordinates.length) {
                // Destination reached!
                console.log('WebView: 🎯 Destination reached! Bike animation completed');
                
                // Move bike to final destination coordinate
                bikeMarker.setLngLat(coordinates[coordinates.length - 1]);
                
                // Update popup to show completion
                bikeMarker.setPopup(new mapboxgl.Popup().setHTML(
                  '<b>🎯 Destination Reached!</b><br>🚲 Bike has arrived at the final destination<br>Lng: ' + coordinates[coordinates.length - 1][0].toFixed(6) + '<br>Lat: ' + coordinates[coordinates.length - 1][1].toFixed(6) + '<br>Progress: 100%'
                ));
                
                // Update animation state
                bikeAnimationState.isCompleted = true;
                bikeAnimationState.progress = 100;
                bikeAnimationState.currentIndex = coordinates.length - 1;
                
                // Send completion message to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'bikeAnimationCompleted',
                    coordinates: {
                      latitude: coordinates[coordinates.length - 1][1],
                      longitude: coordinates[coordinates.length - 1][0]
                    },
                    progress: 100,
                    totalCoordinates: coordinates.length,
                    completionTime: new Date().toISOString()
                  }));
                }
                
                // Add completion celebration effect
                addCompletionCelebration(coordinates[coordinates.length - 1]);
                
                // Handle completion behavior
                if (bikeAnimationState.shouldLoop) {
                  // Restart animation from beginning
                  console.log('WebView: Restarting bike animation due to loop setting');
                  setTimeout(() => {
                    bikeAnimationState.currentIndex = 0;
                    bikeAnimationState.isCompleted = false;
                    bikeAnimationState.progress = 0;
                    bikeAnimationState.isAnimating = true;
                    bikeMarker.setLngLat(coordinates[0]);
                    bikeAnimationState.animationInterval = setTimeout(moveBikeToNextPosition, 500);
                  }, 2000); // Wait 2 seconds before restarting
                } else {
                  // Stop animation and keep bike at destination
                  console.log('WebView: Bike animation completed, keeping bike at destination');
                  bikeAnimationState.isAnimating = false;
                  if (bikeAnimationState.animationInterval) {
                    clearTimeout(bikeAnimationState.animationInterval);
                    bikeAnimationState.animationInterval = null;
                  }
                }
                
                return;
              }
              
              // Continue normal animation
              const nextCoord = coordinates[nextIndex];
              
              // Move bike directly to the next coordinate for consistent positioning
              bikeMarker.setLngLat(nextCoord);
              
              // Calculate and update progress
              const progress = Math.round(((nextIndex + 1) / coordinates.length) * 100);
              bikeAnimationState.progress = progress;
              bikeAnimationState.currentIndex = nextIndex;
              
              // Send progress update to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'bikeAnimationProgress',
                  progress: progress,
                  currentIndex: nextIndex + 1,
                  totalCoordinates: coordinates.length,
                  coordinates: {
                    latitude: nextCoord[1],
                    longitude: nextCoord[0]
                  }
                }));
              }
              
              // Update popup with current position and progress
              bikeMarker.setPopup(new mapboxgl.Popup().setHTML(
                '<b>🚲 Bike Position</b><br>Lng: ' + nextCoord[0].toFixed(6) + '<br>Lat: ' + nextCoord[1].toFixed(6) + '<br>Progress: ' + progress + '%<br>Coordinates: ' + (nextIndex + 1) + ' of ' + coordinates.length
              ));
              
              // Update the route path from current bike position
              const remainingCoordinates = coordinates.slice(nextIndex + 1);
              updateRouteFromBikePosition(nextCoord, remainingCoordinates);
              
              console.log('WebView: Bike moved to coordinate ' + (nextIndex + 1) + ' of ' + coordinates.length + ' at [' + nextCoord[0].toFixed(6) + ', ' + nextCoord[1].toFixed(6) + '] - Progress: ' + progress + '%');
              
              // Continue animation with configurable timing
              bikeAnimationState.animationInterval = setTimeout(moveBikeToNextPosition, bikeAnimationState.animationSpeed || 500);
            }
            
            // Start the animation with configurable speed
            bikeAnimationState.animationInterval = setTimeout(moveBikeToNextPosition, bikeAnimationState.animationSpeed || 500);
            
            console.log('WebView: Bike animation started successfully - will loop indefinitely with consistent movement');
            
          } catch (error) {
            console.error('WebView: Error animating bike along route:', error);
          }
        }
        
        // Function to stop bike animation
        function stopBikeAnimation() {
          try {
            // Stop the current animation loop
            bikeAnimationState.isAnimating = false;
            
            // Clear the animation interval
            if (bikeAnimationState.animationInterval) {
              clearTimeout(bikeAnimationState.animationInterval);
              bikeAnimationState.animationInterval = null;
            }
            
            // Remove bike icon
            if (bikeAnimationState.bikeMarker) {
              bikeAnimationState.bikeMarker.remove();
              bikeAnimationState.bikeMarker = null;
            }
            
            console.log('WebView: Bike animation stopped');
          } catch (error) {
            console.error('WebView: Error stopping bike animation:', error);
          }
        }
        
        // Function to restart bike animation
        function restartBikeAnimation() {
          try {
            console.log('WebView: Restarting bike animation');
            
            // Reset animation state
            bikeAnimationState.currentIndex = 0;
            bikeAnimationState.isCompleted = false;
            bikeAnimationState.progress = 0;
            bikeAnimationState.isAnimating = true;
            
            // Move bike back to start
            if (bikeAnimationState.bikeMarker && coordinates.length > 0) {
              bikeAnimationState.bikeMarker.setLngLat(coordinates[0]);
              
              // Update popup to show restart
              bikeAnimationState.bikeMarker.setPopup(new mapboxgl.Popup().setHTML(
                '<b>🚲 Bike Restarted</b><br>Lng: ' + coordinates[0][0].toFixed(6) + '<br>Lat: ' + coordinates[0][1].toFixed(6) + '<br>Progress: 0%<br>Coordinates: 1 of ' + coordinates.length
              ));
            }
            
            // Start animation again with configurable speed
            bikeAnimationState.animationInterval = setTimeout(moveBikeToNextPosition, bikeAnimationState.animationSpeed || 500);
            
            console.log('WebView: Bike animation restarted successfully');
          } catch (error) {
            console.error('WebView: Error restarting bike animation:', error);
          }
        }
        
        // Function to set bike animation loop behavior
        function setBikeAnimationLoop(shouldLoop) {
          try {
            bikeAnimationState.shouldLoop = shouldLoop;
            console.log('WebView: Bike animation loop setting changed to:', shouldLoop);
            
            // Send confirmation to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'bikeAnimationLoopChanged',
                shouldLoop: shouldLoop
              }));
            }
          } catch (error) {
            console.error('WebView: Error setting bike animation loop:', error);
          }
        }
        
        // Function to get current bike animation status
        function getBikeAnimationStatus() {
          try {
            const status = {
              isAnimating: bikeAnimationState.isAnimating,
              isCompleted: bikeAnimationState.isCompleted,
              currentIndex: bikeAnimationState.currentIndex,
              totalCoordinates: bikeAnimationState.totalCoordinates,
              progress: bikeAnimationState.progress,
              shouldLoop: bikeAnimationState.shouldLoop,
              currentPosition: null,
              estimatedTimeOfArrival: null,
              animationSpeed: bikeAnimationState.animationSpeed || 500
            };
            
            // Get current position if bike marker exists
            if (bikeAnimationState.bikeMarker) {
              const lngLat = bikeAnimationState.bikeMarker.getLngLat();
              status.currentPosition = {
                longitude: lngLat.lng,
                latitude: lngLat.lat
              };
            }
            
            // Calculate estimated time of arrival
            if (bikeAnimationState.isAnimating && !bikeAnimationState.isCompleted) {
              const remainingCoordinates = bikeAnimationState.totalCoordinates - bikeAnimationState.currentIndex - 1;
              const remainingTime = remainingCoordinates * (bikeAnimationState.animationSpeed || 500);
              status.estimatedTimeOfArrival = new Date(Date.now() + remainingTime).toISOString();
            }
            
            console.log('WebView: Bike animation status:', status);
            return status;
          } catch (error) {
            console.error('WebView: Error getting bike animation status:', error);
            return null;
          }
        }
        
        // Function to add completion celebration effect
        function addCompletionCelebration(coordinates) {
          try {
            console.log('WebView: Adding completion celebration effect at:', coordinates);
            
            // Create celebration container
            const celebration = document.createElement('div');
            celebration.className = 'completion-celebration';
            celebration.innerHTML = '🎉';
            celebration.style.position = 'absolute';
            celebration.style.fontSize = '48px';
            celebration.style.zIndex = '2000';
            celebration.style.pointerEvents = 'none';
            celebration.style.animation = 'celebration-bounce 2s ease-out forwards';
            
            // Position celebration at destination
            if (map) {
              const point = map.project(coordinates);
              celebration.style.left = point.x + 'px';
              celebration.style.top = (point.y - 50) + 'px';
              celebration.style.transform = 'translate(-50%, -50%)';
            }
            
            // Add celebration styles
            const celebrationStyles = document.createElement('style');
            celebrationStyles.textContent = 
              '@keyframes celebration-bounce {' +
              '  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }' +
              '  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }' +
              '  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }' +
              '}';
            document.head.appendChild(celebrationStyles);
            
            // Add to map
            document.body.appendChild(celebration);
            
            // Remove celebration after animation
            setTimeout(() => {
              if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
              }
              if (celebrationStyles.parentNode) {
                celebrationStyles.parentNode.removeChild(celebrationStyles);
              }
            }, 2000);
            
            console.log('WebView: Completion celebration effect added');
          } catch (error) {
            console.error('WebView: Error adding completion celebration:', error);
          }
        }
        
        // Function to add user location marker
        function addUserLocationMarker(coordinates) {
          try {
            // Only create marker if valid coordinates are provided
            if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
              console.log('WebView: Invalid coordinates provided, skipping marker creation');
              return;
            }
            
            // Remove existing marker if any
            const existingMarker = document.querySelector('.user-location-marker');
            if (existingMarker) {
              existingMarker.remove();
            }
            
            // Create new marker
            const marker = document.createElement('div');
            marker.className = 'user-location-marker';
            marker.setAttribute('aria-label', 'Map marker');
            marker.setAttribute('role', 'img');
            
            // Position marker
            if (map) {
              const point = map.project(coordinates);
              marker.style.left = point.x + 'px';
              marker.style.top = point.y + 'px';
              marker.style.transform = 'translate(-50%, -50%) scale(1)';
              console.log('WebView: Marker positioned at pixel coordinates:', point);
            }
            
            // Add to map
            document.body.appendChild(marker);
            
            console.log('WebView: User location marker added at:', coordinates);
            
          } catch (error) {
            console.error('WebView: Error adding user location marker:', error);
          }
        }
        
        // Function to center map on user location
        function centerOnUserLocation() {
          if (currentUserLocation && map) {
            console.log('WebView: Centering map on user location');
            map.flyTo({
              center: currentUserLocation,
              zoom: 16,
              duration: 1500
            });
            
            // Update marker position
            addUserLocationMarker(currentUserLocation);
          } else {
            console.log('WebView: No user location available');
            // Remove any existing marker if no location
            const existingMarker = document.querySelector('.user-location-marker');
            if (existingMarker) {
              existingMarker.remove();
              console.log('WebView: Removed existing marker due to no user location');
            }
          }
        }
        
        // Function to update marker position when map moves
        function updateMarkerPositionOnMapMove() {
          if (currentUserLocation && map) {
            const userMarker = document.querySelector('.user-location-marker');
            if (userMarker) {
              const point = map.project(currentUserLocation);
              userMarker.style.left = point.x + 'px';
              userMarker.style.top = point.y + 'px';
              
              // Ensure marker maintains uniform size
              userMarker.style.transform = 'translate(-50%, -50%) scale(1)';
              
              console.log('WebView: Marker position updated on map move to:', point);
            } else {
              // If marker doesn't exist but should, recreate it
              console.log('WebView: Marker missing, recreating at current location');
              addUserLocationMarker(currentUserLocation);
            }
          } else {
            // If no user location, remove any existing marker
            const userMarker = document.querySelector('.user-location-marker');
            if (userMarker) {
              userMarker.remove();
              console.log('WebView: Removed marker due to no user location during map move');
            }
          }
        }
        
        // Handle messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            console.log('WebView: Message received from React Native:', data);
            
            if (data.type === 'userLocationUpdate') {
              // Update map to user's current location
              console.log('WebView: Updating map to user location:', data.coordinates);
              currentUserLocation = [data.coordinates.longitude, data.coordinates.latitude];
              
              // Update the default location to user's location for future initializations
              defaultLocation = currentUserLocation;
              
              if (map) {
                // Fly to user's location
                map.flyTo({
                  center: currentUserLocation,
                  zoom: 16,
                  duration: 2000
                });
                
                // Add user location marker at the new location
                addUserLocationMarker(currentUserLocation);
              } else {
                // If map isn't ready yet, store the location for when it loads
                console.log('WebView: Map not ready yet, storing user location for later');
              }
              
              // Send confirmation back to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'userLocationMarkerAdded',
                  coordinates: currentUserLocation
                }));
              }
              
            } else if (data.type === 'centerMapOnUserLocation') {
              // Center map on user location
              if (currentUserLocation && map) {
                console.log('WebView: Centering map on user location from GPS button');
                map.flyTo({
                  center: currentUserLocation,
                  zoom: 16,
                  duration: 1500
                });
              }
            } else if (data.type === 'moveBlueDot') {
              // Programmatically move the blue dot to a specific location
              if (data.coordinates && data.coordinates.longitude && data.coordinates.latitude) {
                console.log('WebView: Moving blue dot to coordinates:', data.coordinates);
                moveBlueDotToLocation(data.coordinates.longitude, data.coordinates.latitude);
              }
            } else if (data.type === 'moveUserMarker') {
              // Move the user marker to new coordinates
              if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
                console.log('WebView: Moving user marker to coordinates:', data.coordinates);
                
                try {
                  const coords = [data.coordinates.longitude, data.coordinates.latitude];
                  
                  // Update current user location
                  currentUserLocation = coords;
                  
                  // Move map to new location
                  if (map) {
                    map.flyTo({
                      center: coords,
                      zoom: 16,
                      duration: 2000
                    });
                  }
                  
                  // Send confirmation back to React Native
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerMoved',
                      coordinates: {
                        latitude: data.coordinates.latitude,
                        longitude: data.coordinates.longitude
                      }
                    }));
                  }
                  
                  console.log('WebView: User marker moved successfully');
                } catch (error) {
                  console.error('WebView: Error moving user marker:', error);
                  
                  // Send error back to React Native
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerMoveError',
                      error: error.message
                    }));
                  }
                }
              }
            } else if (data.type === 'setStaticMarker') {
              // Set marker as static at specific coordinates
              if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
                console.log('WebView: Setting static marker at coordinates:', data.coordinates);
                
                try {
                  const coords = [data.coordinates.longitude, data.coordinates.latitude];
                  currentUserLocation = coords;
                  
                  // Update the static marker position in the HTML
                  const userMarker = document.querySelector('.user-location-marker');
                  if (userMarker && map) {
                    // Convert coordinates to pixel position
                    const point = map.project(coords);
                    userMarker.style.left = point.x + 'px';
                    userMarker.style.top = point.y + 'px';
                    userMarker.style.transform = 'translate(-50%, -50%) scale(1)';
                    userMarker.style.position = 'absolute'; // Keep it absolute for proper positioning
                    userMarker.style.zIndex = '1000';
                    
                    console.log('WebView: Static marker set at pixel position:', point);
                  }
                  
                  // Send confirmation back to React Native
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'staticMarkerSet',
                      coordinates: {
                        latitude: data.coordinates.latitude,
                        longitude: data.coordinates.longitude
                      }
                    }));
                  }
                } catch (error) {
                  console.error('WebView: Error setting static marker:', error);
                }
              }
            } else if (data.type === 'setMarkerVisibility') {
              // Set marker visibility behavior
              console.log('WebView: Setting marker visibility:', data.hideWhenOutOfView);
              
              try {
                const userMarker = document.querySelector('.user-location-marker');
                if (userMarker) {
                  if (data.hideWhenOutOfView) {
                    // Simple visibility toggle
                    userMarker.style.transition = 'opacity 0.3s ease';
                    console.log('WebView: Marker will hide when out of view');
                  } else {
                    // Always show marker
                    userMarker.style.opacity = '1';
                    userMarker.style.transition = 'none';
                    console.log('WebView: Marker will always be visible');
                  }
                }
                
                // Send confirmation back to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerVisibilityChanged',
                    hideWhenOutOfView: data.hideWhenOutOfView
                  }));
                }
              } catch (error) {
                console.error('WebView: Error setting marker visibility:', error);
              }
            } else if (data.type === 'locationPermission') {
              // Handle location permission status update
              console.log('WebView: Location permission status:', data.granted);
              hasLocationPermission = data.granted;
              
              // If permission is granted and we have user location, add marker
              if (data.granted && currentUserLocation) {
                console.log('WebView: Permission granted, adding user location marker');
                addUserLocationMarker(currentUserLocation);
              } else if (!data.granted) {
                // If permission denied, remove any existing marker
                const existingMarker = document.querySelector('.user-location-marker');
                if (existingMarker) {
                  existingMarker.remove();
                  console.log('WebView: Permission denied, removed user location marker');
                }
              }
              
            } else if (data.type === 'updateMarkerPositionOnly') {
              // Update marker position without moving the map
              if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
                console.log('WebView: Updating marker position only:', data.coordinates);
                
                try {
                  const coords = [data.coordinates.longitude, data.coordinates.latitude];
                  currentUserLocation = coords;
                  
                  // Update marker position in HTML
                  const userMarker = document.querySelector('.user-location-marker');
                  if (userMarker && map) {
                    const point = map.project(coords);
                    userMarker.style.left = point.x + 'px';
                    userMarker.style.top = point.y + 'px';
                    userMarker.style.transform = 'translate(-50%, -50%) scale(1)';
                    
                    console.log('WebView: Marker position updated to pixel position:', point);
                  }
                  
                  // Send confirmation back to React Native
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerPositionUpdated',
                      coordinates: {
                        latitude: data.coordinates.latitude,
                        longitude: data.coordinates.longitude
                      }
                    }));
                  }
                } catch (error) {
                  console.error('WebView: Error updating marker position:', error);
                }
              }
            } else if (data.type === 'controlBikeAnimation') {
              // Control bike animation behavior
              console.log('WebView: Bike animation control command:', data.action);
              
              try {
                switch (data.action) {
                  case 'start':
                    if (!bikeAnimationState.isAnimating) {
                      const options = {
                        shouldLoop: data.shouldLoop || false,
                        speed: data.speed || 500
                      };
                      animateBikeAlongRoute(options);
                    }
                    break;
                  case 'stop':
                    stopBikeAnimation();
                    break;
                  case 'restart':
                    restartBikeAnimation();
                    break;
                  case 'setLoop':
                    setBikeAnimationLoop(data.shouldLoop || false);
                    break;
                  case 'getStatus':
                    const status = getBikeAnimationStatus();
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'bikeAnimationStatus',
                        status: status
                      }));
                    }
                    break;
                  default:
                    console.log('WebView: Unknown bike animation action:', data.action);
                }
                
                // Send confirmation back to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'bikeAnimationControlResponse',
                    action: data.action,
                    success: true
                  }));
                }
              } catch (error) {
                console.error('WebView: Error controlling bike animation:', error);
                
                // Send error back to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'bikeAnimationControlResponse',
                    action: data.action,
                    success: false,
                    error: error.message
                  }));
                }
              }
            }
          } catch (error) {
            console.error('WebView: Error parsing message:', error);
          }
        });
        
        // Initialize map when page loads
        document.addEventListener('DOMContentLoaded', function() {
          console.log('WebView: DOM loaded, initializing map...');
          
          // Wait a bit for Mapbox to fully load
          setTimeout(() => {
            if (typeof mapboxgl !== 'undefined' && mapboxgl.Map) {
              console.log('WebView: Mapbox GL JS available, initializing map...');
              initializeMap();
            } else {
              console.error('WebView: Mapbox GL JS not available');
              // Send error message to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapError',
                  error: 'Mapbox GL JS failed to load'
                }));
              }
            }
          }, 100);
        });
        
        // Fallback initialization in case DOMContentLoaded doesn't fire
        setTimeout(() => {
          if (!map) {
            console.log('WebView: Fallback initialization - DOM might be ready...');
            if (typeof mapboxgl !== 'undefined' && mapboxgl.Map) {
              console.log('WebView: Fallback - Mapbox GL JS available, initializing map...');
              initializeMap();
            } else {
              console.error('WebView: Fallback - Mapbox GL JS still not available');
            }
          }
        }, 1000);
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      source={{ html: webViewHTML }}
      style={{ flex: 1 }}
      onMessage={onMessage}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onLoadProgress={onLoadProgress}
      onError={onError}
      onHttpError={onHttpError}
      renderError={renderError}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={false}
      bounces={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
});

export default Map;
