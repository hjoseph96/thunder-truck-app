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
