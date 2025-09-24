import { executeGraphQL } from './graphql-client';

const CREATE_PAYMENT_INTENT = `
  mutation createPaymentIntent($input: CreatePaymentIntentInput!) {
    createPaymentIntent(input: $input) {
      payload {
        paymentIntentId
        clientSecret
        errors
      }
    }
  }
`;

const CREATE_EPHEMERAL_KEY = `
  mutation createEphemeralKey($input: CreateEphemeralKeyInput!) {
    createEphemeralKey(input: $input) {
      ephemeralKey
      errors
    }
  }
`;

const CREATE_SETUP_INTENT = `
  mutation createSetupIntent($input: CreateSetupIntentInput!) {
    createSetupIntent(input: $input) {
      clientSecret
      errors
    }
  }
`;

const MARK_DEFAULT_PAYMENT_METHOD = `
  mutation markDefaultPaymentMethod($input: MarkDefaultPaymentMethodInput!) {
    markDefaultPaymentMethod(input: $input) {
      success
      message
    }
  }
`;

const FETCH_PAYMENT_METHODS = `
  query fetchPaymentMethods {
    fetchPaymentMethods {
      id
      isDefault
      paymentType
      status
      stripePaymentMethodId
      userId
      userPaymentDisplay {
        brand
        lastFour
        expMonth
        expYear
        bankName
      }
    }
  }
`;

const FETCH_DELIVERY_METHODS = `
  query fetchDeliveryMethods {
    fetchDeliveryMethods {
      id
      name
      category
      deliveryMethod
      leaveAtLocation
      handItToMe
    }
  }
`;

const SYNC_PAYMENT_METHODS = `
  mutation syncUserPaymentMethods($input: SyncPaymentMethodsInput!) {
    syncPaymentMethods(input: $input) {
      errors
      message
      success
    }
  }
`;

const CREATE_ORDERS = `
  mutation createOrders($input: CreateOrdersInput!) {
    createOrders(input: $input) {
      payload {
        orders {
          id
          userId
          promotionId
          deliveryFeeCents
          foodTruck {
            name
          }
          orderAddresses { 
            latlong 
          }
          orderItems { 
            totalPriceCents 
          }
          orderPayments { 
            amountChargedCents 
          }
          promotionId
          subtotalCents
          tipCents
        }
        errors
        message
        success
      }
    }
  }
`;

/**
 * Create a payment intent for processing payments
 * @param {number} amount - Amount in cents (e.g., 2000 for $20.00)
 * @returns {Promise<Object>} Payment intent data with clientSecret
 */
