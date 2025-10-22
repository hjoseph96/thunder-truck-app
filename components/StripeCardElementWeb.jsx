import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const StripeCardElementWeb = ({ clientSecret, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [showTestInfo, setShowTestInfo] = useState(true);

  // Generate random test card data
  const getTestExpiration = () => {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1).slice(-2);
    return `${month}/${year}`;
  };

  const getTestCVC = () => {
    return String(Math.floor(Math.random() * 900) + 100);
  };

  const testCardData = {
    number: '4242 4242 4242 4242',
    expiry: getTestExpiration(),
    cvc: getTestCVC(),
    zip: '12345'
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#132a13',
        fontFamily: 'Cairo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#999',
        },
        iconColor: '#666',
      },
      invalid: {
        color: '#ff4444',
        iconColor: '#ff4444',
      },
    },
    hidePostalCode: false,
  };

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.error('🌐 Stripe.js has not loaded or missing client secret');
      setCardError('Payment system not ready. Please try again.');
      onError?.({ message: 'Payment system not ready' });
      return;
    }

    setLoading(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      console.log('🌐 Confirming card setup with client secret:', clientSecret);
      
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('🌐 Stripe confirmCardSetup error:', error);
        setCardError(error.message);
        onError?.(error);
      } else {
        console.log('✅ Card setup successful:', setupIntent);
        onSuccess?.(setupIntent);
      }
    } catch (error) {
      console.error('🌐 Error confirming card setup:', error);
      setCardError(error.message || 'An error occurred');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render on non-web platforms
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Test Card Banner */}
      {showTestInfo && (
        <View style={styles.testCardBanner}>
          <View style={styles.testCardHeader}>
            <Text style={styles.testCardTitle}>🧪 Test Mode - Use Test Card</Text>
            <TouchableOpacity onPress={() => setShowTestInfo(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testCardInfo}>
            <Text style={styles.testCardLabel}>Card Number:</Text>
            <Text style={styles.testCardValue}>{testCardData.number}</Text>
          </View>
          <View style={styles.testCardRow}>
            <View style={styles.testCardInfo}>
              <Text style={styles.testCardLabel}>Expiry:</Text>
              <Text style={styles.testCardValue}>{testCardData.expiry}</Text>
            </View>
            <View style={styles.testCardInfo}>
              <Text style={styles.testCardLabel}>CVC:</Text>
              <Text style={styles.testCardValue}>{testCardData.cvc}</Text>
            </View>
            <View style={styles.testCardInfo}>
              <Text style={styles.testCardLabel}>ZIP:</Text>
              <Text style={styles.testCardValue}>{testCardData.zip}</Text>
            </View>
          </View>
          <Text style={styles.testCardNote}>Copy these values into the form below</Text>
        </View>
      )}

      {/* Card Element */}
      <View style={styles.cardElementWrapper}>
        <CardElement 
          options={cardElementOptions} 
          onChange={handleCardChange}
        />
      </View>

      {/* Error Message */}
      {cardError && (
        <Text style={styles.errorText}>{cardError}</Text>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button, 
            styles.submitButton,
            (loading || !stripe || !cardComplete) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={loading || !stripe || !cardComplete}
        >
          {loading ? (
            <ActivityIndicator color="#132a13" />
          ) : (
            <Text style={styles.submitButtonText}>Add Card</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stripe Badge */}
      <Text style={styles.stripeBadge}>🔒 Secured by Stripe</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  testCardBanner: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    fontFamily: 'Cairo',
  },
  closeButton: {
    fontSize: 20,
    color: '#856404',
    fontWeight: '700',
    padding: 4,
  },
  testCardInfo: {
    marginBottom: 8,
  },
  testCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  testCardLabel: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  testCardValue: {
    fontSize: 16,
    color: '#132a13',
    fontWeight: '700',
    fontFamily: 'Courier, monospace',
  },
  testCardNote: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'Cairo',
  },
  cardElementWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Cairo',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  submitButton: {
    backgroundColor: '#FECD15',
  },
  submitButtonText: {
    color: '#132a13',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  stripeBadge: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    fontFamily: 'Cairo',
  },
});

export default StripeCardElementWeb;

