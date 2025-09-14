import { executeGraphQL } from './graphql-client';

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
  const result = await executeGraphQL(SET_CUSTOMER_DETAILS, {
    input: {
      customerDetails: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email
      }
    }
  });

  const customerResult = result.setCustomerDetails;
  
  if (customerResult.errors && customerResult.errors.length > 0) {
    throw new Error(customerResult.errors.join(', '));
  }

  return customerResult;
};
