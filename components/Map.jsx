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
        
        // Function to fit map bounds to show both routes
        function fitMapToAllRoutes() {
          try {
            if (!map) return;
            
            const bounds = new mapboxgl.LngLatBounds();
            
            // Add default route coordinates to bounds
            if (defaultRouteGeoJSON && defaultRouteGeoJSON.geometry && defaultRouteGeoJSON.geometry.coordinates) {
              defaultRouteGeoJSON.geometry.coordinates.forEach(coord => bounds.extend(coord));
            }
            
            // Add bike route coordinates to bounds
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
            
            // Add render event listener to draw both routes on every render
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
            
            // Add the route layer with the specified color #219ebc
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
              
              // Create a custom bike icon element
              const bikeIcon = document.createElement('div');
              bikeIcon.className = 'bike-icon';
              bikeIcon.innerHTML = '🚲'; // Using emoji as fallback
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
              
              // Create bike icon marker
              const bikeMarker = new mapboxgl.Marker(bikeIcon)
                .setLngLat(startCoord)
                .setPopup(new mapboxgl.Popup().setHTML('<b>🚲 Bike Route Start</b><br>Lng: ' + startCoord[0].toFixed(6) + '<br>Lat: ' + startCoord[1].toFixed(6)))
                .addTo(map);
              
              // End marker - coordinates are now in [longitude, latitude] format
              const endCoord = coordinates[coordinates.length - 1];
              console.log('WebView: Bike route end coordinate:', endCoord);
              
              const endMarker = new mapboxgl.Marker({ color: '#007cff' }) // Use the same color as the line
                .setLngLat(endCoord)
                .setPopup(new mapboxgl.Popup().setHTML('<b>Bike Route End</b><br>Lng: ' + endCoord[0].toFixed(6) + '<br>Lat: ' + endCoord[1].toFixed(6)))
                .addTo(map);
              
              console.log('WebView: Added bike icon at start:', startCoord);
              console.log('WebView: Added bike route end marker at:', endCoord);
            }

            console.log('WebView: Bike route added successfully');

          } catch (error) {
            console.error('WebView: Error adding bike route:', error);
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
