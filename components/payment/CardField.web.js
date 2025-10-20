import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

/**
 * CardField component for web platform
 * Wraps Stripe CardElement to provide a consistent API with the native version
 */
export const CardField = ({
  postalCodeEnabled = true,
  onCardChange = () => {},
  style = {},
  placeholder = 'Card number',
  ...props
}) => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424242',
        '::placeholder': {
          color: '#9CA3AF',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9CCC65',
      },
    },
    hidePostalCode: !postalCodeEnabled,
  };

  return (
    <CardElement
      options={cardElementOptions}
      onChange={onCardChange}
      {...props}
    />
  );
};
