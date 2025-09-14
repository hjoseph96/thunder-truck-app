# Payment Method Management System

## Overview
The payment method management system allows users to store, manage, and use payment methods through Stripe integration using their `stripe_customer_id`.

## Components

### 1. PaymentMethodManager
A comprehensive modal component for managing payment methods.

**Features:**
- Add new payment methods using Stripe Payment Sheet
- View all saved payment methods
- Set default payment method
- Remove payment methods
- Display card information (brand, last 4 digits, expiry)

**Usage:**
```jsx
<PaymentMethodManager
  visible={showPaymentManager}
  onClose={() => setShowPaymentManager(false)}
  onPaymentMethodAdded={() => console.log('Payment method added')}
/>
```

### 2. PaymentMethodSection
Updated checkout section that integrates with PaymentMethodManager.

**Features:**
- Displays current default payment method
- Shows "Add Payment Method" when none exist
- Opens PaymentMethodManager on tap

### 3. User Service Functions
Extended user service with payment method operations.

**Functions:**
- `addPaymentMethod(paymentMethodId)` - Add a new payment method
- `setDefaultPaymentMethod(paymentMethodId)` - Set default payment method
- `removePaymentMethod(paymentMethodId)` - Remove a payment method

### 4. Stripe Service
Service for direct Stripe API operations.

**Functions:**
- `createSetupIntent(customerId)` - Create setup intent for adding payment methods
- `createEphemeralKey(customerId)` - Create ephemeral key for secure operations
- `attachPaymentMethod(paymentMethodId, customerId)` - Attach payment method to customer
- `detachPaymentMethod(paymentMethodId)` - Detach payment method from customer
- `updateDefaultPaymentMethod(customerId, paymentMethodId)` - Update customer's default payment method
- `getCustomerPaymentMethods(customerId)` - Get all customer payment methods

## GraphQL Mutations

### Add Payment Method
```graphql
mutation addPaymentMethod($input: AddPaymentMethodInput!) {
  addPaymentMethod(input: $input) {
    paymentMethod {
      id
      userPaymentDisplay {
        brand
        lastFour
        expMonth
        expYear
      }
    }
    errors
  }
}
```

### Set Default Payment Method
```graphql
mutation setDefaultPaymentMethod($input: SetDefaultPaymentMethodInput!) {
  setDefaultPaymentMethod(input: $input) {
    success
    errors
  }
}
```

### Remove Payment Method
```graphql
mutation removePaymentMethod($input: RemovePaymentMethodInput!) {
  removePaymentMethod(input: $input) {
    success
    errors
  }
}
```

## User Data Structure

### Updated FETCH_USER Query
```graphql
query fetchUser {
  fetchUser {
    id
    email
    firstName
    lastName
    phoneNumber
    stripeCustomerId  # New field for Stripe integration
    defaultUserPaymentMethod {
      id
      userPaymentDisplay {
        brand
        lastFour
        expMonth
        expYear
      }
    }
    userPaymentMethods {
      id
      userPaymentDisplay {
        brand
        lastFour
        expMonth
        expYear
      }
    }
  }
}
```

## Integration Flow

### Adding Payment Methods
1. User taps "Add Payment Method" in PaymentMethodSection
2. PaymentMethodManager opens
3. User taps "Add Payment Method" button
4. Stripe Payment Sheet initializes with user's stripeCustomerId
5. User enters payment method details
6. Stripe returns payment method ID
7. Payment method is saved to backend via GraphQL mutation
8. UI updates with new payment method

### Managing Payment Methods
1. User can set any payment method as default
2. User can remove payment methods (with confirmation)
3. All changes are reflected immediately in the UI
4. Changes are persisted to the backend

## Security Considerations

- Uses Stripe's secure payment sheet for card entry
- Payment methods are stored securely in Stripe
- Only payment method IDs and display information are stored in the app
- All sensitive operations use ephemeral keys
- Customer ID is used for all Stripe operations

## Error Handling

- Comprehensive error handling for all operations
- User-friendly error messages
- Graceful fallbacks for network issues
- Validation for required fields

## Styling

- Consistent with app design system
- Uses Cairo font family
- Yellow accent color (#FECD15)
- Card-based layout with shadows
- Responsive design for different screen sizes

## Dependencies

- `@stripe/stripe-react-native` - Stripe React Native SDK
- GraphQL client for backend communication
- React Navigation for modal presentation

## Usage Example

```jsx
import PaymentMethodManager from './components/PaymentMethodManager';
import { addPaymentMethod } from './lib/user-service';

// In your component
const [showPaymentManager, setShowPaymentManager] = useState(false);

// Add payment method
const handleAddPayment = async (paymentMethodId) => {
  try {
    const result = await addPaymentMethod(paymentMethodId);
    console.log('Payment method added:', result);
  } catch (error) {
    console.error('Error adding payment method:', error);
  }
};
```
