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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getFoodTruckWithCache } from '../lib/food-truck-service';
import MenuItemComponent from './MenuItemComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FoodTruckViewer({ navigation, route }) {
  const { foodTruck: initialFoodTruck } = route.params;
  const [foodTruck, setFoodTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialFoodTruck?.id) {
      loadFoodTruckData();
    }
  }, [initialFoodTruck]);

  const loadFoodTruckData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch complete food truck data using GraphQL
      const data = await getFoodTruckWithCache(initialFoodTruck.id);
      console.log('Food truck data loaded:', data);
      
      setFoodTruck(data);
    } catch (err) {
      console.error('Error loading food truck data:', err);
      setError(err.message || 'Failed to load food truck data');
    } finally {
      setLoading(false);
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

  const handleAddToCart = (menuItem) => {
    Alert.alert('Add to Cart', `Added ${menuItem.name} to cart!`);
  };

  const renderFeaturedSection = () => {
    if (!foodTruck?.menu?.categories) return null;

    // For now, we'll show the first few menu items as featured
    // TODO: Add isFeatured field to menu items in the schema
    let featuredItems = [];
    foodTruck.menu.categories.forEach(category => {
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
                menuItem={{...item, foodTruckId: foodTruck.id}}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMenuSection = () => {
    if (!foodTruck?.menu?.categories) return null;

    return (
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Full Menu</Text>
        {foodTruck.menu.categories.map((category) => {
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
                    menuItem={{...item, foodTruckId: foodTruck.id}}
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

  if (!foodTruck) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No food truck data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Cover Image */}
      <View style={styles.header}>
        <Image
          source={{ 
            uri: foodTruck.coverImageUrl || 'https://via.placeholder.com/400x200/cccccc/666666?text=No+Cover+Image'
          }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        
        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <Image
            source={{ 
              uri: foodTruck.logoUrl || 'https://via.placeholder.com/80x80/cccccc/666666?text=Logo'
            }}
            style={styles.logoImage}
            resizeMode="contain"
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
            <Text style={styles.foodTruckName}>{foodTruck.name}</Text>
            <View style={styles.foodTruckMeta}>
              <View style={styles.deliveryFeeContainer}>
                <Text style={styles.deliveryFeeLabel}>Delivery Fee</Text>
                <Text style={styles.deliveryFeeAmount}>
                  ${foodTruck.deliveryFee}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: screenHeight * 0.4,
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
    bottom: 60,
    position: 'absolute',
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
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  content: {
    flex: 1,
    padding: 20,
    color: 'whitesmoke',
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
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
    paddingHorizontal: 5,
  },
  featuredItemWrapper: {
    width: screenWidth * 0.8,
    marginRight: 15,
    alignItems: 'center',
  },
  featuredItemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  menuSection: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
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
});

