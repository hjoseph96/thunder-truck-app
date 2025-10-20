import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchNearbyFoodTrucks } from '../lib/food-trucks-service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FoodTypeViewer({ navigation, route }) {
  const { foodType } = route.params;
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (foodType) {
      loadFoodTrucksForType();
    }
  }, [foodType]);

  const loadFoodTrucksForType = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Get mock location for testing (replace with actual user location)
      const location = {
        latitude: 40.7128, // New York coordinates for testing
        longitude: -74.0060,
        radius: 30,
        unit: 'miles'
      };

      // Fetch food trucks filtered by this food type
      const result = await fetchNearbyFoodTrucks({
        ...location,
        foodTypeId: foodType.id,
        page: page
      });

      console.log(`Food trucks for ${foodType.title} page ${page}:`, result);
      
      const newFoodTrucks = result.foodTrucks || [];
      const newTotalCount = result.totalCount || 0;
      
      if (append) {
        // Append new food trucks to existing ones
        setFoodTrucks(prevTrucks => [...prevTrucks, ...newFoodTrucks]);
      } else {
        // Replace food trucks for first page
        setFoodTrucks(newFoodTrucks);
      }
      
      setTotalCount(newTotalCount);
      
      // Check if there are more pages (assuming 12 per page from your schema)
      setHasMorePages(newFoodTrucks.length === 12);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading food trucks for type:', err);
      if (page === 1) {
        setError(err.message || 'Failed to load food trucks');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreFoodTrucks = async () => {
    if (!loadingMore && hasMorePages) {
      const nextPage = currentPage + 1;
      await loadFoodTrucksForType(nextPage, true);
    }
  };

  const handleFoodTruckPress = (foodTruck) => {
    // Navigate to FoodTruckViewer with the selected food truck
    navigation.navigate('FoodTruckViewer', { foodTruck });
  };

  const handleRetry = () => {
    loadFoodTrucksForType();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderFoodTruckItem = ({ item: truck, index }) => (
    <TouchableOpacity
      style={styles.foodTruckCard}
      onPress={() => handleFoodTruckPress(truck)}
      activeOpacity={0.7}
      accessibilityLabel={`Food truck ${truck.name}`}
      accessibilityHint="Double tap to view food truck details"
      // Hidden HTML attribute for web compatibility and data tracking
      {...(Platform.OS === 'web' && { 'data-food-truck-id': truck.id })}
    >
      <Image
        source={truck.coverImageUrl 
          ? { uri: truck.coverImageUrl }
          : require('../assets/images/blank-menu-item.png')
        }
        style={styles.truckImage}
        resizeMode="cover"
      />
      <View style={styles.truckInfo}>
        <Text style={styles.truckName} numberOfLines={1}>
          {truck.name}
        </Text>
        <Text style={styles.truckDescription} numberOfLines={2}>
          {truck.description || 'Delicious food truck'}
        </Text>
        <View style={styles.truckDetails}>
          <Text style={styles.deliveryFee}>
            ${truck.deliveryFee} delivery
          </Text>
          {truck.isSubscriber && (
            <View style={styles.subscriberBadge}>
              <Text style={styles.subscriberText}>Premium</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <Text style={styles.loadingMoreText}>Loading more food trucks...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No food trucks found</Text>
      <Text style={styles.emptySubtext}>
        No food trucks serving {foodType.title} are currently available in your area
      </Text>
    </View>
  );

  if (!foodType) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No food type selected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{foodType.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{ 
              uri: foodType.coverImageUrl || 'https://via.placeholder.com/400x200/cccccc/666666?text=No+Cover+Image'
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <Text style={styles.coverTitle}>{foodType.title}</Text>
          </View>
        </View>

        {/* Food Trucks Section */}
        <View style={styles.foodTrucksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Food Trucks</Text>
            <Text style={styles.sectionSubtitle}>
              {totalCount > 0 
                ? `${totalCount} food truck${totalCount !== 1 ? 's' : ''} found`
                : 'No food trucks found for this type'
              }
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading food trucks...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : foodTrucks.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={foodTrucks}
              renderItem={renderFoodTruckItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.foodTrucksGrid}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreFoodTrucks}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={styles.foodTrucksList}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: 20,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '100%',
      },
    }),
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: 'whitesmoke',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'whitesmoke',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 40,
      },
      default: {
        paddingBottom: 20,
      },
    }),
  },
  coverImageContainer: {
    position: 'relative',
    height: 250,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  foodTrucksSection: {
    padding: 20,
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1E2F',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#fecd15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#2D1E2F',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  foodTrucksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  foodTruckCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  truckImage: {
    width: '100%',
    height: 100,
  },
  truckInfo: {
    padding: 12,
  },
  truckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    marginBottom: 4,
  },
  truckDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  truckDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryFee: {
    fontSize: 11,
    fontWeight: '500',
    color: 'green',
  },
  subscriberBadge: {
    backgroundColor: '#fecd15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subscriberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D1E2F',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  foodTrucksList: {
    paddingBottom: 20, // Add some padding at the bottom for the footer
  },
  noMoreResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noMoreResultsText: {
    fontSize: 14,
    color: '#666',
  },
});
