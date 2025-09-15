
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  useStripe,
  useConfirmPayment,
  CardField,
  usePlatformPay,
} from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../lib/payment-service';
import { fetchUser } from '../lib/user-service';
import CreditCardIcon from './CreditCardIcon';
import PaymentMethodManager from './PaymentMethodManager';


const { width: screenWidth } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPayment, loading } = useConfirmPayment();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const { 
    selectedAddress, userData, groupedItems,
    orderTotal, orderDeliveryFee, orderSubtotal,
    orderDiscountTotal
  } = route.params;
  
  const [cardDetails, setCardDetails] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(selectedAddress);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(userData.defaultUserPaymentMethod);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'payment_sheet'
  const [showPaymentManager, setShowPaymentManager] = useState(false);

  // Helper functions
  const handleAddressUpdate = (updatedAddress) => {
    setDeliveryAddress(updatedAddress);
  };

  const handlePaymentMethodUpdate = async () => {
    try {
      const updatedUserData = await fetchUser();
      setDefaultPaymentMethod(updatedUserData.defaultUserPaymentMethod);
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // ============================================================================
  // METHOD 1: CARD FIELD INTEGRATION (Direct Card Input)
  // ============================================================================

  const handleCardPayment = async () => {
    if (!defaultPaymentMethod?.stripePaymentMethodId) {
      Alert.alert('Error', 'No default payment method selected');
      return;
    }

    try {
      // Step 1: Create PaymentIntent using GraphQL service
      const paymentIntentData = await createPaymentIntent(orderTotal);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        return;
      }

      // Step 2: Confirm payment with Stripe using saved payment method
      const result = await confirmPayment(paymentIntentData.clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
          paymentMethodId: defaultPaymentMethod.stripePaymentMethodId,
        }
      });

      if (result.paymentIntent.status === 'Succeeded') {
          Alert.alert('Success', 'Payment successful!');
          // Navigate to success screen or update UI
          handlePaymentSuccess(result.paymentIntent);
       } else {
          Alert.alert('Payment Failed', result.error.message);
          console.error('Payment error:', result.error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Payment processing failed');
      console.error('Payment error:', err);
    }
  };


  // ============================================================================
  //  APPLE PAY INTEGRATION
  // ============================================================================

  const handleApplePay = async () => {
    try {
      // Check if Apple Pay is supported
      if (!isPlatformPaySupported) {
        Alert.alert('Apple Pay Not Available', 'Apple Pay is not supported on this device');
        return;
      }

      // Create payment intent using GraphQL service
      const paymentIntentData = await createPaymentIntent(amount);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        console.error('Missing client secret for Apple Pay:', paymentIntentData);
        return;
      }
      
      const { clientSecret } = paymentIntentData;
      console.log('Apple Pay - Client Secret:', clientSecret);

      // Present Apple Pay using confirmPlatformPayPayment
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: 'ThunderTruck Order',
              amount: (amount / 100).toFixed(2),
              paymentType: 'Immediate',
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          requiredBillingContactFields: ['emailAddress'],
          requiredShippingContactFields: [],
        },
      });

      if (error) {
        console.log('Apple Pay Failed:', error);
        Alert.alert('Apple Pay Failed', error.message);
      } else {
        Alert.alert('Success', 'Apple Pay payment completed!');
        handlePaymentSuccess(paymentIntentData);
      }
    } catch (err) {
      console.log('Apple Pay Error:', err);
      Alert.alert('Error', 'Apple Pay failed: ' + err.message);
    }
  };

  // ============================================================================
  // GOOGLE PAY INTEGRATION
  // ============================================================================

  const { confirmGooglePayPayment } = useStripe();

  const handleGooglePay = async () => {
    try {
      // Create payment intent using GraphQL service
      const paymentIntentData = await createPaymentIntent(amount);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        console.error('Missing client secret for Google Pay:', paymentIntentData);
        return;
      }
      
      const { clientSecret } = paymentIntentData;

      const { error } = await confirmGooglePayPayment(clientSecret, {
        testEnv: __DEV__, // Use test environment in development
      });

      if (error) {
        Alert.alert('Google Pay Failed', error.message);
      } else {
        Alert.alert('Success', 'Google Pay payment completed!');
      }
    } catch (err) {
      Alert.alert('Error', 'Google Pay failed');
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const handlePaymentSuccess = (paymentIntent) => {
    // Update local state, navigate to success screen, etc.
    console.log('Payment successful:', paymentIntent?.id);

    if (paymentIntent) {
      setPaymentIntent(paymentIntent);
    }
    
    // Navigate back to previous screen or to success screen
    navigation.goBack();
  };

  // ============================================================================
  // 8. COMPONENT RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Complete Your Order</Text>
          <Text style={styles.headerSubtitle}>Review your order details</Text>
        </View>
      </View>

      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerSpacer} />

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.changeButton}
              onPress={() => navigation.navigate('UserAddressList', { 
                onAddressSelect: handleAddressUpdate 
              })}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressCard}>
            {deliveryAddress?.label && (
              <Text style={styles.addressLabel}>{deliveryAddress.label}</Text>
            )}
            <Text style={styles.addressStreet}>{deliveryAddress?.streetLineOne}</Text>
            <Text style={styles.addressCity}>
              {deliveryAddress?.city}, {deliveryAddress?.state}
            </Text>
          </View>
        </View>

        {/* Order Breakdown Section */}
        <View style={styles.orderDetailsSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Order Breakdown</Text>
          </View>
           <View style={styles.orderMenuPanel}>
             {groupedItems && Object.entries(groupedItems).map(([truckName, items], index) => {
               const totalItems = items.reduce((sum, item) => sum + item.cartItem?.quantity, 0);
               const truckTotal = items.reduce((sum, item) => sum + ((item.cartItem?.menuItem?.price || 0) * item.cartItem?.quantity), 0);
               const isFirst = index === 0;
               const isLast = index === Object.entries(groupedItems).length - 1;
               
               return (
                 <View key={truckName} style={[
                   styles.truckPanel,
                   isFirst && styles.truckPanelFirst,
                   isLast && styles.truckPanelLast
                 ]}>
                  {/* Truck Header */}
                  <View style={styles.truckHeader}>
                    <View style={styles.truckHeaderLeft}>
                      <View style={styles.truckImageContainer}>
                        {items[0]?.foodTruckData?.coverImageUrl && (
                          <Image 
                            source={{ uri: items[0].foodTruckData.coverImageUrl }} 
                            style={styles.truckHeaderImage} 
                          />
                        )}
                      </View>
                      <View style={styles.truckInfo}>
                        <Text style={styles.truckName}>{truckName}</Text>
                        <Text style={styles.itemCount}>{totalItems} items</Text>
                      </View>
                    </View>
                    <View style={styles.truckHeaderRight}>
                      <Text style={styles.truckTotal}>{formatCurrency(truckTotal)}</Text>
                    </View>
                  </View>
                  
                  {/* Items Content */}
                  <View style={styles.truckContent}>
                    {items.map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <View style={styles.itemImageContainer}>
                          {item.cartItem.menuItem?.imageUrl && (
                            <Image source={{ uri: item.cartItem.menuItem.imageUrl }} style={styles.cartItemImage} />
                          )}
                        </View>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>
                            {item.cartItem?.menuItem?.name}
                          </Text>
                          <Text style={styles.itemQuantity}>
                            x{item.cartItem?.quantity}
                          </Text>
                        </View>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(((item.cartItem?.menuItem?.price || 0) * item.cartItem?.quantity))}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
          
        </View>

        {/* Pricing Breakdown Section */}
        <View style={styles.paymentDetailsSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
          </View>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingValue}>{formatCurrency(orderSubtotal)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Delivery Fee</Text>
              <Text style={styles.pricingValue}>{formatCurrency(orderDeliveryFee)}</Text>
            </View>
            {orderDiscountTotal > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>
                  -{formatCurrency(orderDiscountTotal)}
                </Text>
              </View>
            )}
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(orderTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.paymentInfoSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <TouchableOpacity 
              style={styles.changeButton}
              onPress={() => setShowPaymentManager(true)}
            >
              <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.paymentCard}>
            <View style={styles.paymentMethodRow}>
              <CreditCardIcon 
                brand={defaultPaymentMethod?.userPaymentDisplay?.brand || 'unknown'}
                size={32}
                style={styles.paymentMethodIcon}
              />
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodText}>
                  •••• •••• •••• {defaultPaymentMethod?.userPaymentDisplay?.lastFour || '****'} {defaultPaymentMethod?.userPaymentDisplay?.expMonth}/{defaultPaymentMethod?.userPaymentDisplay?.expYear}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Now Button */}
        <TouchableOpacity
          style={[styles.orderButton, (!defaultPaymentMethod?.stripePaymentMethodId || loading) && styles.disabledButton]}
          onPress={handleCardPayment}
          disabled={!defaultPaymentMethod?.stripePaymentMethodId || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FECD15" />
          ) : (
            <Text style={styles.orderButtonText}>Order Now</Text>
          )}
        </TouchableOpacity>

      {/* Apple Pay Button (iOS only and when supported) */}
      {Platform.OS === 'ios' && isPlatformPaySupported && (
        <TouchableOpacity
          style={styles.applePayButton}
          onPress={handleApplePay}
        >
          <Text style={styles.payButtonText}>Pay with Apple Pay</Text>
        </TouchableOpacity>
      )}

      {/* Google Pay Button (Android only) */}
      {Platform.OS === 'android' && (
        <TouchableOpacity
          style={styles.googlePayButton}
          onPress={handleGooglePay}
        >
          <Text style={styles.payButtonText}>Pay with Google Pay</Text>
        </TouchableOpacity>
      )}
    </ScrollView>

      {/* Payment Method Manager Modal */}
      <PaymentMethodManager
        visible={showPaymentManager}
        onClose={() => setShowPaymentManager(false)}
        onPaymentMethodAdded={handlePaymentMethodUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Professional Header Styles
  header: {
    backgroundColor: '#FB9C12',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#BF5B18',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FCFAD6',
    textAlign: 'center',
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FCFAD6',
    textAlign: 'center',
    fontFamily: 'Cairo',
    opacity: 0.9,
  },
  headerSpacer: {
    marginTop: 15,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginVertical: 24,
  },
  paymentDetailsSection: {
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfoSection: {
    marginHorizontal: 24,
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderMenuPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  orderDetailsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    marginHorizontal: 16,
  },
  sectionTitleContainer: {
    backgroundColor: '#FB9C12',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 18,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#BF5B18',
  },
  sectionTitle: {
    fontSize: 15,
    letterSpacing: 0.1,
    fontWeight: '600',
    color: '#FCFAD6',
    fontFamily: 'Cairo',
    textAlign: 'center',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 7,
    backgroundColor: '#FECD15',
    borderRadius: 6,
  },
  paymentChangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 30,
    backgroundColor: '#FECD15',
    borderRadius: 6,
  },
  changeButtonText: {
    color: '#132a13',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  // Address Card Styles
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  addressStreet: {
    fontSize: 16,
    color: '#132a13',
    marginBottom: 2,
    fontFamily: 'Cairo',
  },
  addressCity: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
  },
  // Truck Panel Styles
  truckPanel: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  truckPanelFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  truckPanelLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  truckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',

  },
  truckHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  truckImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  truckHeaderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  truckInfo: {
    marginLeft: 12,
    flex: 1,
  },
  truckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 2,
    fontFamily: 'Cairo',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
  },
  truckHeaderRight: {
    alignItems: 'flex-end',
  },
  truckTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  truckContent: {
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 96,
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImageText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#132a13',
    marginBottom: 2,
    fontFamily: 'Cairo',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  // Pricing Card Styles
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 3,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  pricingLabel: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  pricingValue: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  discountValue: {
    color: '#ff4444',
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  // Payment Card Styles
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 3,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  // Order Button Styles
  orderButton: {
    backgroundColor: '#FB9C12',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  // Apple Pay and Google Pay Button Styles
  applePayButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  googlePayButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  cartItemImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
  },
});

export default PaymentScreen;