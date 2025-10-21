import { useElements, useStripe as useStripeWeb } from '@stripe/react-stripe-js';
import { useState, useCallback } from 'react';

/**
 * useStripe hook for web platform
 * Provides payment sheet and payment method management functionality
 * using Stripe.js and Elements
 */
export const useStripe = () => {
  const stripe = useStripeWeb();
  const elements = useElements();
  const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);

  const initPaymentSheet = useCallback(
    async (params) => {
      try {
        if (!stripe || !elements) {
          return { error: { message: 'Stripe or Elements not initialized' } };
        }

        // On web, we store params for later use in presentPaymentSheet
        // This simulates the native payment sheet initialization
        setPaymentSheetInitialized(true);

        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    [stripe, elements]
  );

  const presentPaymentSheet = useCallback(async () => {
    try {
      if (!paymentSheetInitialized) {
        return {
          paymentOption: null,
          error: { message: 'Payment sheet not initialized' },
        };
      }

      // On web, payment sheet presentation is handled differently
      // The actual payment collection happens through CardElement form submission
      // This is a placeholder that returns success for setup intents
      return {
        paymentOption: null,
        error: null,
      };
    } catch (error) {
      return { paymentOption: null, error };
    }
  }, [paymentSheetInitialized]);

  const confirmPayment = useCallback(
    async (clientSecret, params) => {
      try {
        if (!stripe || !elements) {
          throw new Error('Stripe or Elements not initialized');
        }

        const cardElement = elements.getElement('card');

        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Confirm payment with card element
        const { paymentIntent, error } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {},
            },
          }
        );

        if (error) {
          return { paymentIntent: null, error };
        }

        return {
          paymentIntent: {
            ...paymentIntent,
            id: paymentIntent.id,
            status: paymentIntent.status,
          },
          error: null,
        };
      } catch (error) {
        return { paymentIntent: null, error };
      }
    },
    [stripe, elements]
  );

  const confirmGooglePayPayment = useCallback(async (clientSecret, params) => {
    // Google Pay is not available on web through this method
    // Users should use standard card payment instead
    return {
      error: {
        message: 'Google Pay is only available on Android. Please use card payment.',
      },
    };
  }, []);

  return {
    initPaymentSheet,
    presentPaymentSheet,
    confirmPayment,
    confirmGooglePayPayment,
    loading: false,
  };
};

/**
 * useConfirmPayment hook for web platform
 * Provides simplified payment confirmation
 */
export const useConfirmPayment = () => {
  const stripe = useStripeWeb();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const confirmPayment = useCallback(
    async (clientSecret, params) => {
      try {
        setLoading(true);

        if (!stripe) {
          throw new Error('Stripe not initialized');
        }

        // Use saved payment method if provided
        if (params?.paymentMethodData?.paymentMethodId) {
          const { paymentIntent, error } = await stripe.confirmCardPayment(
            clientSecret,
            {
              payment_method: params.paymentMethodData.paymentMethodId,
            }
          );

          setLoading(false);

          if (error) {
            return { paymentIntent: null, error };
          }

          return {
            paymentIntent: {
              ...paymentIntent,
              id: paymentIntent.id,
              status: paymentIntent.status,
            },
            error: null,
          };
        }

        // For new payment methods, we need the card element
        if (!elements) {
          throw new Error('Elements not initialized');
        }

        const cardElement = elements.getElement('card');

        if (!cardElement) {
          throw new Error('Card element not found. Please add a payment method first.');
        }

        // Create new payment method from card element
        const { paymentIntent, error } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {},
            },
          }
        );

        setLoading(false);

        if (error) {
          return { paymentIntent: null, error };
        }

        return {
          paymentIntent: {
            ...paymentIntent,
            id: paymentIntent.id,
            status: paymentIntent.status,
          },
          error: null,
        };
      } catch (error) {
        setLoading(false);
        return { paymentIntent: null, error };
      }
    },
    [stripe, elements]
  );

  return {
    confirmPayment,
    loading,
  };
};

/**
 * usePlatformPay hook for web platform
 * Returns null since platform payments (Apple Pay, Google Pay) are not available on web
 */
export const usePlatformPay = () => {
  return {
    isPlatformPaySupported: false,
    confirmPlatformPayPayment: async () => ({
      error: {
        message: 'Platform payments are only available on mobile apps',
      },
    }),
  };
};
