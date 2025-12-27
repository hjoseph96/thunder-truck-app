import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { getVendorWithCache } from '../lib/food-truck-service';
import { getCart, addMenuItemToCart, changeCartItemQuantity } from '../lib/cart-service';
import MenuItemComponent from './MenuItemComponent';
import CartPopup from './CartPopup';
import LazyImage from './LazyImage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FoodTruckViewer({ navigation, route }) {
  const { foodTruckId } = route.params;
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart-related state
  const [cartData, setCartData] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);

  useEffect(() => {
    if (foodTruckId) {
      loadFoodTruckData();
      loadCartData();
    }
  }, [foodTruckId]);

  const loadFoodTruckData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch complete vendor data using GraphQL by ID
      const data = await getVendorWithCache(foodTruckId);
      console.log('Vendor data loaded:', data);

      setVendor(data);

      // Update navigation params for page title on web
      if (Platform.OS === 'web' && data?.name) {
        navigation.setParams({ foodTruckName: data.name });
      }
    } catch (err) {
      console.error('Error loading food truck data:', err);
      setError(err.message || 'Failed to load food truck data');
    } finally {
      setLoading(false);
    }
  };

  const loadCartData = async () => {
    try {
      setCartLoading(true);
      const cart = await getCart(foodTruckId);

      console.log('Loaded Cart Data: ', cart);
      setCartData(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, change) => {
    try {
      setCartLoading(true);
      const currentCartItem = cartData.cartItems.find(item => item.id === cartItemId);
      if (!currentCartItem) {
        console.error('Cart item not found:', cartItemId);
        return;
      }

      const newQuantity = currentCartItem.quantity + change;
      if (newQuantity <= 0) {
        // TODO: Handle item removal
        return;
      }

      await changeCartItemQuantity(cartItemId, newQuantity);
      const updatedCart = await getCart(foodTruckId);
      setCartData(updatedCart);
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleMenuItemPress = (menuItem) => {
    // TODO: Navigate to menu item detail page or add to cart
    console.log('Selected menu item:', menuItem.name);
    Alert.alert('Menu Item', `You selected: ${menuItem.name} - $${menuItem.price}`);
  };

  const handleAddToCart = async (menuItem) => {
    try {
      setCartLoading(true);

      // Add menu item to cart (no options for now, can be extended later)
      const cartItemOptions = [];
      await addMenuItemToCart(menuItem.id, cartItemOptions);

      // Reload cart data to get updated cart
      const updatedCart = await getCart(foodTruckId);

      console.log('Updated Cart Data: ', updatedCart);
      setCartData(updatedCart);

      setShowCartPopup(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setCartLoading(false);
    }
  };

  const handleCartPress = () => {
    setShowCartPopup(true);
  };

  const renderFeaturedSection = () => {
    if (!vendor?.menu?.categories) return null;

    // For now, we'll show the first few menu items as featured
    // TODO: Add isFeatured field to menu items in the schema
    let featuredItems = [];
    vendor.menu.categories.forEach(category => {
      featuredItems.push(...category.menuItems.filter(item => item.imageUrl !== null));
    });

    if (featuredItems.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredTitle}>Featured Items</Text>
          <View style={styles.featuredItemCount}>
            <Text style={styles.featuredItemCountText}>
              {featuredItems.length} {featuredItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScrollContent}
        >
          {featuredItems.map((item, index) => (
            <View key={`featured-${item.id}`} style={styles.featuredItemWrapper}>
              <MenuItemComponent
                key={`featured-${item.id}`}
                imageUrl={item.imageUrl}
                name={item.name}
                description={item.description}
                price={item.price}
                onPress={() => handleMenuItemPress(item)}
                onAddToCart={() => handleAddToCart(item)}
                navigation={navigation}
                menuItem={{...item, foodTruckId: vendor.id}}
                fullHeight={Platform.OS === 'web'}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMenuSection = () => {
    if (!vendor?.menu?.categories) return null;

    return (
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Full Menu</Text>
        {vendor.menu.categories.map((category) => {
          // Filter menu items to only show those with coverImageUrl
          const itemsWithImages = category.menuItems.filter(item => item.coverImageUrl !== null);

          // Only render category if it has items with images
          if (itemsWithImages.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <View style={styles.categoryItemCount}>
                  <Text style={styles.categoryItemCountText}>
                    {itemsWithImages.length} {itemsWithImages.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryContent}>
                {itemsWithImages.map((item) => (
                  <MenuItemComponent
                    key={item.id}
                    imageUrl={item.imageUrl}
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    onPress={() => handleMenuItemPress(item)}
                    onAddToCart={() => handleAddToCart(item)}
                    navigation={navigation}
                    menuItem={{...item, foodTruckId: vendor.id}}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading food truck...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFoodTruckData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No vendor data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Cover Image */}
      <View style={styles.header}>
        <LazyImage
          source={{
            uri: vendor.coverImageUrl || 'https://via.placeholder.com/400x200/cccccc/666666?text=No+Cover+Image'
          }}
          style={styles.coverImage}
          resizeMode="cover"
          lazy={false}
        />

        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <LazyImage
            source={{
              uri: vendor.logoUrl || 'https://via.placeholder.com/80x80/cccccc/666666?text=Logo'
            }}
            style={styles.logoImage}
            resizeMode="contain"
            lazy={false}
            skeletonBorderRadius={40}
          />
        </View>

        {/* Header Content Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.foodTruckName}>{vendor.name}</Text>
            <View style={styles.foodTruckMeta}>
              <View style={styles.deliveryFeeContainer}>
                <Text style={styles.deliveryFeeLabel}>Delivery Fee</Text>
                <Text style={styles.deliveryFeeAmount}>
                  ${vendor.deliveryFee}
                </Text>
              </View>

            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Items Section */}
        {renderFeaturedSection()}

        {/* Full Menu Section */}
        {renderMenuSection()}
      </ScrollView>

      {/* Cart Icon */}
      <TouchableOpacity style={styles.cartIcon} onPress={handleCartPress}>
        <MaterialIcons name="shopping-cart" size={28} color="#000" />
      </TouchableOpacity>

      {/* Cart Popup Modal */}
      <CartPopup
        visible={showCartPopup}
        cartData={cartData}
        cartLoading={cartLoading}
        onClose={() => setShowCartPopup(false)}
        onQuantityChange={handleQuantityChange}
        onCheckout={(foodTruckId) => navigation.navigate('CheckoutForm', { foodTruckId })}
        foodTruckId={foodTruckId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    height: screenHeight * 0.4,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        flexShrink: 0,
        height: 320, // Fixed height instead of vh for better performance
        zIndex: 100,
        width: '100%',
      },
    }),
  },
  coverImage: {
    width: '100%',
    height: screenHeight * 0.4,
    position: 'absolute',
    top: 0,
    left: 0,
    ...Platform.select({
      web: {
        height: 320, // Match header height for consistent layout
      },
    }),
  },
  logoContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    resizeMode: 'contain',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    marginTop: 40,
  },
  foodTruckName: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'Cairo',
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 16,
    letterSpacing: 0.3,
    bottom: 60,
    position: 'absolute',
    ...Platform.select({
      web: {
        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  foodTruckMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveryFeeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(56, 54, 54, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    // Additional gradient-like effects
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  deliveryFeeLabel: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  deliveryFeeAmount: {
    color: '#fecd15',
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },

  content: {
    flex: 1,
    padding: 16,
    color: 'whitesmoke',
    ...Platform.select({
      web: {
        marginTop: '0.75rem',
        position: 'absolute',
        top: 320, // Match fixed header height
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 40,
        paddingHorizontal: screenWidth < 768 ? 16 : screenWidth < 1024 ? 24 : 40,
        maxWidth: 1200,
        marginLeft: 'auto',
        marginRight: 'auto',
      },
      default: {
        paddingBottom: 100,
      },
    }),
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 18,
    color: '#333',
  },
  featuredSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#fecd15',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
  },
  featuredItemCount: {
    backgroundColor: '#fecd15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featuredItemCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D1E2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'stretch', // Make all items same height
      },
    }),
  },
  featuredItemWrapper: {
    width: screenWidth * 0.8,
    marginRight: 15,
    alignItems: 'center',
    ...Platform.select({
      web: {
        width: 'calc(25% - 12px)', // 4 items per row (25% each minus gap)
        minWidth: '250px', // Minimum width for smaller screens
        maxWidth: '300px', // Maximum width to prevent items from being too large
        marginRight: 0, // Remove marginRight on web since we use gap
        flex: '0 0 auto', // Don't grow or shrink, maintain size
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  featuredItemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  menuSection: {
    marginBottom: 12,
    ...Platform.select({
      web: {
        marginTop: 0,
      },
    }),
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#fecd15',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
  },
  categoryItemCount: {
    backgroundColor: '#fecd15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryItemCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D1E2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryContent: {
    // Content area for menu items
  },
  menuItemsContainer: {
    width: '100%',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9B319',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 30,
        right: 30,
      },
    }),
  },
});
