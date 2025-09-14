import { executeGraphQL } from './graphql-client';

const FETCH_USER = `
    query fetchUser {
      fetchUser {
        id
        email
        firstName
        lastName
        phoneNumber
        stripeCustomerId
        userAddresses {
          id
          label
          streetLineOne
          streetLineTwo
          city
          state
          zipCode
          isDefault
        }
        defaultUserPaymentMethod {
          id
          userPaymentDisplay {
            brand
            lastFour
            expMonth
            expYear
          }
        }
        userPaymentMethods {
          id
          userPaymentDisplay {
            brand
            lastFour
            expMonth
            expYear
          }
        }
      }
    }
`;

const ADD_USER_ADDRESS = `
  mutation adddUserAddress($input: AddUserAddressInput!) {
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
`;

const ADD_PAYMENT_METHOD = `
  mutation addPaymentMethod($input: AddPaymentMethodInput!) {
    addPaymentMethod(input: $input) {
      paymentMethod {
        id
        userPaymentDisplay {
          brand
          lastFour
          expMonth
          expYear
        }
      }
      errors
    }
  }
`;

const SET_DEFAULT_PAYMENT_METHOD = `
  mutation setDefaultPaymentMethod($input: SetDefaultPaymentMethodInput!) {
    setDefaultPaymentMethod(input: $input) {
      success
      errors
    }
  }
`;

const REMOVE_PAYMENT_METHOD = `
  mutation removePaymentMethod($input: RemovePaymentMethodInput!) {
    removePaymentMethod(input: $input) {
      success
      errors
    }
  }
`;

/**
 * Fetch user data including addresses and payment methods
 * @returns {Promise<Object>} User data with addresses and payment methods
 */
export const fetchUser = async () => {
  try {
    console.log('Fetching user data...');
    
    const result = await executeGraphQL(FETCH_USER);
    console.log('User GraphQL Result:', result);
    
    const userData = result.fetchUser;
    console.log('User Data:', userData);
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Get user data with caching
 * @returns {Promise<Object>} Cached or fresh user data
 */
export const getUserWithCache = async () => {
  try {
    return await fetchUser();
  } catch (error) {
    console.error('Error getting user with cache:', error);
    throw error;
  }
};

/**
 * Add a new user address
 * @param {Object} addressData - Address data object
 * @returns {Promise<Object>} The created address data
 */
export const addUserAddress = async (addressData) => {
  try {
    console.log('Adding user address:', addressData);
    
    const result = await executeGraphQL(ADD_USER_ADDRESS, {
      input: {
        userAddress: addressData
      }
    });
    
    console.log('Add address GraphQL Result:', result);
    
    const addressResult = result.addUserAddress;
    console.log('Address Result:', addressResult);
    
    return addressResult.address;
  } catch (error) {
    console.error('Error adding user address:', error);
    throw error;
  }
};

/**
 * Add a new payment method using Stripe payment method ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} The created payment method data
 */
export const addPaymentMethod = async (paymentMethodId) => {
  try {
    console.log('Adding payment method:', paymentMethodId);
    
    const result = await executeGraphQL(ADD_PAYMENT_METHOD, {
      input: {
        paymentMethodId
      }
    });
    
    console.log('Add payment method GraphQL Result:', result);
    
    const paymentMethodResult = result.addPaymentMethod;
    
    if (paymentMethodResult.errors && paymentMethodResult.errors.length > 0) {
      throw new Error(paymentMethodResult.errors.join(', '));
    }
    
    return paymentMethodResult.paymentMethod;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

/**
 * Set a payment method as default
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<boolean>} Success status
 */
export const setDefaultPaymentMethod = async (paymentMethodId) => {
  try {
    console.log('Setting default payment method:', paymentMethodId);
    
    const result = await executeGraphQL(SET_DEFAULT_PAYMENT_METHOD, {
      input: {
        paymentMethodId
      }
    });
    
    console.log('Set default payment method GraphQL Result:', result);
    
    const setDefaultResult = result.setDefaultPaymentMethod;
    
    if (setDefaultResult.errors && setDefaultResult.errors.length > 0) {
      throw new Error(setDefaultResult.errors.join(', '));
    }
    
    return setDefaultResult.success;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw error;
  }
};

/**
 * Remove a payment method
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<boolean>} Success status
 */
export const removePaymentMethod = async (paymentMethodId) => {
  try {
    console.log('Removing payment method:', paymentMethodId);
    
    const result = await executeGraphQL(REMOVE_PAYMENT_METHOD, {
      input: {
        paymentMethodId
      }
    });
    
    console.log('Remove payment method GraphQL Result:', result);
    
    const removeResult = result.removePaymentMethod;
    
    if (removeResult.errors && removeResult.errors.length > 0) {
      throw new Error(removeResult.errors.join(', '));
    }
    
    return removeResult.success;
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};
