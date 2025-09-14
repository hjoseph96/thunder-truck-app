# User Address List Component

## Overview
The `UserAddressList` component displays a list of user addresses for selection during checkout. It provides an interface for users to choose from their saved addresses or add new ones.

## Features

### Address List Display
- **Map Marker Icons**: Fixed left positioning with yellow place icons
- **Address Details**: Shows label (if available), street address, and city/state
- **Right Caret**: Fixed right positioning indicating selectable items
- **Card Layout**: Clean card design with shadows and proper spacing

### Navigation Flow
- **From CheckoutForm**: Navigates here when user has existing addresses
- **Address Selection**: Returns selected address to CheckoutForm
- **Add New Address**: Button to navigate to AddAddressForm
- **Back Navigation**: Returns to CheckoutForm

### Empty State
- **No Addresses**: Shows helpful empty state with icon and messaging
- **Guidance**: Encourages users to add their first address

## UI Components

### Header
- Dark green background (#132a13)
- "Select Address" title
- Back button to return to checkout

### Address Items
- Map marker icon (fixed left)
- Address details section (flexible width)
- Right caret icon (fixed right)
- Touch feedback and selection handling

### Bottom Button
- "Add New Address" button with plus icon
- Yellow background (#FECD15)
- Fixed bottom positioning with border

## Props and Navigation

### Route Parameters
```javascript
{
  userAddresses: Array<Address> // Array of user addresses
}
```

### Address Object Structure
```javascript
{
  id: string,
  label?: string,
  streetLineOne: string,
  streetLineTwo?: string,
  city: string,
  state: string,
  country: string,
  zipCode: string,
  isDefault: boolean,
  deliveryInstructions?: string,
  buildingType: string
}
```

## Navigation Flow
1. **CheckoutForm** → **UserAddressList** (with userAddresses)
2. **UserAddressList** → **CheckoutForm** (with selectedAddress)
3. **UserAddressList** → **AddAddressForm** (to add new address)
4. **AddAddressForm** → **UserAddressList** (after adding address)

## Styling
- Consistent with app design system
- Uses Cairo font family
- Yellow accent color (#FECD15)
- Dark green header (#132a13)
- Card-based layout with shadows
- Responsive design with proper spacing
- Empty state with helpful messaging

## Integration
- Added to App.js routing as "UserAddressList"
- Receives userAddresses from CheckoutForm
- Passes selectedAddress back to CheckoutForm
- Handles navigation to AddAddressForm
