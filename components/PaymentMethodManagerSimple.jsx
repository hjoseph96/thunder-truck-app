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
import { createPaymentMethod } from '@stripe/stripe-react-native';
import { 
  fetchUser, 
  addPaymentMethod, 
  setDefaultPaymentMethod, 
  removePaymentMethod 
} from '../lib/user-service';

const PaymentMethodManagerSimple = ({ visible, onClose, onPaymentMethodAdded }) => {
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
      const user = await fetchUser();
      setUserData(user);
      setPaymentMethods(user.userPaymentMethods || []);
      setDefaultPaymentMethod(user.defaultUserPaymentMethod);
    } catch (error) {
      console.error('Error loading user data:', error);
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

      // For testing purposes, create a test payment method
      // In production, you would collect card details through a secure form
      Alert.alert(
        'Add Payment Method',
        'This is a simplified version for testing. In production, you would:\n\n1. Collect card details securely\n2. Create payment method with Stripe\n3. Save to your backend\n\nFor now, we\'ll simulate adding a payment method.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Add',
            onPress: async () => {
              try {
                // Simulate creating a payment method
                // In real implementation, you would use createPaymentMethod with actual card details
                const mockPaymentMethodId = `pm_test_${Date.now()}`;
                
                // Save to your backend via GraphQL
                const result = await addPaymentMethod(mockPaymentMethodId);
                
                Alert.alert('Success', 'Payment method added successfully!');
                loadUserData(); // Reload to get updated payment methods
                onPaymentMethodAdded?.();
              } catch (error) {
                console.error('Error adding payment method:', error);
                Alert.alert('Error', 'Failed to add payment method');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setLoading(true);
      const success = await setDefaultPaymentMethod(paymentMethodId);
      
      if (success) {
        Alert.alert('Success', 'Default payment method updated');
        loadUserData(); // Reload to get updated data
      } else {
        Alert.alert('Error', 'Failed to set default payment method');
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

  const getCardBrandIcon = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
      case 'american_express':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const renderPaymentMethod = (paymentMethod, isDefault = false) => (
    <View key={paymentMethod.id} style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodContent}>
        <View style={styles.paymentMethodLeft}>
          <Text style={styles.cardIcon}>
            {getCardBrandIcon(paymentMethod.userPaymentDisplay.brand)}
          </Text>
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
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(paymentMethod.id)}
              disabled={loading}
            >
              <MaterialIcons name="star-border" size={20} color="#FECD15" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemovePaymentMethod(paymentMethod.id)}
            disabled={loading}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Default Payment Method</Text>
                  {renderPaymentMethod(defaultPaymentMethod, true)}
                </View>
              )}

              {paymentMethods.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Other Payment Methods</Text>
                  {paymentMethods.map((paymentMethod) => 
                    renderPaymentMethod(paymentMethod, false)
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
    fontSize: 24,
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

export default PaymentMethodManagerSimple;
