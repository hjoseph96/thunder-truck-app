import { executeGraphQL } from './graphql-client';

const FETCH_USER = `
    query fetchUser {
      fetchUser {
        id
        email
        firstName
        lastName
        phoneNumber
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
