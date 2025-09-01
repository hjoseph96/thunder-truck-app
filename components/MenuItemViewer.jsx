import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { getMenuItemWithCache } from '../lib/menu-item-service';
import { getCart, addMenuItemToCart } from '../lib/cart-service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MenuItemViewer({ navigation, route }) {
  const { menuItemId, foodTruckId } = route.params;
  const [menuItem, setMenuItem] = useState(null);
  const [relatedMenuItems, setRelatedMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartData, setCartData] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    const loadMenuItem = async () => {
      try {
        setLoading(true);
        const result = await getMenuItemWithCache(menuItemId);
        setMenuItem(result.menuItem);
        setRelatedMenuItems(result.relatedMenuItems || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (menuItemId) {
      loadMenuItem();
    }
  }, [menuItemId]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCartPress = async () => {
    if (!showCartPopup) {
      // Load cart data when opening popup
      await loadCartData();
    }
    setShowCartPopup(!showCartPopup);
  };

  const loadCartData = async () => {
    try {
      setCartLoading(true);
      
      if (!foodTruckId) {
        console.error('No foodTruckId available in route params');
        return;
      }
      
      const cart = await getCart(foodTruckId);
      setCartData(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const handleQuantityChange = async (menuItemId, change) => {
    try {
      setCartLoading(true);
      // Add the menu item to cart (API will handle quantity logic)
      const updatedCart = await addMenuItemToCart(menuItemId);
      setCartData(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setCartLoading(true);
      
      // Convert selected options to the format expected by the API
      const cartItemOptions = Object.entries(selectedOptions).flatMap(([optionGroupId, optionIds]) => {
        return optionIds.map(optionId => ({
          optionId: optionId
        }));
      });

      const updatedCart = await addMenuItemToCart(menuItem.id, cartItemOptions);
      setCartData(updatedCart);
      
      // Show cart popup after adding item
      setShowCartPopup(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const handleOptionSelect = (optionGroupId, optionId, isSingleSelect = false, limit = null) => {
    setSelectedOptions(prev => {
      const newSelection = { ...prev };
      
      if (isSingleSelect) {
        // For single select, replace the entire group selection
        newSelection[optionGroupId] = [optionId];
      } else {
        // For multi-select, toggle the option
        if (!newSelection[optionGroupId]) {
          newSelection[optionGroupId] = [];
        }
        
        const currentSelection = newSelection[optionGroupId];
        const optionIndex = currentSelection.indexOf(optionId);
        
        if (optionIndex > -1) {
          // Remove option if already selected
          currentSelection.splice(optionIndex, 1);
        } else {
          // Check if we can add more options
          if (limit && currentSelection.length >= limit) {
            // Cannot add more options, limit reached
            return prev;
          }
          currentSelection.push(optionId);
        }
      }
      
      return newSelection;
    });
  };

  const isOptionSelected = (optionGroupId, optionId) => {
    return selectedOptions[optionGroupId]?.includes(optionId) || false;
  };

  const isOptionGroupComplete = (optionGroup) => {
    if (!optionGroup.limit) return true;
    const selectedCount = selectedOptions[optionGroup.id]?.length || 0;
    return selectedCount >= optionGroup.limit;
  };

  const renderOptionGroup = (optionGroup) => {
    const isComplete = isOptionGroupComplete(optionGroup);
    const isSingleSelect = optionGroup.limit === 1;

    return (
      <View key={optionGroup.id} style={styles.optionGroup}>
        <View style={styles.optionGroupHeader}>
          <Text style={styles.optionGroupTitle}>{optionGroup.name || 'Customizations'}</Text>
          {optionGroup.required && (
            <View style={[
              styles.requiredTag,
              isComplete && styles.requiredTagComplete
            ]}>
              <Text style={[
                styles.requiredTagText,
                isComplete && styles.requiredTagTextComplete
              ]}>
                {isComplete ? '✓' : 'Required'}
              </Text>
            </View>
          )}
        </View>
        
        {optionGroup.limit && (
          <Text style={styles.optionGroupLimit}>
            Select up to {optionGroup.limit} {optionGroup.limit === 1 ? 'option' : 'options'}
          </Text>
        )}

        <View style={styles.optionsList}>
          {optionGroup.options?.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  {
                    option.price > 0 && 
                        <Text style={styles.optionPrice}>+${option.price}</Text>
                  }
                </View>
                
                {option.imageUrl && (
                  <Image
                    source={{ uri: option.imageUrl }}
                    style={styles.optionImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.optionSelector,
                  isOptionSelected(optionGroup.id, option.id) && styles.optionSelectorSelected,
                  !isOptionSelected(optionGroup.id, option.id) && 
                  optionGroup.limit && 
                  (selectedOptions[optionGroup.id]?.length || 0) >= optionGroup.limit && 
                  styles.optionSelectorDisabled
                ]}
                onPress={() => handleOptionSelect(optionGroup.id, option.id, isSingleSelect, optionGroup.limit)}
                disabled={!isOptionSelected(optionGroup.id, option.id) && 
                         optionGroup.limit && 
                         (selectedOptions[optionGroup.id]?.length || 0) >= optionGroup.limit}
              >
                {isOptionSelected(optionGroup.id, option.id) && (
                  <View style={styles.optionSelectorInner}>
                    {isSingleSelect ? (
                      <View style={styles.radioButtonSelected} />
                    ) : (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fecd15" />
          <Text style={styles.loadingText}>Loading menu item...</Text>
        </View>
      </View>
    );
  }

  if (error || !menuItem) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'No menu item data available'}
          </Text>
        </View>
      </View>
    );
  }

  const renderCartItems = () => {
    if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
      return (
        <Text style={styles.cartEmptyText}>Your cart is empty</Text>
      );
    }

    return (
      <View style={styles.cartItemsContainer}>
        <Text style={styles.cartItemsTitle}>Cart</Text>
        <View style={styles.cartItemsList}>
          {cartData.cartItems.map((cartItem) => {
            const totalPrice = (cartItem.menuItem.price * cartItem.quantity).toFixed(2);
            return (
              <View key={cartItem.id} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  {cartItem.menuItem.imageUrl && (
                    <Image
                      source={{ uri: cartItem.menuItem.imageUrl }}
                      style={styles.cartItemImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View style={styles.cartItemCenter}>
                  <Text style={styles.cartItemName}>{cartItem.menuItem.name}</Text>
                  <Text style={styles.cartItemPrice}>${totalPrice}</Text>
                </View>
                <View style={styles.cartItemRight}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(cartItem.menuItem.id, -1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(cartItem.menuItem.id, 1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.cartTotal}>
          <Text style={styles.cartTotalText}>Total: {cartData.totalPrice}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRelatedMenuItems = () => {
    if (!relatedMenuItems || relatedMenuItems.length === 0) return null;

    return (
      <View style={styles.relatedMenuItemsContainer}>
        <Text style={styles.relatedMenuItemsTitle}>You might also like</Text>
        <View style={styles.relatedMenuItemsGrid}>
          {relatedMenuItems.map((relatedItem) => (
            <TouchableOpacity
              key={relatedItem.id}
              style={styles.relatedMenuItem}
              onPress={() => navigation.navigate('MenuItemViewer', { 
                menuItemId: relatedItem.id,
                foodTruckId: foodTruckId 
              })}
            >
              <Image
                source={relatedItem.imageUrl 
                  ? { uri: relatedItem.imageUrl }
                  : require('../assets/images/blank-menu-item.png')
                }
                style={styles.relatedMenuItemImage}
                resizeMode="cover"
              />
              <View style={styles.relatedMenuItemContent}>
                <Text style={styles.relatedMenuItemName} numberOfLines={2}>
                  {relatedItem.name}
                </Text>
                {relatedItem.price && (
                  <Text style={styles.relatedMenuItemPrice}>
                    ${relatedItem.price}
                </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Menu Item Image */}
      <View style={styles.header}>
        <Image
          source={menuItem.imageUrl 
            ? { uri: menuItem.imageUrl }
            : require('../assets/images/blank-menu-item.png')
          }
          style={styles.headerImage}
          resizeMode="cover"
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Section */}
        <View style={styles.contentSection}>
            <View style={styles.headerRow}>
                <Text style={styles.menuItemName}>{menuItem.name}</Text>
                <Text style={styles.menuItemPrice}>+${menuItem.price}</Text>
            </View>
          {menuItem.description && (
            <Text style={styles.menuItemDescription}>
                {menuItem.description}
            </Text>
          )}
        </View>
        
        <View>
            {/* Option Groups */}
            {menuItem.optionGroups && menuItem.optionGroups.length > 0 && (
              menuItem.optionGroups.map((optionGroup) => renderOptionGroup(optionGroup))
            )}
            
            {/* Related Menu Items */}
            {renderRelatedMenuItems()}
            
        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={cartLoading}
        >
            <Text style={styles.addToCartButtonText}>
              {cartLoading ? 'Adding...' : 'Add to Cart'}
            </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    
    {/* Fixed Cart Icon */}
    <TouchableOpacity style={styles.cartIcon} onPress={handleCartPress}>
      <MaterialIcons name="shopping-cart" size={28} color="#000" />
    </TouchableOpacity>

    {/* Cart Popup Modal */}
    {showCartPopup && (
      <>
        {/* Backdrop to close popup when tapping outside */}
        <TouchableOpacity 
          style={styles.cartPopupBackdrop} 
          onPress={() => setShowCartPopup(false)}
          activeOpacity={1}
        />
        <View style={styles.cartPopup}>
          <View style={styles.cartPopupContent}>
            {cartLoading ? (
              <ActivityIndicator size="small" color="#F9B319" />
            ) : (
              <ScrollView 
                style={styles.cartPopupScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {renderCartItems()}
              </ScrollView>
            )}
          </View>
          <View style={styles.cartPopupTriangle} />
        </View>
      </>
    )}
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
    zIndex: 1,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    borderBottomWidth: 5,
    borderBottomColor: '#e39219',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FECD15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  backButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: 0,
    zIndex: 2,
  },
  contentSection: {
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'scroll',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    fontFamily: 'Cairo',
    letterSpacing: -0.8,
    flex: 1,
    marginRight: 12,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: 600,
    color: '#008000',
    backgroundColor: '#51cf66',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
    marginTop: 12,
    fontFamily: 'Cairo',
    maxWidth: 100,
    textAlign: 'center',
  },
  menuItemDescription: {
    fontSize: 16,
    lineHeight: 20,
    color: '#343e3d',
    fontFamily: 'Cairo',
    fontWeight: '300',
    width: 340,
    overflow: 'hidden',
  },
  optionGroup: {
    backgroundColor: '#fff',
    padding: 20,
    elevation: 3,
  },
  optionGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    fontFamily: 'Cairo',
    flex: 1,
  },
  requiredTag: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  requiredTagComplete: {
    backgroundColor: '#51cf66',
  },
  requiredTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredTagTextComplete: {
    color: 'white',
  },
  optionGroupLimit: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    fontFamily: 'Cairo',
    fontStyle: 'italic',
  },
  optionsList: {
    // Options list container
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  optionPrice: {
    fontSize: 14,
    color: '#2dc653',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  optionSelector: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionSelectorSelected: {
    backgroundColor: '#fecd15',
    borderColor: '#fecd15',
  },
  optionSelectorDisabled: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
    opacity: 0.5,
  },
  optionSelectorInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#fecd15',
    paddingVertical: 16,
    paddingHorizontal: 32,
    height: 60,
    width: screenWidth,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  addToCartButtonText: {
    color: '#76520e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Cairo',
  },
  relatedMenuItemsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  relatedMenuItemsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 16,
    fontFamily: 'Cairo',
  },
  relatedMenuItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  relatedMenuItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedMenuItemImage: {
    width: '100%',
    height: 120,
  },
  relatedMenuItemContent: {
    padding: 12,
  },
  relatedMenuItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  relatedMenuItemPrice: {
    fontSize: 12,
    color: '#008000',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  cartIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9B319',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  cartPopupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  cartPopup: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    zIndex: 999,
  },
  cartPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 300,
    height: 250,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cartPopupScroll: {
    flex: 1,
  },
  cartPopupScrollContent: {
    flexGrow: 1,
  },
  cartPopupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  cartPopupText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Cairo',
    lineHeight: 20,
  },
  cartPopupButton: {
    backgroundColor: '#F9B319',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartPopupButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  cartPopupTriangle: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  // Cart Items Styles
  cartEmptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  cartItemsContainer: {
    width: '100%',
  },
  cartItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  cartItemsList: {
    width: '100%',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  cartItemLeft: {
    marginRight: 12,
  },
  cartItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  cartItemCenter: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#008000',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9B319',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
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
    marginHorizontal: 8,
    fontFamily: 'Cairo',
    minWidth: 20,
    textAlign: 'center',
  },
  cartTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
