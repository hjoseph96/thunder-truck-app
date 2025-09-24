import { useEffect, useRef, useState } from 'react';
import { updateCourierPosition } from './courier-mutations';
import { googleMapsRoutingService } from './google-maps-routing-service';

/**
 * Custom hook for demo functionality that simulates courier movement
 * Fetches real route using fetchNavigationRoute and emits updateCourierLocation mutations every interval
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.from - Starting location {latitude, longitude}
 * @param {Object} options.to - Destination location {latitude, longitude}
 * @param {boolean} options.enabled - Whether the demo is active
 * @param {number} options.interval - Update interval in milliseconds (default: 5000)
 * @param {number} options.totalDuration - Total time to complete journey in milliseconds (default: 120000)
 * @returns {Object} Hook state and controls
 */
export const useCourierDemo = ({
  from,
  to,
  enabled = false,
  interval = 5000,
  totalDuration = 120000, // 2 minutes total
} = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const intervalRef = useRef(null);

  // Fetch route from backend when from/to coordinates change
  useEffect(() => {
    // Reset route when disabled
    if (!enabled) {
      setRouteCoordinates(null);
      setIsLoadingRoute(false);
      return;
    }

    // Wait for both locations to be available
    if (!from || !to) {
      console.log('🗺️ Demo: Waiting for locations...', { from: !!from, to: !!to });
      setRouteCoordinates(null);
      setIsLoadingRoute(false);
      return;
    }

    // Validate coordinates
    if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) {
      console.log('🗺️ Demo: Invalid coordinates', { from, to });
      setRouteCoordinates(null);
      setIsLoadingRoute(false);
      return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      setError(null);

      try {
        console.log('🗺️ Demo: Fetching route from backend...', { from, to });
        const route = await googleMapsRoutingService.fetchRoute(from, to);

        if (route && route.coordinates && route.coordinates.length > 0) {
          setRouteCoordinates(route.coordinates);
          console.log(`🗺️ Demo: Route fetched with ${route.coordinates.length} coordinates`);
        } else {
          throw new Error('No route coordinates returned');
        }
      } catch (err) {
        console.error('❌ Demo: Failed to fetch route:', err);
        setError(`Failed to fetch route: ${err.message}`);
        // Fallback to straight line route
        setRouteCoordinates([from, to]);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [from, to, enabled]);

  // Calculate total steps to complete demo in desired duration
  const getTotalSteps = () => {
    return Math.floor(totalDuration / interval); // e.g., 120000ms / 5000ms = 24 steps
  };

  // Get current position based on step, spreading across entire route
  const getCurrentPosition = (step) => {
    if (!routeCoordinates || routeCoordinates.length === 0) return null;

    if (routeCoordinates.length === 1) {
      return routeCoordinates[0];
    }

    const totalSteps = getTotalSteps();
    const routeProgress = step / totalSteps; // 0 to 1
    const routeIndex = Math.floor(routeProgress * (routeCoordinates.length - 1));

    return routeCoordinates[Math.min(routeIndex, routeCoordinates.length - 1)];
  };

  // Auto-start/stop demo based on enabled state
  useEffect(() => {
    if (enabled && routeCoordinates && routeCoordinates.length > 0 && !isActive) {
      // Auto-start demo when delivering status is set and route is ready
      console.log('🚚 Demo: Auto-starting courier demo');
      setCurrentStep(0);
      setIsActive(true);
      setError(null);
    } else if (!enabled && isActive) {
      // Auto-stop demo when no longer in delivering status
      console.log('🛑 Demo: Auto-stopping courier demo');
      setIsActive(false);
      setCurrentStep(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [enabled, routeCoordinates, isActive]);

  // Main effect for handling the demo logic with proper step management
  useEffect(() => {
    if (!enabled || !isActive || !routeCoordinates || routeCoordinates.length === 0) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval that properly manages steps
    intervalRef.current = setInterval(() => {
      setCurrentStep((prevStep) => {
        const totalSteps = Math.floor(totalDuration / interval);

        // Calculate current position based on previous step
        const position = getCurrentPosition(prevStep);
        if (!position) return prevStep;

        // Send mutation to update courier position
        console.log(
          `🚚 Demo: Updating courier position (step ${prevStep}/${totalSteps})`,
          position,
        );

        updateCourierPosition(position.latitude, position.longitude)
          .then(() => {
            console.log('✅ Courier position updated successfully');
            setCurrentPosition(position);
          })
          .catch((err) => {
            console.error('❌ Demo: Error updating courier position:', err);
            setError(err.message);
            setIsActive(false);
          });

        // Check if journey is complete
        if (prevStep >= totalSteps - 1) {
          console.log('🏁 Demo: Courier journey completed');
          setIsActive(false);
          return prevStep; // Don't increment past total
        }

        return prevStep + 1;
      });
    }, interval);

    // Cleanup interval on unmount or when demo stops
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isActive, routeCoordinates, interval, totalDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const totalSteps = Math.floor(totalDuration / interval);

  return {
    // State
    currentStep,
    currentPosition,
    isActive,
    error,
    routeCoordinates,
    isLoadingRoute,
    progress: totalSteps > 0 ? currentStep / totalSteps : 0,
    isComplete: currentStep >= totalSteps && totalSteps > 0,
  };
};

export default useCourierDemo;
