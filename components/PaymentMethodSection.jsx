import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import PaymentMethodManager from './PaymentMethodManager';
import CreditCardIcon from './CreditCardIcon';

const PaymentMethodSection = ({ userData }) => {
  const [showPaymentManager, setShowPaymentManager] = useState(false);
  const defaultPaymentMethod = userData?.defaultUserPaymentMethod;
  const hasPaymentMethods = userData?.userPaymentMethods?.length > 0;

  // Wallet SVG content from assets/images/wallet.svg (with inline colors)
  const walletSvg = `<svg width="800px" height="800px" viewBox="0 0 120 120" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
      <g>
        <rect fill="#10AF31" height="28.7" transform="matrix(0.674 -0.7387 0.7387 0.674 -14.5718 70.1)" width="50.6" x="46.8" y="37.2"/>
        <polygon fill="#000000" opacity="0.1" points="47.4,60.4 80.1,24.5 78.6,23.2 44.5,60.6 65.7,79.9 67.1,78.4   "/>
        <path fill="#98D049" d="M81.8,34.3L81.8,34.3c-1.6,1.8-4.4,1.9-6.1,0.3l-0.3-0.3l-20,22l0.3,0.3c1.8,1.6,1.9,4.4,0.3,6.1l0,0l6.7,6.1    h0c1.6-1.8,4.4-1.9,6.1-0.3l0.3,0.3l20-22l-0.3-0.3c-1.8-1.6-1.9-4.4-0.3-6.1v0L81.8,34.3z"/>
        <circle fill="#10AF31" cx="72.1" cy="51.6" r="6"/>
      </g>
      <g>
        <rect fill="#10AF31" height="28.7" transform="matrix(0.4374 -0.8993 0.8993 0.4374 -8.2074 78.0765)" width="50.6" x="33" y="31.3"/>
        <polygon fill="#000000" opacity="0.1" points="37,61.1 58.2,17.4 56.5,16.6 34.3,62.1 60.1,74.6 61,72.7   "/>
        <path fill="#98D049" d="M62.6,26.3L62.6,26.3c-1.1,2.2-3.7,3.1-5.8,2l-0.4-0.2l-13,26.8l0.4,0.2c2.2,1.1,3.1,3.7,2,5.8v0l8.1,3.9l0,0    c1.1-2.2,3.7-3.1,5.8-2l0.4,0.2l13-26.8l-0.4-0.2c-2.2-1.1-3.1-3.7-2-5.8v0L62.6,26.3z"/>
        <circle fill="#10AF31" cx="58.3" cy="45.6" r="6"/>
      </g>
      <g>
        <rect fill="#10AF31" height="28.7" transform="matrix(-4.559187e-07 -1 1 -4.559187e-07 -1.5403 90.5073)" width="50.6" x="19.2" y="31.7"/>
        <polygon fill="#000000" opacity="0.1" points="32.1,69.2 32.1,20.7 30.1,20.7 30.1,71.3 58.8,71.3 58.8,69.2   "/>
        <path fill="#98D049" d="M40,26.8L40,26.8c0,2.4-1.9,4.4-4.4,4.4h-0.4l0,29.7h0.4c2.4,0,4.4,1.9,4.4,4.4v0l9,0l0,0    c0-2.4,1.9-4.4,4.4-4.4h0.4l0-29.7h-0.4c-2.4,0-4.4-1.9-4.4-4.4v0L40,26.8z"/>
        <circle fill="#10AF31" cx="44.5" cy="46" r="6"/>
      </g>
      <circle fill="#F6B138" cx="40.3" cy="45.4" r="13.2"/>
      <circle fill="#985B0B" cx="40.3" cy="45.4" r="8.8"/>
      <circle fill="#DE9A2B" cx="40.3" cy="45.4" r="6.1"/>
      <path fill="#B17012" d="M85.1,103.4H26.9c-3.7,0-6.7-3-6.7-6.7V54.3c0-3.7,3-6.7,6.7-6.7h58.3c3.7,0,6.7,3,6.7,6.7v42.5   C91.8,100.5,88.8,103.4,85.1,103.4z"/>
      <path fill="#000000" opacity="0.1" d="M88.2,102.3H29.9c-3.7,0-6.7-3-6.7-6.7V53.1c0-2.2,1.1-4.2,2.8-5.4c-3.3,0.4-5.8,3.2-5.8,6.6v42.5   c0,3.7,3,6.7,6.7,6.7h58.3c1.4,0,2.8-0.5,3.9-1.2C88.7,102.2,88.5,102.3,88.2,102.3z"/>
      <path fill="#B17012" d="M94.7,85H73.9c-1.7,0-3.2-1.4-3.2-3.2V69.3c0-1.7,1.4-3.2,3.2-3.2h20.7c1.7,0,3.2,1.4,3.2,3.2v12.5   C97.8,83.5,96.4,85,94.7,85z"/>
      <circle fill="#985B0B" cx="80.4" cy="75.5" r="4.5"/>
      <path fill="#000000" opacity="0.1" d="M81.3,79.6c-2.5,0-4.5-2-4.5-4.5c0-1.6,0.9-3,2.2-3.8c-1.8,0.6-3,2.3-3,4.2c0,2.5,2,4.5,4.5,4.5   c0.8,0,1.6-0.2,2.3-0.7C82.3,79.5,81.8,79.6,81.3,79.6z"/>
      <path fill="#000000" opacity="0.1" d="M96.3,84.4H75.6c-1.7,0-3.2-1.4-3.2-3.2V68.8c0-1.1,0.6-2.1,1.4-2.6c-1.7,0.1-3,1.4-3,3.2v12.5   c0,1.7,1.4,3.2,3.2,3.2h20.7c0.7,0,1.3-0.2,1.8-0.5C96.4,84.4,96.3,84.4,96.3,84.4z"/>
      <g>
        <path fill="#000000" opacity="0.1" d="M30.1,37.1c2.2-2.7,5.6-4.5,9.3-4.8c-0.3,0-0.6,0-0.9,0c-3.2,0-6.1,1.1-8.4,3V37.1z"/>
      </g>
    </g>
  </svg>`;

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.paymentMethodButton}
          onPress={() => setShowPaymentManager(true)}
        >
          <View style={styles.paymentContent}>
            <SvgXml
              xml={walletSvg}
              width={40}
              height={40}
            />
            <View style={styles.paymentDetails}>
              {!hasPaymentMethods ? (
                <Text style={styles.addPaymentText}>Add a Payment Method</Text>
              ) : defaultPaymentMethod ? (
                <>
                  <Text style={styles.paymentMethodText}>
                    {defaultPaymentMethod.userPaymentDisplay?.brand?.toUpperCase()} •••• {defaultPaymentMethod.userPaymentDisplay?.lastFour}
                  </Text>
                  <Text style={styles.paymentMethodSubtext}>Default payment method</Text>
                </>
              ) : (
                <Text style={styles.addPaymentText}>Select Payment Method</Text>
              )}
            </View>
            <View style={styles.paymentRight}>
              {defaultPaymentMethod?.userPaymentDisplay?.brand && (
                <CreditCardIcon 
                  brand={defaultPaymentMethod.userPaymentDisplay.brand}
                  size={70}
                  style={styles.brandIcon}
                />
              )}
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <PaymentMethodManager
        visible={showPaymentManager}
        onClose={() => setShowPaymentManager(false)}
        onPaymentMethodAdded={() => {
          // Reload user data or trigger a refresh
          console.log('Payment method added');
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 16,
  },
  addPaymentText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#666',
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 8,
  },
});

export default PaymentMethodSection;
