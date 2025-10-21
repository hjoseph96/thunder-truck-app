import React, { useState, useEffect, useCallback } from 'react';
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
import { fetchFoodTypeById } from '../lib/food-types-service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Determine grid columns based on screen width
const getNumColumns = () => {
  if (Platform.OS === 'web') {
    if (screenWidth >= 1400) return 5; // Extra large desktop
    if (screenWidth >= 1200) return 4; // Large desktop
    if (screenWidth >= 900) return 3; // Desktop/Tablet landscape
    if (screenWidth >= 600) return 2; // Tablet portrait
    return 2; // Mobile
  }
  return 2; // Native always 2 columns
};

const isWeb = Platform.OS === 'web';
export default function FoodTypeViewer({ navigation, route }) {
  // Extract params - handle both object (navigation) and ID (URL)
  const params = route?.params || {};
  const foodTypeId = params.foodTypeId || params.foodType?.id;
  const foodTypeParam = params.foodType;
  
  console.log('FoodTypeViewer route params:', params);
  console.log('FoodTypeViewer foodTypeId:', foodTypeId);
  
  const [foodType, setFoodType] = useState(
    foodTypeParam || (foodTypeId ? { id: foodTypeId, title: 'Loading...' } : null)
  );
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    console.log('FoodTypeViewer useEffect triggered. foodType:', foodType, 'foodTypeId:', foodTypeId);
    if (foodType?.id || foodTypeId) {
      // If we only have ID but not full food type data, fetch it
      if (foodTypeId && (!foodType || foodType.title === 'Loading...')) {
        fetchFoodTypeById(foodTypeId)
          .then(fetchedFoodType => {
            console.log('Fetched food type details:', fetchedFoodType);
            setFoodType(fetchedFoodType);
            
            // Update navigation params for page title on web
            if (Platform.OS === 'web' && fetchedFoodType?.title) {
              navigation.setParams({ foodTypeName: fetchedFoodType.title });
            }
          })
          .catch(err => {
            console.error('Error fetching food type details:', err);
            // Continue anyway with just the ID
          });
      }
      loadFoodTrucksForType();
    } else {
      setError('No food type specified');
      setLoading(false);
    }
  }, [foodTypeId]);

  // Update page title when foodType changes
  useEffect(() => {
    if (Platform.OS === 'web' && foodType?.title) {
      navigation.setParams({ foodTypeName: foodType.title });
    }
  }, [foodType?.title]);

  // Handle window resize on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        const newNumColumns = getNumColumns();
        if (newNumColumns !== numColumns) {
          setNumColumns(newNumColumns);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [numColumns]);

  const loadFoodTrucksForType = async (page = 1, append = false) => {
    const actualFoodTypeId = foodType?.id || foodTypeId;
    const itemsPerPage = Platform.OS === 'web' ? 15 : 12;
    
    console.log('=== loadFoodTrucksForType START ===');
    console.log('Page:', page, 'Append:', append, 'FoodTypeId:', actualFoodTypeId, 'ItemsPerPage:', itemsPerPage);
    
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
        console.log('Set loading to true for page 1');
      } else {
        setLoadingMore(true);
        console.log('Set loadingMore to true for page', page);
      }

      // Get mock location for testing (replace with actual user location)
      const location = {
        latitude: 40.7128, // New York coordinates for testing
        longitude: -74.0060,
        radius: 30,
        unit: 'miles'
      };

      const fetchParams = {
        ...location,
        foodTypeId: actualFoodTypeId,
        page: page,
        perPage: itemsPerPage
      };

      console.log('Calling fetchNearbyFoodTrucks with:', fetchParams);

      // Fetch food trucks filtered by this food type
      const result = await fetchNearbyFoodTrucks(fetchParams);

      console.log(`API Response for food type (${actualFoodTypeId}) page ${page}:`, result);
      
      const newFoodTrucks = result?.foodTrucks || [];
      const newTotalCount = result?.totalCount || 0;
      
      console.log('New food trucks count:', newFoodTrucks.length, 'Total count:', newTotalCount);
      
      // Debug first truck's data structure
      if (newFoodTrucks.length > 0) {
        console.log('📊 Sample food truck data:', {
          id: newFoodTrucks[0].id,
          name: newFoodTrucks[0].name,
          coverImageUrl: newFoodTrucks[0].coverImageUrl,
          hasImage: !!newFoodTrucks[0].coverImageUrl
        });
      }
      
      // Warn if backend didn't respect perPage
      if (newFoodTrucks.length > 0 && newFoodTrucks.length < itemsPerPage && page === 1 && newTotalCount > newFoodTrucks.length) {
        console.warn(`⚠️ Backend returned ${newFoodTrucks.length} items but we requested ${itemsPerPage}. This may be a backend issue not respecting the perPage parameter.`);
      }
      
      let updatedTrucksCount = 0;
      
      if (append) {
        // Append new food trucks to existing ones
        setFoodTrucks(prevTrucks => {
          const updated = [...prevTrucks, ...newFoodTrucks];
          updatedTrucksCount = updated.length;
          console.log('Appending', newFoodTrucks.length, 'trucks to existing', prevTrucks.length, '= total:', updatedTrucksCount);
          return updated;
        });
      } else {
        // Replace food trucks for first page
        updatedTrucksCount = newFoodTrucks.length;
        console.log('Replacing food trucks with', newFoodTrucks.length, 'trucks');
        setFoodTrucks(newFoodTrucks);
      }
      
      setTotalCount(newTotalCount);
      
      // Check if there are more pages - use totalCount as source of truth
      const hasMore = updatedTrucksCount < newTotalCount;
      console.log('Has more pages:', hasMore, `(loaded: ${updatedTrucksCount}, total available: ${newTotalCount})`);
      setHasMorePages(hasMore);
      setCurrentPage(page);
      
      console.log('=== loadFoodTrucksForType SUCCESS ===');
    } catch (err) {
      console.error('=== loadFoodTrucksForType ERROR ===', err);
      console.error('Error details:', err.message, err.stack);
      if (page === 1) {
        setError(err.message || 'Failed to load food trucks');
      }
    } finally {
      console.log('=== loadFoodTrucksForType FINALLY ===');
      console.log('Setting loading to false, loadingMore to false');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Define loadMoreFoodTrucks with useCallback after loadFoodTrucksForType
  const loadMoreFoodTrucks = useCallback(async () => {
    if (!loadingMore && hasMorePages) {
      const nextPage = currentPage + 1;
      console.log('loadMoreFoodTrucks called for page:', nextPage);
      await loadFoodTrucksForType(nextPage, true);
    }
  }, [loadingMore, hasMorePages, currentPage]);

  // Handle infinite scroll on web - MUST be after loadMoreFoodTrucks definition
  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('⏭️ Skipping infinite scroll - not on web');
      return;
    }

    let lastLoggedDistance = null;

    const handleScroll = (event) => {
      const container = event.target;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Only log when distance changes significantly (every 100px) to avoid spam
      if (lastLoggedDistance === null || Math.abs(distanceFromBottom - lastLoggedDistance) > 100) {
        console.log('📜 Scroll event on content container:', {
          distanceFromBottom: Math.round(distanceFromBottom),
          loadingMore,
          hasMorePages,
          shouldTrigger: distanceFromBottom < 500 && !loadingMore && hasMorePages
        });
        lastLoggedDistance = distanceFromBottom;
      }

      // Load more when user scrolls to within 500px of bottom
      if (distanceFromBottom < 500 && !loadingMore && hasMorePages) {
        console.log('🔄 Triggering infinite scroll load. Distance from bottom:', Math.round(distanceFromBottom));
        loadMoreFoodTrucks();
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const scrollContainer = scrollContainerRef.current;
      
      if (scrollContainer) {
        console.log('✅ Infinite scroll attached to content container. Current state:', {
          loadingMore,
          hasMorePages,
          foodTrucksCount: foodTrucks.length
        });
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        console.warn('⚠️ Scroll container ref not found');
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
        console.log('🧹 Infinite scroll cleanup - removed listener from content container');
      }
    };
  }, [loadingMore, hasMorePages, loadMoreFoodTrucks, foodTrucks.length]);

  const handleFoodTruckPress = (foodTruck) => {
    // Navigate to FoodTruckViewer with only ID (clean URL routing)
    navigation.navigate('FoodTruckViewer', { 
      foodTruckId: foodTruck.id
    });
  };

  const handleRetry = () => {
    loadFoodTrucksForType();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderFoodTruckCard = (truck) => {
    // Debug image URL
    const imageUrl = truck.coverImageUrl;
    const hasValidImage = imageUrl && imageUrl.trim() !== '';
    
    if (!hasValidImage) {
      console.warn(`⚠️ Food truck "${truck.name}" (${truck.id}) has no coverImageUrl or empty URL`);
    }
    
    return (
      <TouchableOpacity
        key={truck.id}
        style={[
          styles.foodTruckCard,
          isWeb && styles.foodTruckCardWeb,
          isWeb && { width: `${100 / numColumns - 2}%` }
        ]}
        onPress={() => handleFoodTruckPress(truck)}
        activeOpacity={0.7}
        accessibilityLabel={`Food truck ${truck.name}`}
        accessibilityHint="Double tap to view food truck details"
        // Hidden HTML attribute for web compatibility and data tracking
        {...(Platform.OS === 'web' && { 'data-food-truck-id': truck.id })}
      >
        <Image
          {...(Platform.OS === 'web' && { preload: 'auto' })}
          source={hasValidImage 
            ? { uri: imageUrl }
            : require('../assets/images/blank-menu-item.png')
          }
          style={styles.truckImage}
          resizeMode="cover"
          onError={(error) => {
            console.error(`❌ Failed to load image for ${truck.name}:`, imageUrl, error.nativeEvent);
          }}
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
  };

  const renderFoodTruckItem = ({ item: truck, index }) => renderFoodTruckCard(truck);

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
        No food trucks serving {foodType?.title || 'this type'} are currently available in your area
      </Text>
    </View>
  );

  // Show error if no food type ID is available
  if (!foodType && !foodTypeId) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No food type specified</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{foodType?.title || 'Food Type'}</Text>
        <View style={styles.placeholder} />
      </View>

      <View 
        style={styles.content}
        ref={scrollContainerRef}
      >
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{ 
              uri: foodType?.coverImageUrl || 'https://via.placeholder.com/400x200/cccccc/666666?text=No+Cover+Image'
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <Text style={styles.coverTitle}>{foodType?.title || 'Food Type'}</Text>
          </View>
        </View>

        {/* Food Trucks Section */}
        <View style={styles.foodTrucksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Food Trucks</Text>
            <Text style={styles.sectionSubtitle}>
              {loading ? 'Searching...' : totalCount > 0 
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
          ) : isWeb ? (
            // Web: Use custom responsive grid
            <View style={styles.webGridContainer}>
              <View style={styles.webGrid}>
                {foodTrucks.map((truck) => renderFoodTruckCard(truck))}
              </View>
              {renderFooter()}
            </View>
          ) : (
            // Native: Use FlatList with fixed columns
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
    ...Platform.select({
      web: {
        height: '55vh',
      },
    }),
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
    ...Platform.select({
      web: {
        maxWidth: 1600,
        marginHorizontal: 'auto',
        width: '100%',
        paddingHorizontal: 40,
      },
    }),
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
  webGridContainer: {
    width: '100%',
  },
  webGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: '20px 0 100px 0',
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
  foodTruckCardWeb: {
    marginBottom: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        willChange: 'transform, box-shadow',
      },
    }),
  },
  truckImage: {
    width: '100%',
    height: 100,
    ...Platform.select({
      web: {
        height: screenWidth >= 900 ? 160 : 120,
      },
    }),
  },
  truckInfo: {
    padding: 12,
    ...Platform.select({
      web: {
        padding: screenWidth >= 900 ? 16 : 12,
      },
    }),
  },
  truckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    marginBottom: 4,
    ...Platform.select({
      web: {
        fontSize: screenWidth >= 900 ? 18 : 16,
      },
    }),
  },
  truckDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
    ...Platform.select({
      web: {
        fontSize: screenWidth >= 900 ? 14 : 12,
        lineHeight: screenWidth >= 900 ? 20 : 16,
      },
    }),
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
