import graphqlClient from './graphql-client';

const SET_CUSTOMER_DETAILS = `
  mutation SetCustomerDetails($input: SetCustomerDetailsInput!) {
    setCustomerDetails(input: $input) {
      success
      message
      errors
    }
  }
`;

/**
 * Set customer details (firstName, lastName, email)
 * @param {Object} customerData - Customer details object
 * @param {string} customerData.firstName - Customer's first name
 * @param {string} customerData.lastName - Customer's last name
 * @param {string} customerData.email - Customer's email address
 * @returns {Promise<Object>} The result of the mutation
 */
export const setCustomerDetails = async (customerData) => {
  try {
    const response = await graphqlClient.post('', {
      query: SET_CUSTOMER_DETAILS,
      variables: {
        input: {
          customerDetails: {
            userId: customerData.userId,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
          }
        }
      }
    });

    const result = response.data.data.setCustomerDetails;
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.join(', '));
    }

    return result;
  } catch (error) {
    console.error('Error setting customer details:', error);
    throw error;
  }
};
