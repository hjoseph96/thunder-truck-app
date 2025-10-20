import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../../config/stripe-config';

const StripeProviderWrapper = ({ children }) => {
  return (
    <StripeProvider
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
      urlScheme={STRIPE_CONFIG.urlScheme}
    >
      {children}
    </StripeProvider>
  );
};

export default StripeProviderWrapper;
