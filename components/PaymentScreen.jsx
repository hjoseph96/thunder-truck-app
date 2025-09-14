
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
import { getStoredToken, getStoredUserData } from '../lib/token-manager';
import { STRIPE_CONFIG } from '../config/stripe-config';

const { width: screenWidth } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPayment, loading } = useConfirmPayment();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  
  const [cardDetails, setCardDetails] = useState(null);
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'payment_sheet'
  const [clientSecret, setClientSecret] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [userToken, setUserToken] = useState('');
  const [userData, setUserData] = useState(null);

  const [amount, setAmount] = useState(2000); // Default $20.00 in cents

  // ============================================================================
  // METHOD 1: CARD FIELD INTEGRATION (Direct Card Input)
  // ============================================================================

  const handleCardPayment = async () => {
    if (!cardDetails?.complete || !email) {
      Alert.alert('Error', 'Please enter complete card details and email');
      return;
    }

    try {
      // Step 1: Create PaymentIntent using GraphQL service
      const paymentIntentData = await createPaymentIntent(amount);
      console.log('Payment Intent Data:', paymentIntentData);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        console.error('Missing client secret:', paymentIntentData);
        return;
      }

      const clientSecret = paymentIntentData.clientSecret;
      console.log('Client Secret:', clientSecret);

      // Step 2: Confirm payment with Stripe
      const result = await confirmPayment(paymentIntentData.clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
            billingDetails: {
                email: email,
            },
            setupFutureUsage: 'OffSession',  // 🔑 This saves the payment method!
        }
      });
      console.log('Result: ', result);

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
  // METHOD 2: PAYMENT SHEET INTEGRATION (Recommended)
  // ============================================================================

  const initializePaymentSheet = async () => {
    try {
      // Get payment intent using GraphQL service
      const paymentIntentData = await createPaymentIntent(amount);
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        Alert.alert('Error', 'Failed to get payment intent from server');
        console.error('Missing client secret for payment sheet:', paymentIntentData);
        return;
      }
      
      const { clientSecret } = paymentIntentData;
      setClientSecret(clientSecret);

      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ThunderTruck',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          email: email,
        },
        returnURL: 'thundertruck://payment-complete',
      });

      if (error) {
        Alert.alert('Initialization Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to initialize payment');
      console.error('Init error:', err);
    }
  };

  const handlePaymentSheetPayment = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert('Payment Failed', error.message);
    } else {
      Alert.alert('Success', 'Payment completed successfully!');

      // Payment successful - handle success
      handlePaymentSuccess();
    }
  };



  // ============================================================================
  // 5. APPLE PAY INTEGRATION
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
  // 6. GOOGLE PAY INTEGRATION
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
  // 7. HELPER FUNCTIONS
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

  useEffect(() => {
    // Load user token on component mount
    const loadUserToken = async () => {
      const token = await getStoredToken();
      setUserToken(token);

      // Load user data
      const userData = await getStoredUserData();
      setUserData(userData);

      // Set email to user's email
      setEmail(userData?.email);
    };
    loadUserToken();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Payment Options</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Card Field (Method 1) */}
      {paymentMethod === 'card' && (
        <View style={styles.cardContainer}>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.cardField}
            style={styles.cardFieldContainer}
            onCardChange={(cardDetails) => {
              setCardDetails(cardDetails);
            }}
          />
          
          <TouchableOpacity
            style={[styles.payButton, (!cardDetails?.complete || loading) && styles.disabledButton]}
            onPress={handleCardPayment}
            disabled={!cardDetails?.complete || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payButtonText}>Pay ${(amount / 100).toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedMethod: {
    backgroundColor: '#FECD15',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardFieldContainer: {
    height: 50,
    marginBottom: 20,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    color: '#424770',
    placeholderColor: '#AAB7C4',
  },
  paymentSheetContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  initButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  payButton: {
    backgroundColor: '#FECD15',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  applePayButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  googlePayButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
});

export default PaymentScreen;