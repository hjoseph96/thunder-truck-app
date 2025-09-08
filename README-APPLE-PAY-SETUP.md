# Apple Pay Setup for ThunderTruck

## Configuration Completed

✅ **App Configuration (app.json)**
- Added Apple Pay merchant ID: `merchant.com.thundertruck.app`
- Added iOS entitlements for in-app payments

✅ **Stripe Configuration (config/stripe-config.js)**
- Updated with Apple Pay merchant ID
- Added applePayMerchantId configuration

✅ **PaymentScreen Component**
- Added Apple Pay support detection using `usePlatformPay` hook
- Updated Apple Pay implementation to use `confirmPlatformPayPayment`
- Apple Pay button only shows on iOS when supported
- Added proper error handling and user feedback

## Required Setup Steps

### 1. Apple Pay Certificate
You need to add your Apple Pay merchant certificate:

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **Apple Pay Payment Processing Certificate**
4. Download the `.cer` file
5. Place it at: `config/apple_pay.cer`

### 2. Stripe Dashboard Configuration
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings > Payment methods**
3. Enable **Apple Pay**
4. Add your Apple Pay merchant ID: `merchant.com.thundertruck.app`
5. Upload your Apple Pay certificate

### 3. Testing
- Test on a physical iOS device (Apple Pay doesn't work in simulator)
- Ensure the device has Apple Pay set up with valid payment methods
- Test the payment flow end-to-end

## Features Implemented

- **Platform Detection**: Apple Pay button only shows on iOS
- **Support Detection**: Button only shows when Apple Pay is supported on the device
- **Proper Integration**: Uses latest Stripe React Native hooks
- **Error Handling**: Comprehensive error handling and user feedback
- **Merchant Configuration**: Properly configured with merchant ID

## Code Changes Made

1. **app.json**: Added iOS entitlements for Apple Pay
2. **stripe-config.js**: Added Apple Pay merchant ID configuration
3. **PaymentScreen.jsx**: 
   - Added `usePlatformPay` hook import
   - Updated Apple Pay implementation
   - Added support detection
   - Enhanced error handling
