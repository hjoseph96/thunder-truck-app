# Backend Integration for Stripe Payment Methods

## The Issue
The Stripe error `customerEphemeralKeySecret format does not match expected client secret formatting` occurs because:

1. **Ephemeral keys must be created on your backend** using your Stripe secret key
2. **Setup intents must be created on your backend** using your Stripe secret key
3. **Client-side code cannot directly create these** using the publishable key

## Required Backend Endpoints

### 1. Create Ephemeral Key Endpoint

**Endpoint:** `POST /api/stripe/create-ephemeral-key`

**Request:**
```json
{
  "customerId": "cus_1234567890"
}
```

**Backend Implementation (Node.js/Express example):**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/stripe/create-ephemeral-key', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2020-08-27' }
    );
    
    res.json({
      ephemeralKey: ephemeralKey.secret
    });
  } catch (error) {
    console.error('Error creating ephemeral key:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Create Setup Intent Endpoint

**Endpoint:** `POST /api/stripe/create-setup-intent`

**Request:**
```json
{
  "customerId": "cus_1234567890"
}
```

**Backend Implementation:**
```javascript
app.post('/api/stripe/create-setup-intent', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card']
    });
    
    res.json({
      clientSecret: setupIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Updated Client Implementation

### PaymentMethodManager with Backend Integration

```javascript
const handleAddPaymentMethod = async () => {
  if (!userData?.stripeCustomerId) {
    Alert.alert('Error', 'No Stripe customer ID found');
    return;
  }

  try {
    setLoading(true);

    // 1. Get ephemeral key from your backend
    const ephemeralKeyResponse = await fetch('/api/stripe/create-ephemeral-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`, // Your app's auth token
      },
      body: JSON.stringify({
        customerId: userData.stripeCustomerId,
      }),
    });

    if (!ephemeralKeyResponse.ok) {
      throw new Error('Failed to create ephemeral key');
    }

    const { ephemeralKey } = await ephemeralKeyResponse.json();

    // 2. Get setup intent from your backend
    const setupIntentResponse = await fetch('/api/stripe/create-setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`, // Your app's auth token
      },
      body: JSON.stringify({
        customerId: userData.stripeCustomerId,
      }),
    });

    if (!setupIntentResponse.ok) {
      throw new Error('Failed to create setup intent');
    }

    const { clientSecret } = await setupIntentResponse.json();

    // 3. Initialize payment sheet with proper values
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

    // 4. Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code !== 'Canceled') {
        console.error('Error presenting payment sheet:', presentError);
        Alert.alert('Error', 'Failed to add payment method');
      }
      return;
    }

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
    Alert.alert('Error', 'Failed to add payment method');
  } finally {
    setLoading(false);
  }
};
```

## Environment Variables

Make sure your backend has the Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
```

## Security Considerations

1. **Never expose your Stripe secret key** in client-side code
2. **Always validate customer IDs** on your backend
3. **Use proper authentication** for your API endpoints
4. **Implement rate limiting** on your Stripe endpoints
5. **Log all Stripe operations** for debugging and monitoring

## Alternative: Direct Payment Method Creation

If you prefer not to use the Payment Sheet, you can create payment methods directly:

```javascript
import { createPaymentMethod } from '@stripe/stripe-react-native';

const handleAddPaymentMethodDirect = async () => {
  try {
    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
      // Card details would be collected through your own UI
    });

    if (error) {
      throw error;
    }

    // Save payment method to your backend
    const response = await addPaymentMethod(paymentMethod.id);
    console.log('Payment method saved:', response);
  } catch (error) {
    console.error('Error creating payment method:', error);
  }
};
```

## Testing

1. Use Stripe test cards for testing
2. Test with different card types (Visa, Mastercard, Amex)
3. Test error scenarios (declined cards, network errors)
4. Test on both iOS and Android devices

## Next Steps

1. Implement the backend endpoints
2. Update the client code to use the backend endpoints
3. Test the complete flow
4. Deploy to production with live Stripe keys
