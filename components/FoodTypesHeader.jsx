import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Pressable, Animated, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchFoodTypes } from '../lib/food-types-service';

const { width: screenWidth } = Dimensions.get('window');

// Interactive Food Type Item Component (Hover on web, tap animation on mobile)
const FoodTypeItemWithHover = ({ foodType, onPress, sanitizeImageUrl }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      animateScale(1.1);
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      animateScale(1);
    }
  };

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      animateScale(1.1);
    }
  };

  const handlePressOut = () => {
    if (Platform.OS !== 'web') {
      animateScale(1);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.foodTypeItem,
        pressed && styles.foodTypeItemPressed,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.iconContainer}>
          {foodType.iconImageUrl ? (
            <Image
              source={{ 
                uri: sanitizeImageUrl(foodType.iconImageUrl),
                cache: 'default'
              }}
              style={styles.foodTypeIcon}
              resizeMode="contain"
              onLoadStart={() => console.log('Loading image:', sanitizeImageUrl(foodType.iconImageUrl))}
              onLoad={() => console.log('Image loaded successfully:', sanitizeImageUrl(foodType.iconImageUrl))}
              onError={(error) => {
                console.error('Image load error:', error.nativeEvent, 'for URL:', sanitizeImageUrl(foodType.iconImageUrl));
              }}
            />
          ) : (
            <View style={styles.fallbackIcon}>
              <Text style={styles.fallbackText}>🍽️</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodTypeTitle} numberOfLines={2}>
          {foodType.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default function FoodTypesHeader({ navigation }) {
  const [foodTypes, setFoodTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Function to sanitize and validate CDN URLs
  const sanitizeImageUrl = (url) => {
    if (!url) return null;
    
    // Remove any whitespace
    let cleanUrl = url.trim();
    
    // Ensure URL starts with http:// or https://
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Validate URL format
    try {
      new URL(cleanUrl);
      return cleanUrl;
    } catch (error) {
      console.error('Invalid URL format:', url, error);
      return null;
    }
  };

  useEffect(() => {
    loadFoodTypes();
  }, []);

  const loadFoodTypes = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // Fetch food types from GraphQL API
      const data = await fetchFoodTypes(page);

      console.log(`Food types page ${page}:`, data);

      if (append && data && data.length > 0) {
        // Append new food types to existing ones
        setFoodTypes(prevFoodTypes => [...prevFoodTypes, ...data]);
      } else if (data && data.length > 0) {
        // Replace food types for first page
        setFoodTypes(data);
      }

      // Check if there are more pages (assuming 10 per page from your schema)
      setHasMorePages(data && data.length === 10);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading food types:', err);
      if (page === 1) {
        setError(err.message || 'Failed to load food types');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreFoodTypes = async () => {
    if (!loadingMore && hasMorePages) {
      const nextPage = currentPage + 1;
      await loadFoodTypes(nextPage, true);
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // Check if we're near the end of horizontal scroll
    const isNearEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 50;
    
    if (isNearEnd && !loadingMore && hasMorePages) {
      console.log('Near end of scroll, loading more food types...');
      loadMoreFoodTypes();
    }
  };

  const handleFoodTypePress = (foodType) => {
    // Navigate to FoodTypeViewer with the selected food type
    navigation.navigate('FoodTypeViewer', { foodType });
  };

  const handleRetry = () => {
    loadFoodTypes(1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.loadingText}>Loading food types...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.errorText}>Error loading food types</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!foodTypes || foodTypes.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.emptyText}>No food types available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top border */}
      <View style={styles.topBorder} />
      
      {/* Header container */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={120}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {foodTypes.map((foodType) => (
            <FoodTypeItemWithHover
              key={foodType.id}
              foodType={foodType}
              onPress={() => handleFoodTypePress(foodType)}
              sanitizeImageUrl={sanitizeImageUrl}
            />
          ))}
          
          {/* Loading indicator for more food types */}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <View style={styles.loadingMoreSpinner}>
                <Text style={styles.loadingMoreText}>...</Text>
              </View>
              <Text style={styles.loadingMoreLabel}>Loading more</Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Bottom border */}
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topBorder: {
    height: 2,
    backgroundColor: '#fecd15', // Yellow border to match app theme
  },
  bottomBorder: {
    height: 1,
    backgroundColor: '#e0e0e0', // Light gray bottom border
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  foodTypeItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 100,
    minHeight: 100,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  foodTypeItemPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  foodTypeIcon: {
    width: 40,
    height: 40,
  },
  foodTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  retryButton: {
    backgroundColor: '#fecd15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#2D1E2F',
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 24,
  },
  loadingMoreContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 100,
    minHeight: 100,
    justifyContent: 'center',
  },
  loadingMoreSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingMoreText: {
    fontSize: 20,
    color: '#666',
  },
  loadingMoreLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  endOfListContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 100,
    minHeight: 100,
    justifyContent: 'center',
  },
  endOfListText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
