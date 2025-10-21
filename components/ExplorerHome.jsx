import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, G, ClipPath, Rect, Defs } from 'react-native-svg';
import Carousel from '@brandingbrand/react-native-snap-carousel';
import { MaterialIcons } from '@expo/vector-icons';
import FoodTypesHeader from './FoodTypesHeader';
import OnboardingModal from './OnboardingModal';
import BottomNavigation from './BottomNavigation';
import { getNearbyFoodTrucksWithCache, getMockLocation } from '../lib/food-trucks-service';
import { getStoredUserData } from '../lib/token-manager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Determine if running on web
const isWeb = Platform.OS === 'web';
const isMobile = !isWeb;

export default function ExplorerHome({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nearbyFoodTrucks, setNearbyFoodTrucks] = useState([]);
  const [loadingFoodTrucks, setLoadingFoodTrucks] = useState(true);
  const [foodTrucksError, setFoodTrucksError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const carouselRef = useRef(null);
  
  // Animation values for each slide
  const slideAnimations = useRef(
    Array(5).fill(0).map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.7)
    }))
  ).current;

  const slideImages = [
      require('../assets/images/slide-1.png'),
      require('../assets/images/slide-2.png'),
      require('../assets/images/slide-3.png'),
      require('../assets/images/slide-4.png'),
      require('../assets/images/slide-5.png')
  ];

  // Load nearby food trucks and check user data on component mount
  useEffect(() => {
    checkUserData();
    loadNearbyFoodTrucks();
  }, []);

  const checkUserData = async () => {
    try {
      const user = await getStoredUserData();
      setUserData(user);

      if (user?.userAddresses?.length > 0 && !selectedAddress) {
        const defaultAddress = user.userAddresses.find(address => address.isDefault);
        setSelectedAddress(defaultAddress);
      }

      // Show onboarding if any required fields are missing
      if (!user || !user.email || !user.firstName || !user.lastName) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking user data:', error);
    }
  };

  const updateSelectedAddress = (address) => {
    setSelectedAddress(address);
  };

  const formatAddress = (address) => {
    if (!address) return 'No address set';
    
    const parts = [
      address.streetLineOne,
      address.streetLineTwo,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    const fullAddress = parts.join(', ');
    
    // Truncate if too long (similar to the static data)
    return fullAddress.length > 40 ? fullAddress.substring(0, 37) + '...' : fullAddress;
  };

  const loadNearbyFoodTrucks = async () => {
    try {
      setLoadingFoodTrucks(true);
      setFoodTrucksError(null);
      
      // Get mock location for testing (replace with actual user location)
      const location = getMockLocation();
      
      // Fetch nearby food trucks within 30 miles
      const result = await getNearbyFoodTrucksWithCache({
        ...location,
        radius: 30,
        page: 1
      });

      console.log('Nearby food trucks:', result);
      
      // Extract food trucks array from the result
      const foodTrucks = result.foodTrucks || [];
      
      // Take only the top 4 results
      const top4FoodTrucks = foodTrucks.slice(0, 4);
      setNearbyFoodTrucks(top4FoodTrucks);
    } catch (error) {
      console.error('Error loading nearby food trucks:', error);
      setFoodTrucksError(error.message || 'Failed to load nearby food trucks');
    } finally {
      setLoadingFoodTrucks(false);
    }
  };

  
  const handleFoodTruckPress = (foodTruck) => {
    // Navigate to FoodTruckViewer with only ID (clean URL routing)
    navigation.navigate('FoodTruckViewer', { 
      foodTruckId: foodTruck.id
    });
  };

  const handleOnboardingClose = async (wasSuccessful = false) => {
    setShowOnboarding(false);
    
    if (wasSuccessful) {
      // If onboarding was successful, update user data without re-checking
      // This prevents the modal from reopening
      try {
        const user = await getStoredUserData();
        setUserData(user);
        // Don't call checkUserData() to avoid reopening modal
      } catch (error) {
        console.error('Error updating user data after successful onboarding:', error);
      }
    } else {
      // If onboarding was cancelled/closed without completion, refresh user data
      await checkUserData();
    }
  };

  const renderSlideItem = ({ item, index }) => {
    const isActive = index === currentSlide;
    const animation = slideAnimations[index % slideAnimations.length]; // Use modulo to safely access animation
    
    return (
      <Animated.View 
        style={[
          styles.slideItem,
          {
            transform: [{ scale: animation.scale }],
            opacity: animation.opacity,
          }
        ]}
      >
        <Image
          source={item}
          style={styles.slideImage}
          resizeMode="cover"
        />
      </Animated.View>
    );
  };

  // Calculate responsive carousel width for web
  const getCarouselWidth = () => {
    if (Platform.OS === 'web') {
      // Max 1400px - 80px (40px padding on each side)
      return Math.min(screenWidth - 80, 1320);
    }
    return screenWidth;
  };

  const onSnapToItem = (index) => {
    // Use modulo to safely access animations for looping carousel
    const prevIndex = currentSlide % slideAnimations.length;
    const newIndex = index % slideAnimations.length;
    
    // Animate out the previous slide
    if (prevIndex !== newIndex) {
      Animated.parallel([
        Animated.spring(slideAnimations[prevIndex].scale, {
          toValue: 0.85,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimations[prevIndex].opacity, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    // Animate in the new slide
    Animated.parallel([
      Animated.spring(slideAnimations[newIndex].scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimations[newIndex].opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    setCurrentSlide(index);
  };
  
  // Initialize first slide animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnimations[0].scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimations[0].opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header - Fixed on web */}
      <View style={styles.header}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.searchIcon}>
            <Path d="M7.33335 12C9.91068 12 12 9.91068 12 7.33335C12 4.75602 9.91068 2.66669 7.33335 2.66669C4.75602 2.66669 2.66669 4.75602 2.66669 7.33335C2.66669 9.91068 4.75602 12 7.33335 12Z" fill="white" stroke="#fecd15" strokeWidth="1.33333"/>
            <Path d="M13.3334 13.3334L11.3334 11.3334" stroke="#fecd15" strokeWidth="1.33333" strokeLinecap="round"/>
          </Svg>

          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#000"
          />

          <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.micIcon}>
            <Path d="M8 9.33331C9.10667 9.33331 10 8.43998 10 7.33331V3.33331C10 2.22665 9.10667 1.33331 8 1.33331C6.89333 1.33331 6 2.22665 6 3.33331V7.33331C6 8.43998 6.89333 9.33331 8 9.33331Z" fill="black"/>
            <Path d="M11.3334 7.33331C11.3334 9.17331 9.84004 10.6666 8.00004 10.6666C6.16004 10.6666 4.66671 9.17331 4.66671 7.33331H3.33337C3.33337 9.68665 5.07337 11.62 7.33337 11.9466V14H8.66671V11.9466C10.9267 11.62 12.6667 9.68665 12.6667 7.33331H11.3334Z" fill="black"/>
          </Svg>
        </View>
      </View>

      {/* Location Bar - Fixed on web */}
      <View style={styles.locationBar}>
        <TouchableOpacity style={styles.locationContent} onPress={() => navigation.navigate('UserAddressList', { userAddresses: userData?.userAddresses, onAddressSelect: updateSelectedAddress })}>
          <MaterialIcons name="location-on" size={24} color="red" style={styles.locationIcon} />

          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>{selectedAddress?.label || 'Delivery Address'}</Text>
            <Text style={styles.locationAddress}>{formatAddress(selectedAddress)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.locationButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MapPage', { navigation: navigation, userData: userData })}
            style={styles.currentLocationButton}
            activeOpacity={0.7}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.currentLocationIcon}>
              <Path d="M12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z" fill="red"/>
              <Path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C12.1989 1.25 12.3897 1.32902 12.5303 1.46967C12.671 1.61032 12.75 1.80109 12.75 2V3.282C14.8038 3.45905 16.7293 4.35539 18.1869 5.81306C19.6446 7.27073 20.541 9.19616 20.718 11.25H22C22.1989 11.25 22.3897 11.329 22.5303 11.4697C22.671 11.6103 22.75 11.8011 22.75 12C22.75 12.1989 22.671 12.3897 22.5303 12.5303C22.3897 12.671 22.1989 12.75 22 12.75H20.718C20.541 14.8038 19.6446 16.7293 18.1869 18.1869C16.7293 19.6446 14.8038 20.541 12.75 20.718V22C12.75 22.1989 12.671 22.3897 12.5303 22.5303C12.3897 22.671 12.1989 22.75 12 22.75C11.8011 22.75 11.6103 22.671 11.4697 22.5303C11.329 22.3897 11.25 22.1989 11.25 22V20.718C9.19616 20.541 7.27073 19.6446 5.81306 18.1869C4.35539 16.7293 3.45905 14.8038 3.282 12.75H2C1.80109 12.75 1.61032 12.671 1.46967 12.5303C1.32902 12.3897 1.25 12.1989 1.25 12C1.25 11.8011 1.32902 11.6103 1.46967 11.4697C1.61032 11.329 1.80109 11.25 2 11.25H3.282C3.45905 9.19616 4.35539 7.27073 5.81306 5.81306C7.27073 4.35539 9.19616 3.45905 11.25 3.282V2C11.25 1.80109 11.329 1.61032 11.4697 1.46967C11.6103 1.32902 11.8011 1.25 12 1.25ZM4.75 12C4.75 12.9521 4.93753 13.8948 5.30187 14.7745C5.66622 15.6541 6.20025 16.4533 6.87348 17.1265C7.5467 17.7997 8.34593 18.3338 9.22554 18.6981C10.1052 19.0625 11.0479 19.25 12 19.25C12.9521 19.25 13.8948 19.0625 14.7745 18.6981C15.6541 18.3338 16.4533 17.7997 17.1265 17.1265C17.7997 16.4533 18.3338 15.6541 18.6981 14.7745C19.0625 13.8948 19.25 12.9521 19.25 12C19.25 10.0772 18.4862 8.23311 17.1265 6.87348C15.7669 5.51384 13.9228 4.75 12 4.75C10.0772 4.75 8.23311 5.51384 6.87348 6.87348C5.51384 8.23311 4.75 10.0772 4.75 12Z" fill="red"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - Scrollable container */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Hero Image */}
        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            data={slideImages}
            renderItem={renderSlideItem}
            sliderWidth={getCarouselWidth()}
            itemWidth={getCarouselWidth()}
            onSnapToItem={onSnapToItem}
            loop
            autoplay
            autoplayInterval={5000}
            style={styles.heroImage}
          />
        </View>

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          {slideImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicatorDot,
                currentSlide === index && styles.pageIndicatorDotActive
              ]}
            />
          ))}
        </View>


        {/* Food Categories */}
        <View style={styles.categoriesContainer}>
          {/* What's on your mind */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>Hungry? Let's roll.</Text>
          </View>

          {/* Food Types Header */}
          <FoodTypesHeader navigation={navigation} />

          {/* Nearby Food Trucks Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Nearby Food Trucks</Text>
            <Text style={styles.sectionSubtitle}>Within 30 miles of your location</Text>
          </View>

          {/* Grid Layout for Food Trucks */}
          <View style={styles.categoriesGrid}>
            {loadingFoodTrucks ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading nearby food trucks...</Text>
              </View>
            ) : foodTrucksError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{foodTrucksError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadNearbyFoodTrucks}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : nearbyFoodTrucks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No food trucks found nearby.</Text>
                <Text style={styles.emptySubtext}>Try expanding your search radius</Text>
              </View>
            ) : (
              nearbyFoodTrucks.map((foodTruck, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryItem}
                  onPress={() => handleFoodTruckPress(foodTruck)}
                >
                  <Image
                    source={{ 
                      uri: foodTruck.coverImageUrl || 'https://via.placeholder.com/100x100/cccccc/666666?text=No+Image'
                    }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.categoryText}>{foodTruck.name}</Text>
                  <Text style={styles.foodTruckSubtext}>
                    {foodTruck.foodTypes?.map(ft => ft.title).join(', ') || 'Various cuisines'}
                  </Text>
                  <Text style={styles.deliveryFeeText}>
                    ${foodTruck.deliveryFee} delivery
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation - Sticky on web */}
      <BottomNavigation navigation={navigation} userData={userData} />

      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={handleOnboardingClose}
        userData={userData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
      },
    }),
  },
  header: {
    backgroundColor: '#2D1E2F',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
      },
    }),
  },
  locationBar: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 90,
        left: 0,
        right: 0,
        zIndex: 99,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
        width: '100%',
        paddingTop: 11,
        paddingBottom: 11,
        margin: 0,
      },
    }),
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  timeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 0.1,
    borderColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 5,
    backgroundColor: 'white'
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000',
    paddingVertical: 8,
    outlineStyle: 'none', // Remove outline on web
  },
  micIcon: {
    marginLeft: 5,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 3,
  },
  locationText: {
    marginLeft: 4,
  },
  locationTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  locationAddress: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    maxWidth: 237,
  },
  currentLocationIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  locationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocationButton: {
    padding: 5,
    marginRight: 10,
  },
  webSocketTestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSocketTestText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 121,
        left: 0,
        right: 0,
        bottom: 64,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      },
      default: {
        paddingBottom: 100,
      },
    }),
  },
  contentContainer: {
    ...Platform.select({
      web: {
        paddingBottom: 40,
        minHeight: '100%',
        paddingTop: 0,
      },
      default: {
        flexGrow: 1,
      },
    }),
  },
  carouselContainer: {
    width: '100%',
    ...Platform.select({
      web: {
        margin: '100px 0',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        maxWidth: 1400,
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    }),
  },
  heroImage: {
    width: screenWidth,
    height: 250,
    ...Platform.select({
      web: {
        maxWidth: '100%',
        height: 'auto',
        minHeight: '50vh',
      },
    }),
  },
  slideItem: {
    width: screenWidth,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        width: '100%',
        height: 'auto',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
  },
  slideImage: {
    width: screenWidth,
    height: 250,
    borderRadius: 0,
    ...Platform.select({
      web: {
        width: '100%',
        height: 'auto',
        minHeight: '50vh',
        maxHeight: '50vh',
        objectFit: 'cover',
        borderRadius: 12,
      },
    }),
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 15,
    gap: 21,
  },
  pageIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  pageIndicatorDotActive: {
    backgroundColor: '#fecd15',
  },
  questionText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'center',
  },
  questionHeader: {
    backgroundColor: '#fecd15',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesContainer: {
    paddingHorizontal: 27,
    marginTop: 30,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
      },
    }),
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'center',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    ...Platform.select({
      web: {
        justifyContent: 'flex-start',
        gap: 20,
      },
    }),
  },
  categoryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: {
        width: 'calc(25% - 15px)',
        minWidth: 180,
      },
    }),
  },
  categoryImage: {
    width: '100%',
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'center',
    marginBottom: 4,
  },
  foodTruckSubtext: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  deliveryFeeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: 'green',
    textAlign: 'center',
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubtext: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