export const createPaymentIntent = async (amount) => {
  try {
    console.log('Creating payment intent for amount:', amount);
    
    const result = await executeGraphQL(CREATE_PAYMENT_INTENT, {
      input: {
        amount
      }
    });

    console.log('GraphQL Result:', result);
    
    const paymentResult = result.createPaymentIntent;
    console.log('Payment Result:', paymentResult);
    
    if (paymentResult.errors && paymentResult.errors.length > 0) {
      throw new Error(paymentResult.errors.join(', '));
    }

    // Check if payload exists and has the required fields
    if (!paymentResult.payload) {
      throw new Error('No payload received from payment intent creation');
    }

    if (!paymentResult.payload.clientSecret) {
      throw new Error('Client secret is missing from payment intent response');
    }

    console.log('Payment Intent Payload:', paymentResult.payload);
    return paymentResult.payload;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Create an ephemeral key for Stripe customer operations
 * @returns {Promise<string>} Ephemeral key secret
 */
export const createEphemeralKey = async () => {
  try {
    console.log('Creating ephemeral key...');
    
    const result = await executeGraphQL(CREATE_EPHEMERAL_KEY, {
      input: {}
    });

    console.log('Ephemeral Key GraphQL Result:', result);
    
    const ephemeralKeyResult = result.createEphemeralKey;
    console.log('Ephemeral Key Result:', ephemeralKeyResult);
    
    if (ephemeralKeyResult.errors && ephemeralKeyResult.errors.length > 0) {
      throw new Error(ephemeralKeyResult.errors.join(', '));
    }

    if (!ephemeralKeyResult.ephemeralKey) {
      throw new Error('Ephemeral key is missing from response');
    }

    console.log('Ephemeral Key:', ephemeralKeyResult.ephemeralKey);
    return ephemeralKeyResult.ephemeralKey;
  } catch (error) {
    console.error('Error creating ephemeral key:', error);
    throw error;
  }
};

/**
 * Create a setup intent for adding payment methods
 * @returns {Promise<string>} Setup intent client secret
 */
export const createSetupIntent = async () => {
  try {
    console.log('Creating setup intent...');
    
    const result = await executeGraphQL(CREATE_SETUP_INTENT, {
      input: {}
    });

    console.log('Setup Intent GraphQL Result:', result);
    
    const setupIntentResult = result.createSetupIntent;
    console.log('Setup Intent Result:', setupIntentResult);
    
    if (setupIntentResult.errors && setupIntentResult.errors.length > 0) {
      throw new Error(setupIntentResult.errors.join(', '));
    }

    if (!setupIntentResult.clientSecret) {
      throw new Error('Client secret is missing from setup intent response');
    }

    console.log('Setup Intent Client Secret:', setupIntentResult.clientSecret);
    return setupIntentResult.clientSecret;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
};

/**
 * Mark a payment method as default
 * @param {string} userPaymentMethodId - The ID of the payment method to mark as default
 * @returns {Promise<Object>} Success status and message
 */
export const markDefaultPaymentMethod = async (userPaymentMethodId) => {
  try {
    console.log('Marking payment method as default:', userPaymentMethodId);
    
    const result = await executeGraphQL(MARK_DEFAULT_PAYMENT_METHOD, {
      input: {
        userPaymentMethodId: userPaymentMethodId
      }
    });

    console.log('Mark Default Payment Method GraphQL Result:', result);
    
    const markDefaultResult = result.markDefaultPaymentMethod;
    console.log('Mark Default Payment Method Result:', markDefaultResult);
    
    if (!markDefaultResult.success) {
      throw new Error(markDefaultResult.message || 'Failed to mark payment method as default');
    }

    console.log('Successfully marked payment method as default:', markDefaultResult.message);
    return markDefaultResult;
  } catch (error) {
    console.error('Error marking payment method as default:', error);
    throw error;
  }
};

/**
 * Fetch user's payment methods
 * @returns {Promise<Array>} Array of payment methods with display information
 */
export const fetchPaymentMethods = async () => {
  try {
    console.log('Fetching payment methods...');
    
    const result = await executeGraphQL(FETCH_PAYMENT_METHODS);

    console.log('Fetch Payment Methods GraphQL Result:', result);
    
    const paymentMethods = result.fetchPaymentMethods || [];

    console.log('Payment Methods:', paymentMethods);
    
    // // Sort payment methods so default appears first
    // const sortedPaymentMethods = paymentMethods.sort((a, b) => {
    //   if (a.isDefault && !b.isDefault) return -1;
    //   if (!a.isDefault && b.isDefault) return 1;
    //   return 0;
    // });

    // console.log('Sorted Payment Methods:', sortedPaymentMethods);
    return paymentMethods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Fetch available delivery methods
 * @returns {Promise<Array>} Array of delivery methods with category information
 */
export const fetchDeliveryMethods = async () => {
  try {
    console.log('Fetching delivery methods...');
    
    const result = await executeGraphQL(FETCH_DELIVERY_METHODS);

    console.log('Fetch Delivery Methods GraphQL Result:', result);
    
    const deliveryMethods = result.fetchDeliveryMethods || [];
    console.log('Delivery Methods:', deliveryMethods);
    
    return deliveryMethods;
  } catch (error) {
    console.error('Error fetching delivery methods:', error);
    throw error;
  }
};

/**
 * Sync user payment methods with Stripe
 * @returns {Promise<Object>} Sync result with success status and message
 */
export const syncPaymentMethods = async () => {
  try {
    console.log('Syncing payment methods...');
    
    const result = await executeGraphQL(SYNC_PAYMENT_METHODS, {
      input: {}
    });

    console.log('Sync Payment Methods GraphQL Result:', result);
    
    const syncResult = result.syncPaymentMethods;
    console.log('Sync Payment Methods Result:', syncResult);
    
    if (!syncResult.success) {
      throw new Error(syncResult.message || 'Failed to sync payment methods');
    }

    console.log('Payment methods synced successfully:', syncResult.message);
    return syncResult;
  } catch (error) {
    console.error('Error syncing payment methods:', error);
    throw error;
  }
};

/**
 * Create orders for the user
 * @param {Array} orderDetails - Array of order details for each food truck
 * @param {Array} cartIds - Array of cart item IDs to be cleared
 * @returns {Promise<Object>} Created orders data with success status
 */
export const createOrders = async (orderDetails, cartIds = []) => {
  try {
    console.log('Creating orders...', { orderDetails, cartIds });
    
    const input = {
      orderDetails,
      cartIds
    };

    const result = await executeGraphQL(CREATE_ORDERS, { input });

    console.log('Create Orders GraphQL Result: ', result);
    
    const payload = result.createOrders?.payload;
    
    if (!payload || !payload.success) {
      throw new Error(payload?.message || 'Failed to create orders');
    }

    console.log('Orders created successfully:', payload.orders);
    return payload;
  } catch (error) {
    console.error('Error creating orders:', error);
    throw error;
  }
};
