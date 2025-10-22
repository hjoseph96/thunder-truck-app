import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useStripe,
  useConfirmPayment,
  usePlatformPay,
} from '../lib/stripe/stripe-hooks';
import { CardField } from './payment/CardField';
import { createPaymentIntent, createOrders, syncPaymentMethods } from '../lib/payment-service';
import { fetchUser } from '../lib/user-service';
import CreditCardIcon from './CreditCardIcon';
import PaymentMethodManager from './PaymentMethodManager';
import DeliveryMethodSelector from './DeliveryMethodSelector';
import OrderSuccessModal from './OrderSuccessModal';

const { width: screenWidth } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPayment, loading } = useConfirmPayment();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const {
    selectedAddress,
    userData,
    groupedItems,
    orderTotal,
    orderDeliveryFee,
    orderSubtotal,
    orderDiscountTotal,
    cartIds,
  } = route.params;

  const [deliveryAddress, setDeliveryAddress] = useState(selectedAddress);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(
    userData.defaultUserPaymentMethod,
  );
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(null);
  const [showPaymentManager, setShowPaymentManager] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Helper functions
  const handleAddressUpdate = (updatedAddress) => {
    setDeliveryAddress(updatedAddress);
  };

  const handlePaymentMethodUpdate = async () => {
    try {
      await syncPaymentMethods();
      const updatedUserData = await fetchUser();

      setDefaultPaymentMethod(updatedUserData.defaultUserPaymentMethod);
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  const handleDeliveryMethodUpdate = (updatedDeliveryMethod) => {
    setSelectedDeliveryMethod(updatedDeliveryMethod);
  };

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    // Navigate back or to success screen
    // navigation.goBack();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
      const totalInCents = parseInt(orderTotal * 100);

      // Step 1: Create PaymentIntent using GraphQL service
      const paymentIntentData = await createPaymentIntent(totalInCents);

      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        return;
      }

      // Step 2: Confirm payment with Stripe using saved payment method
      const result = await confirmPayment(paymentIntentData.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId: defaultPaymentMethod.stripePaymentMethodId,
        },
      });

      if (result.error) {
        Alert.alert('Payment Failed', result.error.message || 'Payment processing failed');
        console.error('Payment error:', result.error);
        return;
      }

      if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'Succeeded')) {
        // Navigate to success screen or update UI
        handlePaymentSuccess(result.paymentIntent);
      } else if (result.paymentIntent) {
        Alert.alert('Payment Failed', `Payment status: ${result.paymentIntent.status}`);
        console.error('Payment status:', result.paymentIntent.status);
      } else {
        Alert.alert('Payment Failed', 'Unknown payment error occurred');
        console.error('Payment error: No payment intent returned');
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
      const totalInCents = parseInt(orderTotal * 100);
      const paymentIntentData = await createPaymentIntent(totalInCents);

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
              amount: (totalInCents / 100).toFixed(2),
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
      const totalInCents = parseInt(orderTotal * 100);
      // Create payment intent using GraphQL service
      const paymentIntentData = await createPaymentIntent(totalInCents);

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
  };

  const setPaymentIntent = async (paymentIntent) => {
    try {
      const orderData = constructOrderData(paymentIntent);
      console.log('Order Data: ', orderData);

      console.log('Cart IDs: ', cartIds);

      const createdOrdersData = await createOrders(orderData, cartIds);
      console.log('Created Orders Data: ', createdOrdersData);

      if (createdOrdersData.success) {
        // Show success animation
        setShowSuccessAnimation(true);

        setTimeout(() => {
          const orders = createdOrdersData.orders || [];
          
          // Backend returns array where:
          // - First item (index 0) = Parent order (no foodTruck)
          // - Remaining items (index 1+) = Individual vendor orders (have foodTruck)
          const vendorOrders = orders.slice(1); // Skip parent order at index 0
          
          // Check if there are multiple vendor orders (multi-vendor purchase)
          if (vendorOrders.length > 1) {
            // Navigate to OrderBreakdownView with vendor order IDs only
            const vendorOrderIds = vendorOrders.map(order => order.id);
            navigation.navigate('OrderBreakdownView', {
              orderIds: vendorOrderIds,
            });
          } else if (vendorOrders.length === 1) {
            // Single vendor order - navigate directly to OrderDetailScreen
            navigation.navigate('OrderDetail', {
              orderId: vendorOrders[0].id,
            });
          } else {
            // Fallback: if no vendor orders, use parent order (shouldn't happen)
            navigation.navigate('OrderDetail', {
              orderId: createdOrdersData.orderId || orders[0]?.id,
            });
          }
        }, 2000); // Wait for success animation to complete
      }
    } catch (error) {
      console.error('Error creating orders:', error);
      Alert.alert('Order Error', 'Failed to create your order. Please try again.');
    }
  };

  const constructOrderData = (paymentIntent) => {
    const orderAddress = {
      destinationType: deliveryAddress.destinationType,
      streetLineOne: deliveryAddress.streetLineOne,
      streetLineTwo: deliveryAddress.streetLineTwo,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      zipCode: deliveryAddress.zipCode,
      country: deliveryAddress.country,
      latlong: deliveryAddress.latlong,
      deliveryInstructions: deliveryAddress.deliveryInstructions,
    };

    const userOrderData = {
      promotionId: null,
      deliveryMethodId: selectedDeliveryMethod.id,
      subtotalCents: parseInt(orderSubtotal * 100),
      deliveryFeeCents: parseInt(orderDeliveryFee * 100),
      tipCents: 0,
      userId: userData.id,
      orderItems: Object.entries(groupedItems)
        .map(([truckName, items], index) => {
          return {
            vendorName: truckName,
            menuItemName: items[0].cartItem.menuItem.name,
            quantity: items[0].cartItem.quantity,
            totalPriceCents: parseInt(
              items[0].cartItem.menuItem.price * items[0].cartItem.quantity * 100,
            ),
          };
        })
        .flat(),
      orderPayments: [
        {
          amountChargedCents: parseInt(orderTotal * 100),
          stripePaymentIntentId: paymentIntent.id || paymentIntent.paymentIntentId,
        },
      ],
      orderAddresses: [orderAddress],
    };

    if (Object.keys(groupedItems).length === 1) {
      const firstTruck = Object.values(groupedItems)[0];
      userOrderData.foodTruckId = firstTruck[0].foodTruckData.id;
    }

    const singleDeliveryFeeInCents = 299;
    const foodTruckOrderData = Object.entries(groupedItems).map(([truckName, items], index) => {
      const truckTotal = items.reduce(
        (sum, item) => sum + (item.cartItem?.menuItem?.price || 0) * item.cartItem?.quantity,
        0,
      );
      const foodTruckId = items[0].foodTruckData.id;
      const userId = userData.id;

      const orderItems = items.map((item) => {
        return {
          vendorName: truckName,
          menuItemName: item.cartItem.menuItem.name,
          quantity: item.cartItem.quantity,
          totalPriceCents: parseInt(item.cartItem.menuItem.price * item.cartItem.quantity * 100),
        };
      });

      const orderPayments = [
        {
          amountChargedCents: parseInt(truckTotal * 100) + singleDeliveryFeeInCents,
          stripePaymentIntentId: paymentIntent.id || paymentIntent.paymentIntentId,
        },
      ];

      return {
        userId: userId,
        foodTruckId: foodTruckId,
        promotionId: null,
        deliveryMethodId: selectedDeliveryMethod.id,
        subtotalCents: parseInt(orderSubtotal * 100),
        deliveryFeeCents: parseInt(orderDeliveryFee * 100),
        tipCents: 0,
        orderItems: orderItems,
        orderPayments: orderPayments,
        orderAddresses: [orderAddress],
      };
    });

    return [userOrderData, ...foodTruckOrderData];
  };

  // ============================================================================
  // 8. COMPONENT RENDER
  // ============================================================================

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
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
        <View style={styles.headerSpacer} />
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
              onPress={() =>
                navigation.navigate('UserAddressList', {
                  userAddresses: userData?.userAddresses || [],
                  onAddressSelect: handleAddressUpdate,
                })
              }
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

            <View style={styles.addressDeliveryInstructions}>
              <TextInput
                style={styles.addressDeliveryInstructionsText}
                value={deliveryAddress?.deliveryInstructions || ''}
                onChangeText={(value) =>
                  handleAddressUpdate({ ...deliveryAddress, deliveryInstructions: value })
                }
                placeholder="Any special drop off instructions?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={9}
                maxLength={300}
              />
            </View>
          </View>
        </View>

        {/* Delivery Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Delivery Method</Text>
            </View>
          </View>
          <View style={styles.deliveryMethodCard}>
            <DeliveryMethodSelector
              selectedDeliveryMethod={selectedDeliveryMethod}
              onDeliveryMethodSelect={handleDeliveryMethodUpdate}
            />
          </View>
        </View>

        {/* Order Breakdown Section */}
        <View style={styles.orderDetailsSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Order Breakdown</Text>
          </View>
          <View style={styles.orderMenuPanel}>
            {groupedItems &&
              Object.entries(groupedItems).map(([truckName, items], index) => {
                const totalItems = items.reduce((sum, item) => sum + item.cartItem?.quantity, 0);
                const truckTotal = items.reduce(
                  (sum, item) =>
                    sum + (item.cartItem?.menuItem?.price || 0) * item.cartItem?.quantity,
                  0,
                );
                const isFirst = index === 0;
                const isLast = index === Object.entries(groupedItems).length - 1;

                return (
                  <View
                    key={truckName}
                    style={[
                      styles.truckPanel,
                      isFirst && styles.truckPanelFirst,
                      isLast && styles.truckPanelLast,
                    ]}
                  >
                    {/* Truck Header */}
                    <View style={styles.truckHeader}>
                      <View style={styles.truckHeaderLeft}>
                        <View style={styles.truckImageContainer}>
                          {items[0]?.foodTruckData?.coverImageUrl && (
                            <Image
                              source={{ uri: items[0].foodTruckData.logoUrl }}
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
                              <Image
                                source={{ uri: item.cartItem.menuItem.imageUrl }}
                                style={styles.cartItemImage}
                              />
                            )}
                          </View>
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.cartItem?.menuItem?.name}</Text>
                            <Text style={styles.itemQuantity}>x{item.cartItem?.quantity}</Text>
                          </View>
                          <Text style={styles.itemPrice}>
                            {formatCurrency(
                              (item.cartItem?.menuItem?.price || 0) * item.cartItem?.quantity,
                            )}
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
                size={64}
                style={styles.paymentMethodIcon}
              />
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodText}>
                  •••• •••• •••• {defaultPaymentMethod?.userPaymentDisplay?.lastFour || '****'}{' '}
                  {defaultPaymentMethod?.userPaymentDisplay?.expMonth}/
                  {defaultPaymentMethod?.userPaymentDisplay?.expYear}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.orderButtonContainer}>
          {/* Order Now Button */}
          <TouchableOpacity
            style={[
              styles.orderButton,
              (!defaultPaymentMethod?.stripePaymentMethodId || loading) && styles.disabledButton,
            ]}
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
            <TouchableOpacity style={styles.applePayButton} onPress={handleApplePay}>
              <Text style={styles.payButtonText}>Pay with Apple Pay</Text>
            </TouchableOpacity>
          )}

          {/* Google Pay Button (Android only) */}
          {Platform.OS === 'android' && (
            <TouchableOpacity style={styles.googlePayButton} onPress={handleGooglePay}>
              <Text style={styles.payButtonText}>Pay with Google Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Payment Method Manager Modal */}
      <PaymentMethodManager
        visible={showPaymentManager}
        onClose={() => setShowPaymentManager(false)}
        onPaymentMethodAdded={handlePaymentMethodUpdate}
        onDefaultPaymentMethodChanged={handlePaymentMethodUpdate}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        visible={showSuccessAnimation}
        onComplete={handleSuccessAnimationComplete}
      />
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
        width: '100%',
      },
    }),
  },
  // Modern Professional Header Styles (Consistent with CheckoutForm)
  header: {
    backgroundColor: '#2D1E2F',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: 16,
        flexShrink: 0,
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
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    marginTop: 15,
  },
  scrollContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 82,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      },
      default: {
        paddingBottom: 40,
      },
    }),
  },
  contentContainer: {
    paddingBottom: 40,
    ...Platform.select({
      web: {
        paddingBottom: 60,
      },
    }),
  },
  section: {
    marginVertical: 24,
  },
  addressDeliveryInstructions: {
    marginTop: 12,
  },
  addressDeliveryInstructionsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
    minHeight: 96,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    outlineStyle: 'none', // Remove outline on web
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
  // Delivery Method Card Styles
  deliveryMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
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
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  truckHeaderImage: {
    width: 40,
    height: 40,
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
  truckContent: {},
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
  orderButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
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
