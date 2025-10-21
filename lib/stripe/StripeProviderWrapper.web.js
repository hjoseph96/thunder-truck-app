import React, { useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../../config/stripe-config';

const StripeProviderWrapper = ({ children }) => {
  const stripePromise = useMemo(() => {
    return loadStripe(STRIPE_CONFIG.publishableKey);
  }, []);

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProviderWrapper;
