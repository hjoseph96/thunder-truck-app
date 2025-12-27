import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import ImageSkeleton from './ImageSkeleton';

const MenuItemComponent = ({ 
  imageUrl, 
  name, 
  description, 
  price,
  onPress,
  onAddToCart,
  navigation,
  menuItem,
  fullHeight = false
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handlePress = () => {
    if (navigation && menuItem) {
      // Navigate to MenuItemViewer if navigation and menuItem are provided
      navigation.navigate('MenuItemViewer', { 
        menuItemId: menuItem.id,
        foodTruckId: menuItem.foodTruckId 
      });
    } else if (onPress) {
      // Fall back to custom onPress if provided
      onPress();
    }
  };

  const renderImageError = () => (
    <View style={styles.imageError}>
      <Text style={styles.imageErrorText}>🍽️</Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.container, fullHeight && styles.fullHeightContainer]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      {/* Left side - Text content */}
      <View style={styles.textContainer}>
        <Text style={styles.itemName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.itemPrice}>
          ${price || '0.00'}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {description || ''}
        </Text>
      </View>

      {/* Right side - Image and Add button */}
      <View style={styles.rightContainer}>
        {/* Image with loading states */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            {/* Show skeleton while loading */}
            {imageLoading && <ImageSkeleton style={styles.itemImage} borderRadius={8} />}
            
            {/* Show error state if image fails */}
            {imageError && renderImageError()}
            
            {/* Actual image */}
            {!imageError && (
              <Image
                source={{ uri: imageUrl }}
                style={[
                  styles.itemImage,
                  { opacity: imageLoading ? 0 : 1 }
                ]}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </View>
        )}
        
        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              styles.addButtonInner,
              { transform: [{ scale: scaleValue }] }
            ]}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fullHeightContainer: {
    height: '100%',
    minHeight: 'auto',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 16,
    paddingTop: 10,
    marginTop: 3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1E2F',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '300',
    color: 'black',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    width: '80%',
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemImage: {
    width: 60,
    height: 60,
    minHeight: 60, // Prevent layout shift
    borderRadius: 8,
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fecd15',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1E2F',
  },
  imageError: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  imageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    minHeight: 60, // Prevent layout shift
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default MenuItemComponent;
