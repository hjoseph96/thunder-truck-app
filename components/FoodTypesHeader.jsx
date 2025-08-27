import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchFoodTypes } from '../lib/food-types-service';

const { width: screenWidth } = Dimensions.get('window');

export default function FoodTypesHeader() {
  const [foodTypes, setFoodTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const loadFoodTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch food types from GraphQL API
      const data = await fetchFoodTypes(1); // Start with page 1

      console.log('Food types:', data);

      setFoodTypes(data);
    } catch (err) {
      console.error('Error loading food types:', err);
      setError(err.message || 'Failed to load food types');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodTypePress = (foodType) => {
    // TODO: Navigate to food type specific page
    console.log('Navigating to food type:', foodType.title);
  };

  const handleRetry = () => {
    loadFoodTypes();
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
        >
          {foodTypes.map((foodType) => (
            <TouchableOpacity
              key={foodType.id}
              style={styles.foodTypeItem}
              onPress={() => handleFoodTypePress(foodType)}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
          ))}
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
});
