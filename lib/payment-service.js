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
