import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchUser } from '../lib/user-service';
import { fetchCarts, changeCartItemQuantity, removeCartItem } from '../lib/cart-service';
import CartItemDrawer from './CartItemDrawer';
import PaymentMethodSection from './PaymentMethodSection';
import PromotionsSection from './PromotionsSection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CheckoutForm = ({ route, navigation }) => {
  const [userData, setUserData] = useState(null);
  const [cartsData, setCartsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(route.params?.selectedAddress || null);
  const [expandedDrawers, setExpandedDrawers] = useState({});

  useEffect(() => {
    loadCheckoutData();
  }, []);

  // Handle initial selected address from route params
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
      // Clear the route params to prevent re-setting
      navigation.setParams({ selectedAddress: undefined });
    }
  }, [route.params?.selectedAddress, navigation]);

  useEffect(() => {
    console.log('Carts Data Length: ', cartsData.length);
  }, [cartsData]);

  // Reload data when returning from AddAddressForm or handle selected address
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if there's a selected address from route params
      if (route.params?.selectedAddress) {
        setSelectedAddress(route.params.selectedAddress);
        // Clear the route params to prevent re-setting on subsequent focuses
        navigation.setParams({ selectedAddress: undefined });
      } else {
        loadCheckoutData();
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Load user data with addresses
      const user = await fetchUser();
      setUserData(user);
      
      // Set default address if available
      if (user?.userAddresses?.length > 0 && !selectedAddress) {
        const defaultAddress = user.userAddresses.find(address => address.isDefault);
        setSelectedAddress(defaultAddress);
      }
      
      // Load all carts data
      const carts = await fetchCarts();
      setCartsData(carts);
      
      // Initialize expanded drawers (all open by default)
      if (carts && carts.length > 0) {
        const initialExpanded = {};

        console.log('Carts Data Length: ', carts.length);
        carts.forEach(cart => {
          if (cart.cartItems && cart.cartItems.length > 0) {
            const foodTruckName = cart.foodTruck.name;
            initialExpanded[foodTruckName] = false;
          }
        });
        setExpandedDrawers(initialExpanded);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = (foodTruckName) => {
    setExpandedDrawers(prev => ({
      ...prev,
      [foodTruckName]: !prev[foodTruckName]
    }));
  };

  const handleQuantityChange = async (cartItemId, quantityChange) => {
    try {
      setCartLoading(true);
      
      // Find the cart item to get current quantity
      let currentQuantity = 0;
      let cartToUpdate = null;
      
      for (const cart of cartsData) {
        const cartItem = cart.cartItems.find(item => item.id === cartItemId);
        
        if (cartItem) {
          currentQuantity = cartItem.quantity;
          cartToUpdate = cart;
          break;
        }
      }
      
      const newQuantity = currentQuantity + quantityChange;
      
      if (newQuantity <= 0) {
        // Remove the cart item completely
        await removeCartItem(cartItemId);
        
        // Reload carts to reflect the deletion
        const updatedCarts = await fetchCarts();

        setCartsData(updatedCarts);
        
        // Check if the cart is now empty and remove it from expanded drawers
        const updatedCart = updatedCarts.find(cart => cart.id === cartToUpdate.id);
        if (!updatedCart || !updatedCart.cartItems || updatedCart.cartItems.length === 0) {
          setExpandedDrawers(prev => {
            const newExpanded = { ...prev };
            delete newExpanded[cartToUpdate.foodTruck.name];
            return newExpanded;
          });
        }
      } else {
        // Update the quantity
        await changeCartItemQuantity(cartItemId, newQuantity);
        
        // Reload carts to reflect the changes
        const updatedCarts = await fetchCarts();

        console.log('Updated Carts Data Length: ', updatedCarts.length);
        setCartsData(updatedCarts);
      }
    } catch (error) {
      // TODO: Show error message to user
      console.error('Error updating cart item quantity:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const groupCartItemsByFoodTruck = () => {
    if (!cartsData || cartsData.length === 0) return {};
    
    const grouped = {};
    
    cartsData.forEach(cart => {
      if (cart.cartItems && cart.cartItems.length > 0) {
        const foodTruckName = cart.foodTruck.name;
        
        if (!grouped[foodTruckName]) {
          grouped[foodTruckName] = [];
        }
        
        cart.cartItems.forEach(item => {
          grouped[foodTruckName].push({ cartItem: item, foodTruckData: cart.foodTruck });
        });
      }
    });
    
    return grouped;
  };

  const calculateDeliveryFee = () => {
    // For now, let's assume a flat delivery fee of $2.99 per order & calculate based on the number of food trucks
    return (cartsData.length > 0 ? 2.99 * cartsData.length : 0).toFixed(2);
  };

  const calculateSubtotal = () => {
    if (!cartsData || cartsData.length === 0) return 0;
    
    return cartsData.reduce((total, cart) => {
      const cartTotal = parseFloat(cart.totalPrice.replace('$', '')) || 0;
      return total + cartTotal;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();

    // For multiple carts, we might want to calculate delivery fees differently
    const deliveryFee = calculateDeliveryFee();
    const promotionDiscount = 0; // TODO: Calculate from promotions
    return subtotal + parseFloat(deliveryFee) - parseFloat(promotionDiscount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FECD15" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  const groupedItems = groupCartItemsByFoodTruck();

  const paymentScreenParams = {
    selectedAddress: selectedAddress,
    userData: userData,
    groupedItems: groupedItems,
    cartIds: cartsData.map((cart) => cart.id),
    orderTotal: calculateTotal(),
    orderDeliveryFee: calculateDeliveryFee(),
    orderSubtotal: calculateSubtotal(),
    orderDiscountTotal: 8.00,
  };

  return (
    <View style={styles.container}>
      {/* Modern Professional Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#2D1E2F" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <TouchableOpacity 
            style={styles.addressSelector}
            onPress={() => selectedAddress ? navigation.navigate('UserAddressList', { userAddresses: userData?.userAddresses, updateSelectedAddress: setSelectedAddress }) : navigation.navigate('AddAddressForm')}
          >
            <View style={styles.addressContent}>
              <MaterialIcons name="location-on" size={24} color="red" style={styles.locationIcon} />
              <View style={styles.addressDetails}>
                {selectedAddress ? (
                  <>
                    {selectedAddress.label && (
                      <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                    )}
                    <Text style={styles.addressStreet}>{selectedAddress.streetLineOne}</Text>
                    <Text style={styles.addressCity}>
                      {selectedAddress.city}, {selectedAddress.state}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.noAddressText}>Select delivery address</Text>
                )}
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Cart Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Order</Text>
          {Object.entries(groupedItems).map(([foodTruckName, cartItemData]) => (
            <CartItemDrawer
              key={foodTruckName}
              foodTruckName={foodTruckName}
              cartItems={cartItemData}
              isExpanded={expandedDrawers[foodTruckName]}
              onToggle={() => toggleDrawer(foodTruckName)}
              onQuantityChange={handleQuantityChange}
              cartLoading={cartLoading}
            />
          ))}
        </View>

        {/* Payment Section */}
        <PaymentMethodSection userData={userData} up/>

        {/* Promotions Section */}
        <PromotionsSection />

        {/* Fare Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.fareBreakdown}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Subtotal:</Text>
              <Text style={styles.fareValue}>${(calculateSubtotal()).toFixed(2)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Promotion:</Text>
              <Text style={styles.discountLabel}>- $8.00</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Delivery Fee:</Text>
              <Text style={styles.fareValue}>
                ${calculateDeliveryFee()}
              </Text>
            </View>
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacer for Fixed Button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('PaymentScreen', paymentScreenParams)}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#2D1E2F',
    color: '#D38105',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    // Professional shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D38105',
    letterSpacing: -0.3,
    fontFamily: 'Cairo',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 100,
      },
    }),
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressSelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  addressStreet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 14,
    color: '#666',
  },
  noAddressText: {
    fontSize: 14,
    color: '#999',
  },
  fareBreakdown: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.01,
    fontWeight: '400',
  },
  fareValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountLabel: {
    fontSize: 14,
    color: '#de1135',
    backgroundColor: '#de1135',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 1,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.1,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingTop: 10,
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        height: 'auto',
        zIndex: 98,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        paddingVertical: 12,
      },
    }),
  },
  nextButton: {
    backgroundColor: '#2D1E2F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 2,
    borderTopColor: '#eee',
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
  },
  nextButtonText: {
    color: '#D38105',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutForm;
