# Add Address Form Component

## Overview
The `AddAddressForm` component allows users to add new delivery addresses during the checkout process. It includes a map header and a comprehensive address form with validation.

## Features

### Map Integration
- Displays a map in the header for location context
- Uses the existing `Map` component

### Address Form Fields
- **Building Type**: Dropdown with options (apartment, house, office, hotel, other)
- **Display Name**: Optional label for the address
- **Street Address**: Required primary address line
- **Address Line 2**: Optional secondary address line (apartment, suite, etc.)
- **City**: Required city field
- **State**: Required dropdown with all US states
- **ZIP Code**: Required with 10-character limit
- **Country**: Fixed to USA with flag display
- **Default Address**: Checkbox to set as default
- **Delivery Instructions**: Optional textarea with 300-character limit

### Validation
- Required field validation
- Real-time error clearing when user starts typing
- Character count for delivery instructions
- Form submission validation

### Navigation
- Back button to return to checkout
- Automatic navigation to checkout after successful address creation
- Data refresh when returning to checkout form

## API Integration

### Mutation
Uses the `addUserAddress` mutation with the following structure:
```graphql
mutation addUserAddress($input: AddUserAddressInput!) {
  addUserAddress(input: $input) {
    address {
      id
      streetLineOne
      streetLineTwo
      city
      state
      country
      zipCode
      isDefault
      deliveryInstructions
      label
      latlong
      buildingType
    }
  }
}
```

### Input Format
```javascript
{
  input: {
    userAddress: {
      buildingType: "apartment",
      city: "Queens",
      country: "USA",
      streetLineOne: "1210 Springfield Blvd",
      streetLineTwo: null,
      state: "NY",
      zipCode: "11413",
      label: "Home",
      deliveryInstructions: "Leave at the left door.",
      isDefault: true
    }
  }
}
```

## Usage
The component is navigated to from the CheckoutForm when the address selector button is tapped. It automatically refreshes the checkout data when returning.

## Styling
- Consistent with app design system
- Uses Cairo font family
- Yellow accent color (#FECD15)
- Dark green header (#132a13)
- Responsive layout with proper spacing
- Error states with red borders and text
