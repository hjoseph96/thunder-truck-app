import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PaymentMethodSection = ({ userData }) => {
  const defaultPaymentMethod = userData?.default_payment_method;
  const hasPaymentMethods = userData?.user_payment_methods?.length > 0;

  const getBrandIcon = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'credit-card';
      case 'mastercard':
        return 'credit-card';
      case 'amex':
      case 'american_express':
        return 'credit-card';
      case 'discover':
        return 'credit-card';
      default:
        return 'credit-card';
    }
  };

  const getBrandColor = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
      case 'american_express':
        return '#006FCF';
      case 'discover':
        return '#FF6000';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.paymentMethodButton}>
        <View style={styles.paymentContent}>
          <MaterialIcons 
            name="account-balance-wallet" 
            size={24} 
            color="#8B4513" 
            style={styles.walletIcon} 
          />
          <View style={styles.paymentDetails}>
            {!hasPaymentMethods ? (
              <Text style={styles.addPaymentText}>Add a Payment Method</Text>
            ) : defaultPaymentMethod ? (
              <>
                <Text style={styles.paymentMethodText}>
                  {defaultPaymentMethod.user_payment_display?.brand?.toUpperCase()} •••• {defaultPaymentMethod.user_payment_display?.last4}
                </Text>
                <Text style={styles.paymentMethodSubtext}>Default payment method</Text>
              </>
            ) : (
              <Text style={styles.addPaymentText}>Select Payment Method</Text>
            )}
          </View>
          <View style={styles.paymentRight}>
            {defaultPaymentMethod?.user_payment_display?.brand && (
              <MaterialIcons 
                name={getBrandIcon(defaultPaymentMethod.user_payment_display.brand)}
                size={24}
                color={getBrandColor(defaultPaymentMethod.user_payment_display.brand)}
                style={styles.brandIcon}
              />
            )}
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  addPaymentText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#666',
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 8,
  },
});

export default PaymentMethodSection;
