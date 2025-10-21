import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchOrder, formatOrderForDisplay, submitMenuItemReviews, submitFoodTruckReview } from '../lib/order-service';
import { fetchMenuItem } from '../lib/menu-item-service';
import MapWebview from '../components/MapWebview';
import { courierTrackingManager } from '../lib/courier-tracking-service';
import MenuItemReviewModal from './MenuItemReviewModal';
import FoodTruckReviewModal from './FoodTruckReviewModal';
import { useLocationManager } from '../lib/hooks/useLocationManager';
import { googleMapsRoutingService } from '../lib/google-maps-routing-service';

// Development-only imports (will be tree-shaken in production builds)
let DevelopmentControls = null;
if (__DEV__) {
  DevelopmentControls = require('./DevelopmentControls').default;
}

const { width: screenWidth } = Dimensions.get('window');

// Rating Component
const RatingComponent = ({ orderId }) => {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleStarPress = (value) => {
    setRating(value);
  };

  const handleSubmitRating = async () => {
    try {
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  if (submitted) {
    return (
      <View style={styles.ratingSuccess}>
        <Svg width="48" height="48" viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="20" fill="#4CAF50" />
          <Path
            d="M16 24L21 29L32 18"
            stroke="#FFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.ratingSuccessText}>Thank you for your feedback!</Text>
      </View>
    );
  }

  return (
    <View style={styles.ratingContainer}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Svg width="32" height="32" viewBox="0 0 32 32">
              <Path
                d="M16 2L20.12 10.24L29.36 11.66L22.68 18.14L24.24 27.34L16 23L7.76 27.34L9.32 18.14L2.64 11.66L11.88 10.24L16 2Z"
                fill={star <= rating ? '#FFD700' : '#E0E0E0'}
                stroke={star <= rating ? '#FFD700' : '#E0E0E0'}
                strokeWidth="1"
              />
            </Svg>
          </TouchableOpacity>
        ))}
      </View>

      {rating > 0 && (
        <TouchableOpacity style={styles.rateButton} onPress={handleSubmitRating}>
          <Text style={styles.rateButtonText}>Rate your order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [truckLocation, setTruckLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [isExpanded, setIsExpanded] = useState(false);
  const [courierID, setCourierID] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);
  const [menuItemImages, setMenuItemImages] = useState({});
  
  // Review system state
  const [showMenuItemReviewModal, setShowMenuItemReviewModal] = useState(false);
  const [showFoodTruckReviewModal, setShowFoodTruckReviewModal] = useState(false);
  const [reviewTimer, setReviewTimer] = useState(null);
  const [hasShownReviews, setHasShownReviews] = useState(false);

  // Location manager hook for user's current location
  const { userLocation, locationPermissionGranted, moveToCurrentLocation } = useLocationManager();

  const mapRef = useRef(null);

  // Animation values
  const bottomSheetHeight = useRef(new Animated.Value(120)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;

  const VALID_STATUSES = [
    'pending',
    'preparing',
    'picking_up',
    'delivering',
    'completed',
    'cancelled',
  ];

  // Function to fetch menu item images
  const fetchMenuItemImages = async (orderItems) => {
    if (!orderItems || orderItems.length === 0) return;

    const imagePromises = orderItems.map(async (item) => {
      if (!item.menuItemId) return null;
      
      try {
        const menuItemData = await fetchMenuItem(item.menuItemId);
        const imageUrl = menuItemData?.menuItem?.imageUrl;
        
        if (imageUrl) {
          return {
            menuItemId: item.menuItemId,
            imageUrl: imageUrl,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch image for menu item ${item.menuItemId}:`, error);
      }
      
      return null;
    });

    try {
      const imageResults = await Promise.all(imagePromises);
      const imageMap = {};
      
      imageResults.forEach((result) => {
        if (result) {
          imageMap[result.menuItemId] = result.imageUrl;
        }
      });
      
      setMenuItemImages(imageMap);
    } catch (error) {
      console.error('Error fetching menu item images:', error);
    }
  };

  // Animation function for bottom sheet
  const toggleBottomSheet = () => {
    const screenHeight = Dimensions.get('window').height;
    const expandedHeight = screenHeight * 0.7;
    const collapsedHeight = 120;

    const toValue = isExpanded ? collapsedHeight : expandedHeight;
    const arrowToValue = isExpanded ? 0 : 1;

    // Animate height
    Animated.timing(bottomSheetHeight, {
      toValue: toValue,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // Animate arrow rotation
    Animated.timing(arrowRotation, {
      toValue: arrowToValue,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();

    setIsExpanded(!isExpanded);
  };

  // Review system functions
  const startReviewTimer = () => {
    // Clear any existing timer
    if (reviewTimer) {
      clearTimeout(reviewTimer);
    }

    // Set timer for 20 minutes (20 * 60 * 1000 milliseconds)
    const timer = setTimeout(() => {
      if (currentStatus === 'completed' && !hasShownReviews) {
        setShowMenuItemReviewModal(true);
        setHasShownReviews(true);
      }
    }, 20 * 60 * 1000); // 20 minutes

    setReviewTimer(timer);
  };

  const handleMenuItemReviewsSubmit = async (reviews) => {
    try {
      // TODO: Enable API call after backend implementation
      // const result = await submitMenuItemReviews(orderId, reviews);
      
      // Simulate API call for now
      console.log('Menu item reviews to be submitted:', {
        orderId,
        reviews
      });
      
      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Menu item reviews submitted successfully (simulated)');
      
      setShowMenuItemReviewModal(false);
      setShowFoodTruckReviewModal(true);
    } catch (error) {
      console.error('Error submitting menu item reviews:', error);
      // Keep modal open on error so user can retry
    }
  };

  const handleFoodTruckReviewSubmit = async (review) => {
    try {
      // TODO: Enable API call after backend implementation
      // const result = await submitFoodTruckReview(orderId, review);
      
      // Simulate API call for now
      console.log('Food truck review to be submitted:', {
        orderId,
        review
      });
      
      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Food truck review submitted successfully (simulated)');
      
      setShowFoodTruckReviewModal(false);
    } catch (error) {
      console.error('Error submitting food truck review:', error);
      // Keep modal open on error so user can retry
    }
  };

  const handleCloseMenuItemReviewModal = () => {
    setShowMenuItemReviewModal(false);
    setShowFoodTruckReviewModal(true);
  };

  const handleCloseFoodTruckReviewModal = () => {
    setShowFoodTruckReviewModal(false);
  };

  useEffect(() => {
    const loadOrderDetails = async () => {
      setLoading(true);
      try {
        const orderData = await fetchOrder(orderId);
        const formattedOrder = formatOrderForDisplay(orderData);
        setOrder(formattedOrder);
        setCurrentStatus(formattedOrder.status);

        // TODO: Enable menu item image fetching after backend implementation
        // Fetch menu item images for order items
        // if (formattedOrder.formattedItems && formattedOrder.formattedItems.length > 0) {
        //   fetchMenuItemImages(formattedOrder.formattedItems);
        // }

        // Set food truck coordinates with validation
        if (orderData.foodTruck?.latitude && orderData.foodTruck?.longitude) {
          const truckCoords = {
            latitude: orderData.foodTruck.latitude,
            longitude: orderData.foodTruck.longitude,
          };
          
          // Use the truck coordinates immediately (optimistic)
          setTruckLocation(truckCoords);
          
          // Validate in background - if invalid, update to fallback
          // This prevents UI blocking while still ensuring valid locations
          (async () => {
            try {
              // Get destination to test routing
              const latLongString = orderData.orderAddresses?.[0]?.latlong;
              let destinationCoords = null;
              
              if (latLongString) {
                const matches = latLongString.match(/POINT \(([-\d.]+) ([-\d.]+)\)/);
                if (matches && matches.length === 3) {
                  destinationCoords = {
                    longitude: parseFloat(matches[1]),
                    latitude: parseFloat(matches[2]),
                  };
                }
              }
              
              // If we have a destination, validate truck location can be routed to
              if (destinationCoords) {
                const routeData = await googleMapsRoutingService.fetchRoute(
                  truckCoords,
                  destinationCoords,
                  { profile: 'driving' }
                );
                
                // If routing fails or returns invalid route, use fallback
                if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
                  console.warn('[VALIDATION] Food truck location cannot be routed to - using fallback');
                  console.warn('[VALIDATION] Invalid coords:', truckCoords);
                  setTruckLocation({
                    latitude: 40.7128,
                    longitude: -73.9600,
                  });
                } else {
                  console.log('[VALIDATION] ✅ Food truck location is valid');
                }
              }
            } catch (error) {
              console.warn('[VALIDATION] Location validation failed, using fallback:', error.message);
              setTruckLocation({
                latitude: 40.7128,
                longitude: -73.9600,
              });
            }
          })();
        }

        // Parse and set destination coordinates
        const latLongString = orderData.orderAddresses?.[0]?.latlong;
        if (latLongString) {
          const matches = latLongString.match(/POINT \(([-\d.]+) ([-\d.]+)\)/);
          if (matches && matches.length === 3) {
            setDestinationLocation({
              longitude: parseFloat(matches[1]),
              latitude: parseFloat(matches[2]),
            });
          }
        }
      } catch (error) {
        console.error('Error loading order details:', error);
        setOrder(null); // Set order to null on failure
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderDetails();
      setCourierID(
        order?.courier_id == null ? '2e68f661-d271-44c4-9a00-23d99d77f251' : order?.courier_id,
      );
    } else {
      setLoading(false);
      setOrder(null);
    }
  }, [orderId]);

  useEffect(() => {
    // Handle courier tracking for both picking_up and delivering statuses
    const isTrackingStatus = currentStatus === 'picking_up' || currentStatus === 'delivering';

    if (isTrackingStatus && courierID && mapRef.current) {
      // Determine destination based on current status:
      // - picking_up: courier goes to food truck
      // - delivering: courier goes to customer address
      const courierDestination =
        currentStatus === 'picking_up' ? truckLocation : destinationLocation;

      // Only proceed if we have a valid destination
      if (!courierDestination) {
        console.warn(
          `Cannot track courier: missing ${currentStatus === 'picking_up' ? 'truck' : 'destination'} location`,
        );
        return;
      }

      // Add courier to tracking system with appropriate destination
      courierTrackingManager.addCourier(
        courierID,
        `Courier for ${orderId}`,
        null,
        null,
        courierDestination,
      );

      // Subscribe to courier tracking manager notifications
      const unsubscribe = courierTrackingManager.subscribe((event, data) => {
        // Only process events for this order's courier
        if (event === 'courierLocationUpdated' && data.courier && data.courier.id === courierID) {
          // Update courier location state for map rendering
          setCourierLocation({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          });
        }
      });

      // Cleanup subscription when effect unmounts or status changes
      return () => {
        unsubscribe();
        // Remove courier from tracking system
        if (mapRef.current && mapRef.current.removeCourier) {
          mapRef.current.removeCourier(courierID);
        }
      };
    }
  }, [currentStatus, courierID, truckLocation, destinationLocation, orderId]);

  // Effect to handle review timer when order is completed
  useEffect(() => {
    if (currentStatus === 'completed' && !hasShownReviews) {
      startReviewTimer();
    }

    // Cleanup timer on unmount or status change
    return () => {
      if (reviewTimer) {
        clearTimeout(reviewTimer);
        setReviewTimer(null);
      }
    };
  }, [currentStatus, hasShownReviews]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Order received',
          subtitle: 'Estimated arrival 12:05-12:25',
          color: '#4CAF50',
        };
      case 'preparing':
        return {
          title: 'Preparing your order...',
          subtitle: 'Estimated arrival 12:05-12:25',
          color: '#FF6B35',
        };
      case 'picking_up':
        return {
          title: 'Courier is picking up the order',
          subtitle: estimatedTime || 'Your order will be on its way soon',
          color: '#9C27B0',
        };
      case 'delivering':
        return {
          title: 'The order is headed your way!',
          subtitle: estimatedTime || 'Estimated arrival 12:05-12:25',
          color: '#2196F3',
        };
      case 'completed':
        return {
          title: 'Order delivered',
          subtitle: 'Thank you for choosing ThunderTruck',
          color: '#4CAF50',
        };
      case 'cancelled':
        return {
          title: 'Order cancelled',
          subtitle: 'Your payment has been refunded',
          color: '#F44336',
        };
      default:
        return {
          title: 'Order status unknown',
          subtitle: '',
          color: '#666',
        };
    }
  };

  const renderStatusImages = () => {
    // Show map for both picking_up and delivering statuses
    if (currentStatus === 'picking_up' || currentStatus === 'delivering') {
      return (
        <View style={styles.visualSectionLarge}>
          <MapWebview
            key={order.id}
            ref={mapRef}
            truckLocation={truckLocation}
            destinationLocation={destinationLocation}
            courierLocation={courierLocation}
            userLocation={userLocation}
            locationPermissionGranted={locationPermissionGranted}
            onGPSButtonPress={moveToCurrentLocation}
            fitToElements={true}
          />
        </View>
      );
    }

    return (
      <View style={styles.visualSection}>
        <View style={styles.illustrationContainer}>{renderStatusIllustration(currentStatus)}</View>
      </View>
    );
  };

  const renderStatusIllustration = (status) => {
    switch (status) {
      case 'pending':
        return (
          <View style={styles.illustrationGrid}>
            {/* Order Icon */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#F8F9FA" stroke="#E5E5E5" strokeWidth="2" />
                {/* Clipboard */}
                <Rect
                  x="25"
                  y="15"
                  width="30"
                  height="40"
                  rx="3"
                  fill="#FFF"
                  stroke="#DDD"
                  strokeWidth="2"
                />
                <Rect x="30" y="10" width="20" height="8" rx="2" fill="#2D1E2F" />
                {/* Text lines */}
                <Rect x="30" y="25" width="20" height="2" rx="1" fill="#DDD" />
                <Rect x="30" y="30" width="15" height="2" rx="1" fill="#DDD" />
                <Rect x="30" y="35" width="18" height="2" rx="1" fill="#DDD" />
                {/* Checkmark */}
                <Circle cx="45" cy="45" r="8" fill="#4CAF50" />
                <Path
                  d="M41 45 L44 48 L49 42"
                  stroke="#FFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Food Preparation Icon */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#FFF4E6" stroke="#FFE0B3" strokeWidth="2" />
                {/* Chef hat */}
                <Path
                  d="M25 35 Q25 25 35 25 Q40 20 45 25 Q55 25 55 35 Q55 40 50 40 L30 40 Q25 40 25 35 Z"
                  fill="#FFF"
                  stroke="#DDD"
                  strokeWidth="1"
                />
                <Rect
                  x="28"
                  y="40"
                  width="24"
                  height="8"
                  fill="#FFF"
                  stroke="#DDD"
                  strokeWidth="1"
                />
                {/* Cooking utensils */}
                <Path d="M35 50 L35 65" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
                <Path d="M45 50 L45 65" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
                <Ellipse cx="35" cy="48" rx="3" ry="2" fill="#C0C0C0" />
                <Ellipse cx="45" cy="48" rx="3" ry="2" fill="#C0C0C0" />
              </Svg>
            </View>

            {/* Clock Icon */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#E3F2FD" stroke="#BBDEFB" strokeWidth="2" />
                {/* Clock face */}
                <Circle cx="40" cy="40" r="20" fill="#FFF" stroke="#2196F3" strokeWidth="2" />
                {/* Clock hands */}
                <Path d="M40 40 L40 25" stroke="#2196F3" strokeWidth="3" strokeLinecap="round" />
                <Path d="M40 40 L50 40" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" />
                <Circle cx="40" cy="40" r="2" fill="#2196F3" />
                {/* Clock numbers */}
                <Circle cx="40" cy="22" r="1" fill="#666" />
                <Circle cx="58" cy="40" r="1" fill="#666" />
                <Circle cx="40" cy="58" r="1" fill="#666" />
                <Circle cx="22" cy="40" r="1" fill="#666" />
              </Svg>
            </View>
          </View>
        );
      case 'preparing':
        return (
          <View style={styles.illustrationGrid}>
            {/* Cooking Pan */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#FFF3E0" stroke="#FFCC80" strokeWidth="2" />
                {/* Pan */}
                <Ellipse cx="40" cy="45" rx="18" ry="12" fill="#424242" />
                <Ellipse cx="40" cy="43" rx="16" ry="10" fill="#616161" />
                {/* Handle */}
                <Rect x="58" y="42" width="12" height="3" rx="1.5" fill="#8D6E63" />
                {/* Food items */}
                <Circle cx="35" cy="43" r="3" fill="#FF6347" />
                <Circle cx="45" cy="41" r="2.5" fill="#32CD32" />
                <Circle cx="40" cy="47" r="2" fill="#FFD700" />
                {/* Steam */}
                <Path
                  d="M30 30 Q32 25 30 20"
                  stroke="#E0E0E0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M40 28 Q42 23 40 18"
                  stroke="#E0E0E0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M50 30 Q52 25 50 20"
                  stroke="#E0E0E0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>

            {/* Oven/Grill */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#FFEBEE" stroke="#FFCDD2" strokeWidth="2" />
                {/* Oven body */}
                <Rect x="20" y="25" width="40" height="35" rx="4" fill="#37474F" />
                <Rect x="22" y="27" width="36" height="31" rx="2" fill="#546E7A" />
                {/* Oven window */}
                <Rect x="25" y="30" width="30" height="20" rx="2" fill="#263238" />
                <Rect x="27" y="32" width="26" height="16" rx="1" fill="#FFB74D" opacity="0.7" />
                {/* Control knobs */}
                <Circle cx="30" cy="55" r="3" fill="#607D8B" />
                <Circle cx="40" cy="55" r="3" fill="#607D8B" />
                <Circle cx="50" cy="55" r="3" fill="#607D8B" />
                {/* Heat indicator */}
                <Circle cx="40" cy="40" r="2" fill="#FF5722" />
              </Svg>
            </View>

            {/* Timer */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#F3E5F5" stroke="#CE93D8" strokeWidth="2" />
                {/* Timer body */}
                <Circle cx="40" cy="42" r="18" fill="#FFF" stroke="#9C27B0" strokeWidth="2" />
                {/* Timer top */}
                <Rect x="37" y="20" width="6" height="4" rx="1" fill="#9C27B0" />
                {/* Winding key */}
                <Circle cx="40" cy="18" r="2" fill="#9C27B0" />
                <Rect x="39" y="12" width="2" height="6" fill="#9C27B0" />
                {/* Timer hands */}
                <Path d="M40 42 L40 30" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
                <Path d="M40 42 L48 45" stroke="#9C27B0" strokeWidth="1.5" strokeLinecap="round" />
                <Circle cx="40" cy="42" r="1.5" fill="#9C27B0" />
                {/* Numbers */}
                <SvgText
                  x="40"
                  y="28"
                  textAnchor="middle"
                  fill="#9C27B0"
                  fontSize="6"
                  fontWeight="bold"
                >
                  12
                </SvgText>
                <SvgText
                  x="52"
                  y="45"
                  textAnchor="middle"
                  fill="#9C27B0"
                  fontSize="6"
                  fontWeight="bold"
                >
                  3
                </SvgText>
              </Svg>
            </View>
          </View>
        );
      case 'completed':
        return (
          <View style={styles.illustrationGrid}>
            {/* Success Checkmark */}
            <View style={styles.illustrationItem}>
              <Svg width="100" height="80" viewBox="0 0 100 80">
                {/* Background circle */}
                <Circle cx="50" cy="40" r="35" fill="#E8F5E8" stroke="#A5D6A7" strokeWidth="2" />
                {/* Main checkmark circle */}
                <Circle cx="50" cy="40" r="25" fill="#4CAF50" />
                {/* Checkmark */}
                <Path
                  d="M35 40 L45 50 L65 28"
                  stroke="#FFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Confetti */}
                <Circle cx="25" cy="20" r="2" fill="#FFD700" />
                <Circle cx="75" cy="25" r="1.5" fill="#FF6B6B" />
                <Circle cx="20" cy="60" r="1.5" fill="#4ECDC4" />
                <Circle cx="80" cy="55" r="2" fill="#45B7D1" />
                <Rect
                  x="30"
                  y="15"
                  width="3"
                  height="3"
                  fill="#96CEB4"
                  transform="rotate(45 31.5 16.5)"
                />
                <Rect
                  x="70"
                  y="60"
                  width="3"
                  height="3"
                  fill="#FECA57"
                  transform="rotate(45 71.5 61.5)"
                />
              </Svg>
            </View>

            {/* Delivery Box */}
            <View style={styles.illustrationItem}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <Circle cx="40" cy="40" r="35" fill="#FFF8E1" stroke="#FFE082" strokeWidth="2" />
                {/* Box */}
                <Rect x="20" y="30" width="40" height="30" rx="4" fill="#8D6E63" />
                <Rect x="22" y="32" width="36" height="26" rx="2" fill="#A1887F" />
                {/* Box handle/string */}
                <Path
                  d="M25 30 L25 25 Q25 20 30 20 L50 20 Q55 20 55 25 L55 30"
                  stroke="#6D4C41"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Delivered stamp */}
                <Circle cx="55" cy="45" r="12" fill="#4CAF50" opacity="0.9" />
                <SvgText
                  x="55"
                  y="42"
                  textAnchor="middle"
                  fill="#FFF"
                  fontSize="5"
                  fontWeight="bold"
                >
                  DELIVERED
                </SvgText>
                <SvgText
                  x="55"
                  y="48"
                  textAnchor="middle"
                  fill="#FFF"
                  fontSize="5"
                  fontWeight="bold"
                >
                  ✓
                </SvgText>
              </Svg>
            </View>
          </View>
        );
      case 'cancelled':
        return (
          <View style={styles.illustrationGrid}>
            {/* Cancelled Icon */}
            <View style={styles.illustrationItem}>
              <Svg width="100" height="80" viewBox="0 0 100 80">
                {/* Background circle */}
                <Circle cx="50" cy="40" r="35" fill="#FFEBEE" stroke="#FFCDD2" strokeWidth="2" />
                {/* Main circle */}
                <Circle cx="50" cy="40" r="25" fill="#F44336" />
                {/* X mark */}
                <Path
                  d="M35 25 L65 55 M65 25 L35 55"
                  stroke="#FFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Sad elements */}
                <Circle cx="30" cy="25" r="1.5" fill="#BDBDBD" opacity="0.7" />
                <Circle cx="70" cy="55" r="1.5" fill="#BDBDBD" opacity="0.7" />
                <Path
                  d="M25 60 Q30 65 35 60"
                  stroke="#BDBDBD"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
              </Svg>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D1E2F" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(currentStatus);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="#2D1E2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
        <TouchableOpacity>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Development Controls (only in dev mode) */}
      {__DEV__ && DevelopmentControls && (
        <DevelopmentControls
          currentStatus={currentStatus}
          setCurrentStatus={setCurrentStatus}
          validStatuses={VALID_STATUSES}
          courierLocation={courierLocation}
          truckLocation={truckLocation}
          destinationLocation={destinationLocation}
          mapRef={mapRef}
          onTriggerReviews={() => {
            setShowMenuItemReviewModal(true);
            setHasShownReviews(true);
          }}
        />
      )}

      <View style={styles.content}>
        {/* Section 1: Status Information */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>{statusConfig.title}</Text>
          <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
        </View>

        {/* Section 2: Visual Content (Images or Map) */}
        {renderStatusImages()}
      </View>

      {/* Section 3: Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
        {/* Bottom Sheet Handle */}
        <View style={styles.bottomSheetHandle} />

        <TouchableOpacity
          style={styles.bottomSheetHeader}
          onPress={toggleBottomSheet}
          activeOpacity={0.7}
        >
          {/* Always visible summary */}
          <View style={styles.bottomSheetSummary}>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>
                {order.foodTruck?.name || 'Unknown Restaurant'}
              </Text>
              <Text style={styles.orderSummary}>
                {order.formattedItems?.length || 0} items • ${order.total}
              </Text>
            </View>
            <Animated.View
              style={[
                styles.expandIcon,
                {
                  transform: [
                    {
                      rotate: arrowRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Expandable content */}
        {isExpanded && (
          <ScrollView style={styles.bottomSheetScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.expandedContent}>
              {/* Order Items */}
              <View style={styles.expandedSection}>
                <Text style={styles.expandedSectionTitle}>Your order</Text>
                {order.formattedItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemCheckbox}>
                      <Svg width="16" height="16" viewBox="0 0 16 16">
                        <Path
                          d="M3 8L6 11L13 4"
                          stroke="#4CAF50"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                    {/* Menu item image */}
                    {item.menuItemId && (
                      <View style={styles.itemImageContainer}>
                        {/* TODO: Enable menu item images after backend implementation */}
                        {/* {menuItemImages[item.menuItemId] ? (
                          <Image
                            source={{ uri: menuItemImages[item.menuItemId] }}
                            style={styles.itemImage}
                            resizeMode="cover"
                            onError={() => {
                              // Remove failed image from state to show placeholder
                              setMenuItemImages(prev => {
                                const updated = { ...prev };
                                delete updated[item.menuItemId];
                                return updated;
                              });
                            }}
                          />
                        ) : ( */}
                          <View style={styles.itemImagePlaceholder}>
                            <MaterialIcons name="restaurant" size={20} color="#999" />
                          </View>
                        {/* )} */}
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.menuItemName}</Text>
                    </View>
                    <Text style={styles.itemPrice}>${item.price}</Text>
                  </View>
                ))}
              </View>

              {/* Order Details */}
              <View style={styles.expandedSection}>
                <Text style={styles.expandedSectionTitle}>Order Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order ID</Text>
                  <Text style={styles.infoValue}>#{order.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subtotal</Text>
                  <Text style={styles.infoValue}>${order.subtotal}</Text>
                </View>
                {order.deliveryFee !== '0.00' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Fee</Text>
                    <Text style={styles.infoValue}>${order.deliveryFee}</Text>
                  </View>
                )}
                {order.tip !== '0.00' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tip</Text>
                    <Text style={styles.infoValue}>${order.tip}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total</Text>
                  <Text style={[styles.infoValue, styles.totalAmount]}>${order.total}</Text>
                </View>
              </View>

              {/* Delivery Address */}
              {order.formattedAddress && (
                <View style={styles.expandedSection}>
                  <Text style={styles.expandedSectionTitle}>Delivery Address</Text>
                  <Text style={styles.addressText}>{order.formattedAddress.fullAddress}</Text>
                  {order.orderAddresses?.[0]?.deliveryInstructions && (
                    <Text style={styles.instructionsText}>
                      Instructions: {order.orderAddresses[0].deliveryInstructions}
                    </Text>
                  )}
                </View>
              )}

              {/* Rating for completed orders */}
              {currentStatus === 'completed' && (
                <View style={styles.expandedSection}>
                  <Text style={styles.expandedSectionTitle}>Rate your order</Text>
                  <Text style={styles.ratingMessage}>How was your experience?</Text>
                  <RatingComponent orderId={order.id} />
                </View>
              )}

              {/* Help Section for non-completed orders */}
              {currentStatus !== 'completed' && (
                <View style={styles.expandedSection}>
                  <Text style={styles.expandedSectionTitle}>Need help?</Text>
                  <Text style={styles.helpMessage}>
                    Have an issue with your order? You can call the store for more information about
                    your delivery.
                  </Text>
                  <TouchableOpacity style={styles.callButton}>
                    <Svg width="20" height="20" viewBox="0 0 20 20">
                      <Path
                        d="M2 3C2 2.44772 2.44772 2 3 2H5.15287C5.64171 2 6.0589 2.35341 6.13927 2.8356L6.87858 7.27147C6.95075 7.70451 6.73206 8.13397 6.3394 8.3303L4.79126 9.10437C5.90756 11.8783 8.12168 14.0924 10.8956 15.2087L11.6697 13.6606C11.866 13.2679 12.2955 13.0492 12.7285 13.1214L17.1644 13.8607C17.6466 13.9411 18 14.3583 18 14.8471V17C18 17.5523 17.5523 18 17 18H15C7.8203 18 2 12.1797 2 5V3Z"
                        fill="#2D1E2F"
                      />
                    </Svg>
                    <Text style={styles.callButtonText}>Call store</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Review Modals */}
      <MenuItemReviewModal
        visible={showMenuItemReviewModal}
        onClose={handleCloseMenuItemReviewModal}
        menuItems={order?.formattedItems || []}
        onSubmitReviews={handleMenuItemReviewsSubmit}
        menuItemImages={menuItemImages}
      />

      <FoodTruckReviewModal
        visible={showFoodTruckReviewModal}
        onClose={handleCloseFoodTruckReviewModal}
        foodTruckName={order?.foodTruck?.name || 'Food Truck'}
        onSubmitReview={handleFoodTruckReviewSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  helpText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 140, // Space for bottom sheet
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    fontFamily: 'Poppins',
  },
  // Section 1: Status Section (no card)
  statusSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  // Section 2: Visual Section (no card)
  visualSection: {
    minHeight: 250,
    marginBottom: 20,
  },
  visualSectionLarge: {
    flex: 1,
    marginBottom: 20,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  illustrationItem: {
    marginHorizontal: 10,
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section 3: Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  bottomSheetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomSheetScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  orderSummary: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  expandIcon: {
    marginLeft: 12,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  totalAmount: {
    fontWeight: '700',
    fontSize: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 8,
    fontStyle: 'italic',
  },
  helpMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    lineHeight: 20,
    marginBottom: 16,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginLeft: 8,
  },
  // Rating Component Styles
  ratingMessage: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    marginHorizontal: 4,
  },
  rateButton: {
    backgroundColor: '#2D1E2F',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  ratingSuccess: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  ratingSuccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Poppins',
    marginTop: 12,
  },
});
