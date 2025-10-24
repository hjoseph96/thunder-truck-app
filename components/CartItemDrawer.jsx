import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CartItemDrawer = ({ foodTruckName, cartItems, isExpanded, onToggle, onQuantityChange, cartLoading = false }) => {
  const rotateValue = new Animated.Value(isExpanded ? 1 : 0);

  React.useEffect(() => {
    Animated.timing(rotateValue, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  console.log('cartItems', cartItems);
  console.log('foodTruckName', foodTruckName);

  const totalItems = cartItems.reduce((sum, item) => sum + item.cartItem.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => 
    sum + (item.cartItem.menuItem?.price || 0) * item.cartItem.quantity, 0
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.foodTruckImageContainer}>
              {cartItems[0].foodTruckData.coverImageUrl && (
                  <Image source={{ uri: cartItems[0].foodTruckData.coverImageUrl }} style={styles.cartItemImage} />
                )}
            </View>

            <View style={styles.foodTruckNameContainer}>
              <Text style={styles.foodTruckName} numberOfLines={1} ellipsizeMode="tail">{foodTruckName}</Text>
              
              <Text style={styles.itemCount}>{totalItems} items</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.totalPrice}>${(totalPrice).toFixed(2)}</Text>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
            </Animated.View>  
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {cartItems.map((item,  index) => (
            <View key={item.cartItem.id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>

                <View style={styles.itemImageContainer}>
                  {item.cartItem.menuItem?.imageUrl && (
                    <Image source={{ uri: item.cartItem.menuItem.imageUrl }} style={styles.itemImage} />
                  )}
                </View>
                
                <View style={styles.itemNameContainer}>
                  <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">{item.cartItem.menuItem?.name}</Text>

                  {item.cartItem.menuItem?.description && (
                    <Text style={styles.itemDescription} numberOfLines={2} ellipsizeMode="tail">
                      {item.cartItem.menuItem.description}
                    </Text>
                  )}
                  {item.cartItem.cartItemOptions && item.cartItem.cartItemOptions.length > 0 && (
                    <View style={styles.optionsContainer}>
                      {item.cartItem.cartItemOptions.map((option, optIndex) => (
                        <Text key={optIndex} style={styles.optionText}>
                          + {option.option?.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                
              </View>
              <View style={styles.cartItemRight}>
                <Text style={styles.itemPrice}>
                  ${((item.cartItem.menuItem?.price || 0) * item.cartItem.quantity).toFixed(2)}
                </Text>

                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onQuantityChange && onQuantityChange(item.cartItem.id, -1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onQuantityChange && onQuantityChange(item.cartItem.id, 1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FCFCFC',
  },
  cartItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa'
  },
  cartItemLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#646060',
    letterSpacing: 0.08,
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  cartItemRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9B319',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Cairo',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginHorizontal: 12,
    fontFamily: 'Cairo',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.5,
  },
  cartItemImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
  },
  foodTruckImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
  },
  foodTruckNameContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 12,
  },
  foodTruckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    flexShrink: 1,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  itemNameContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 12,
  },
});

export default CartItemDrawer;
