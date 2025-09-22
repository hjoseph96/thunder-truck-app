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
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';
import { fetchOrder, formatOrderForDisplay } from '../lib/order-service';
import { googleMapsRoutingService } from '../lib/google-maps-routing-service';
import Map from './Map';

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
      console.log('Submitting rating:', { orderId, rating });
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
  const [webViewReady, setWebViewReady] = useState(false);
  const [truckLocation, setTruckLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [isExpanded, setIsExpanded] = useState(false);
  const mapRef = useRef(null);

  // New state for simulation
  const [demoInterval, setDemoInterval] = useState(null);
  const [demoRoute, setDemoRoute] = useState(null);
  const [demoProgress, setDemoProgress] = useState(0);

  // Ref to hold state for interval
  const simulationStateRef = useRef({
    route: null,
    progress: 0,
  });

  // Animation values
  const bottomSheetHeight = useRef(new Animated.Value(120)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;

  const VALID_STATUSES = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];

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

  useEffect(() => {
    const loadOrderDetails = async () => {
      setLoading(true);
      try {
        const orderData = await fetchOrder(orderId);
        const formattedOrder = formatOrderForDisplay(orderData);
        setOrder(formattedOrder);
        setCurrentStatus(formattedOrder.status);

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

        // Set food truck coordinates
        if (orderData.foodTruck?.latitude && orderData.foodTruck?.longitude) {
          setTruckLocation({
            latitude: orderData.foodTruck.latitude,
            longitude: orderData.foodTruck.longitude,
          });
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
    } else {
      setLoading(false);
      setOrder(null);
    }
  }, [orderId]);

  // Courier simulation logic
  const stopCourierSimulation = () => {
    if (demoInterval) {
      clearInterval(demoInterval);
      setDemoInterval(null);
    }
    setDemoRoute(null);
    setDemoProgress(0);
    setCourierLocation(null);
    simulationStateRef.current = { route: null, progress: 0 };
  };

  const updateCourierSimulation = () => {
    const currentState = simulationStateRef.current;
    if (!currentState.route || currentState.route.length === 0) return;

    const newProgress = Math.min(currentState.progress + 0.05, 1); // Move 5% each step

    simulationStateRef.current.progress = newProgress;
    setDemoProgress(newProgress);

    const route = currentState.route;
    const totalSegments = route.length - 1;
    const currentSegmentFloat = newProgress * totalSegments;
    const segmentIndex = Math.floor(currentSegmentFloat);
    const segmentProgress = currentSegmentFloat - segmentIndex;

    const startPoint = route[segmentIndex];
    const endPoint = route[Math.min(segmentIndex + 1, route.length - 1)];

    const currentPosition = {
      latitude: startPoint.latitude + (endPoint.latitude - startPoint.latitude) * segmentProgress,
      longitude:
        startPoint.longitude + (endPoint.longitude - startPoint.longitude) * segmentProgress,
    };

    setCourierLocation(currentPosition);

    if (newProgress >= 1) {
      stopCourierSimulation();
    }
  };

  const startCourierSimulation = async (origin, destination) => {
    stopCourierSimulation(); // Stop any existing simulation

    try {
      const routeData = await googleMapsRoutingService.fetchRoute(origin, destination, {
        profile: 'driving',
      });
      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        throw new Error('Failed to get route from Google Maps API');
      }

      const route = routeData.coordinates;
      setDemoRoute(route);
      setCourierLocation(origin);
      simulationStateRef.current = { route, progress: 0 };

      const interval = setInterval(updateCourierSimulation, 2000); // Update every 2 seconds
      setDemoInterval(interval);
    } catch (error) {
      console.error('Failed to start courier simulation:', error);
    }
  };

  useEffect(() => {
    if (currentStatus === 'delivering' && truckLocation && destinationLocation) {
      startCourierSimulation(truckLocation, destinationLocation);
    } else {
      stopCourierSimulation();
    }

    return () => {
      stopCourierSimulation(); // Cleanup on unmount or status change
    };
  }, [currentStatus, truckLocation, destinationLocation]);

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
      case 'delivering':
        return {
          title: 'Heading your way...',
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
    if (currentStatus === 'delivering') {
      return (
        <View style={styles.visualSectionLarge}>
          <Map
            ref={mapRef}
            webViewReady={webViewReady}
            setWebViewReady={setWebViewReady}
            truckLocation={truckLocation}
            destinationLocation={destinationLocation}
            courierLocation={courierLocation}
            routePolyline={demoRoute}
            locationPermissionGranted={true}
            onMessage={() => {}}
            onLoadStart={() => console.log('Map loading started')}
            onLoadEnd={() => console.log('Map loading ended')}
            onError={(error) => console.error('Map error:', error)}
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
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Path
                  d="M15 10 L15 70 M10 65 L20 65 M12 68 L18 68"
                  stroke="#8B4513"
                  strokeWidth="2"
                  fill="none"
                />
                <Circle cx="15" cy="10" r="8" fill="#C0C0C0" />
                <Path d="M10 8 L10 12 M15 6 L15 14 M20 8 L20 12" stroke="#666" strokeWidth="1" />
              </Svg>
            </View>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Rect x="15" y="25" width="30" height="35" rx="5" fill="#8B4513" />
                <Rect x="18" y="28" width="24" height="29" rx="3" fill="#D2691E" />
                <Path
                  d="M45 35 Q50 35 50 40 Q50 45 45 45"
                  stroke="#8B4513"
                  strokeWidth="2"
                  fill="none"
                />
                <Ellipse cx="30" cy="25" rx="15" ry="3" fill="#F5DEB3" />
              </Svg>
            </View>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Rect x="20" y="20" width="20" height="50" rx="3" fill="#FFA500" />
                <Rect x="22" y="22" width="16" height="46" rx="2" fill="#FFD700" />
                <Rect x="25" y="15" width="10" height="10" rx="1" fill="#FF6347" />
                <Circle cx="30" cy="20" r="2" fill="#228B22" />
              </Svg>
            </View>
          </View>
        );
      case 'preparing':
        return (
          <View style={styles.illustrationGrid}>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Ellipse cx="30" cy="50" rx="25" ry="5" fill="#333" />
                <Ellipse cx="30" cy="48" rx="25" ry="5" fill="#444" />
                <Circle cx="20" cy="45" r="4" fill="#FF6347" />
                <Circle cx="30" cy="43" r="5" fill="#32CD32" />
                <Circle cx="40" cy="46" r="3" fill="#FFD700" />
                <Path d="M50 55 L60 65" stroke="#8B4513" strokeWidth="3" />
              </Svg>
            </View>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Path d="M10 40 Q10 60 30 60 Q50 60 50 40 L45 35 L15 35 Z" fill="#E6E6FA" />
                <Ellipse cx="30" cy="35" rx="17" ry="3" fill="#DDA0DD" />
                <Circle cx="25" cy="38" r="2" fill="#FF69B4" />
                <Circle cx="35" cy="42" r="1.5" fill="#FF1493" />
              </Svg>
            </View>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Circle cx="30" cy="40" r="20" fill="#FF4500" />
                <Circle cx="30" cy="40" r="17" fill="#FFF" />
                <Path d="M30 25 L30 40 L40 45" stroke="#333" strokeWidth="2" fill="none" />
                <Circle cx="30" cy="40" r="2" fill="#333" />
              </Svg>
            </View>
          </View>
        );
      case 'completed':
        return (
          <View style={styles.illustrationGrid}>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Circle cx="30" cy="40" r="25" fill="#4CAF50" />
                <Path
                  d="M15 40 L25 50 L45 25"
                  stroke="#FFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Rect x="15" y="30" width="30" height="35" rx="3" fill="#8B4513" />
                <Rect x="18" y="33" width="24" height="29" rx="2" fill="#D2691E" />
                <Path
                  d="M20 30 L20 25 Q20 20 25 20 L35 20 Q40 20 40 25 L40 30"
                  stroke="#8B4513"
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
            </View>
          </View>
        );
      case 'cancelled':
        return (
          <View style={styles.illustrationGrid}>
            <View style={styles.illustrationItem}>
              <Svg width="60" height="80" viewBox="0 0 60 80">
                <Circle cx="30" cy="40" r="25" fill="#F44336" />
                <Path
                  d="M20 30 L40 50 M40 30 L20 50"
                  stroke="#FFF"
                  strokeWidth="4"
                  strokeLinecap="round"
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

      {/* Demo Status Buttons */}
      <View style={styles.statusButtonsContainer}>
        <Text style={styles.demoLabel}>Demo: Test Order Statuses</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusButtonsScroll}
        >
          {VALID_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, currentStatus === status && styles.statusButtonActive]}
              onPress={() => setCurrentStatus(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  currentStatus === status && styles.statusButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
              <Svg width="20" height="20" viewBox="0 0 20 20">
                <Path
                  d="M5 8L10 13L15 8"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  helpText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  statusButtonsContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusButtonsScroll: {
    flexDirection: 'row',
  },
  statusButton: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusButtonActive: {
    backgroundColor: '#2D1E2F',
    borderColor: '#2D1E2F',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins',
  },
  statusButtonTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 140, // Space for bottom sheet
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
    marginHorizontal: 15,
    marginVertical: 10,
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
