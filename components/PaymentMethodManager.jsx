import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { 
  fetchUser, 
  addPaymentMethod, 
  removePaymentMethod 
} from '../lib/user-service';
import { createEphemeralKey, createSetupIntent, markDefaultPaymentMethod, fetchPaymentMethods } from '../lib/payment-service';
import CreditCardIcon from './CreditCardIcon';

const PaymentMethodManager = ({ visible, onClose, onPaymentMethodAdded, onDefaultPaymentMethodChanged }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Fetch payment methods directly instead of entire user data
      const paymentMethods = await fetchPaymentMethods();

      // Find the default payment method
      const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault);
      setDefaultPaymentMethod(defaultPaymentMethod);

      if (defaultPaymentMethod && paymentMethods.length > 1) {
        // Remove default from the list and add it to the beginning
        const otherMethods = paymentMethods.filter(
          pm => pm.id !== defaultPaymentMethod.id
        );

        setPaymentMethods(otherMethods);
      }
      
      // Still need user data for Stripe customer ID when adding new methods
      const user = await fetchUser();
      setUserData(user);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!userData?.stripeCustomerId) {
      Alert.alert('Error', 'No Stripe customer ID found');
      return;
    }

    try {
      setLoading(true);

      // 1. Get ephemeral key from your GraphQL backend
      const ephemeralKey = await createEphemeralKey();
      console.log('Created ephemeral key:', ephemeralKey);

      // 2. Get setup intent from your GraphQL backend
      const clientSecret = await createSetupIntent();
      console.log('Created setup intent client secret:', clientSecret);

      // 3. Initialize payment sheet with proper values
      console.log('Initializing payment sheet with:', {
        merchantDisplayName: 'ThunderTruck',
        customerId: userData.stripeCustomerId,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ThunderTruck',
        customerId: userData.stripeCustomerId,
        customerEphemeralKeySecret: ephemeralKey, // Now properly formatted
        setupIntentClientSecret: clientSecret, // Now properly formatted
        allowsDelayedPaymentMethods: true,
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        Alert.alert('Error', 'Failed to initialize payment method setup');
        return;
      }

      console.log('Payment sheet initialized successfully');

      // 4. Present payment sheet
      const { paymentOption, error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          console.error('Error presenting payment sheet:', presentError);
          Alert.alert('Error', 'Failed to add payment method');
        }
        return;
      }

      // For setup intents, paymentOption is typically null even on success
      // The payment method is automatically attached to the customer in Stripe
      // We don't get the payment method details in paymentOption for setup intents
      console.log('Payment sheet completed successfully:', { paymentOption, presentError });
      
      // Note: paymentOption will be null for setup intents, this is expected behavior
      // The payment method has been successfully added to the customer in Stripe
      // We can verify this by reloading the user data which will fetch updated payment methods

      // 5. Success - payment method was added to Stripe
      Alert.alert(
        'Success',
        'Payment method added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              loadUserData(); // Reload to get updated payment methods
              onPaymentMethodAdded?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding payment method:', error);
      
      // Show helpful error message for setup
      if (error.message.includes('Failed to create ephemeral key')) {
        Alert.alert(
          'Ephemeral Key Error',
          'Failed to create ephemeral key. Please check your GraphQL backend configuration.',
          [{ text: 'OK' }]
        );
      } else if (error.message.includes('Failed to create setup intent')) {
        Alert.alert(
          'Setup Intent Error',
          'Failed to create setup intent. Please check your GraphQL backend configuration.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to add payment method');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setLoading(true);
      const result = await markDefaultPaymentMethod(paymentMethodId);
      
      if (result.success) {
        console.log('Successfully marked payment method as default:', result.message);
        
        // Reload user data to get updated payment methods
        await loadUserData();

        onDefaultPaymentMethodChanged?.();
      } else {
        Alert.alert('Error', result.message || 'Failed to set default payment method');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to set default payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = (paymentMethodId) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await removePaymentMethod(paymentMethodId);
              
              if (success) {
                Alert.alert('Success', 'Payment method removed');
                loadUserData(); // Reload to get updated data
              } else {
                Alert.alert('Error', 'Failed to remove payment method');
              }
            } catch (error) {
              console.error('Error removing payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Removed getCardBrandIcon - now using CreditCardIcon component

  const renderPaymentMethod = (paymentMethod, isInDefaultPanel = false) => {
    const isDefault = paymentMethod.isDefault;
    const cardStyle = isInDefaultPanel ? styles.defaultPaymentMethodCard : styles.paymentMethodCard;
    
    return (
      <View key={paymentMethod.id} style={cardStyle}>
        <View style={styles.paymentMethodContent}>
          <View style={styles.paymentMethodLeft}>
            <CreditCardIcon 
              brand={paymentMethod.userPaymentDisplay.brand}
              size={100}
              style={styles.cardIcon}
            />
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.cardBrand}>
                {paymentMethod.userPaymentDisplay.brand.toUpperCase()}
              </Text>
              <Text style={styles.cardNumber}>
                •••• •••• •••• {paymentMethod.userPaymentDisplay.lastFour}
              </Text>
              <Text style={styles.cardExpiry}>
                Expires {paymentMethod.userPaymentDisplay.expMonth}/{paymentMethod.userPaymentDisplay.expYear}
              </Text>
              {isDefault && (
                <Text style={styles.defaultBadge}>DEFAULT</Text>
              )}
            </View>
          </View>
          
          <View style={styles.paymentMethodActions}>
            {!isDefault && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(paymentMethod.id)}
                  disabled={loading}
                >
                  <MaterialIcons name="star-border" size={20} color="#FECD15" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemovePaymentMethod(paymentMethod.id)}
                  disabled={loading}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#132a13" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FECD15" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}

          {/* Add Payment Method Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPaymentMethod}
            disabled={loading}
          >
            <MaterialIcons name="add" size={24} color="#132a13" />
            <Text style={styles.addButtonText}>Add Payment Method</Text>
          </TouchableOpacity>

          {/* Payment Methods List */}
          {!loading && (
            <>
              {defaultPaymentMethod && (
                <View style={styles.defaultSection}>
                  <View style={styles.defaultSectionHeader}>
                    <MaterialIcons name="star" size={20} color="#FECD15" />
                    <Text style={styles.defaultSectionTitle}>Default Payment Method</Text>
                  </View>
                  <View style={styles.defaultPanel}>
                    {renderPaymentMethod(defaultPaymentMethod, true)}
                  </View>
                </View>
              )}

              {paymentMethods.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Methods</Text>
                  {paymentMethods.map((paymentMethod) => 
                    renderPaymentMethod(paymentMethod)
                  )}
                </View>
              )}

              {paymentMethods.length === 0 && !defaultPaymentMethod && (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="credit-card" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No payment methods</Text>
                  <Text style={styles.emptySubtext}>
                    Add a payment method to get started
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FB9C12',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'whitesmoke',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FECD15',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#132a13',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Cairo',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  defaultSection: {
    marginBottom: 24,
  },
  defaultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  defaultSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    marginLeft: 8,
    fontFamily: 'Cairo',
  },
  defaultPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 4,
    borderTopColor: '#FECD15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultPaymentMethodCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginBottom: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentMethodLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Cairo',
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Cairo',
  },
  defaultBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FECD15',
    backgroundColor: '#132a13',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    fontFamily: 'Cairo',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    fontFamily: 'Cairo',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Cairo',
  },
});

export default PaymentMethodManager;
