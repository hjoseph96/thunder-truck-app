import { executeGraphQL } from './graphql-client';

const SET_CUSTOMER_DETAILS = `
  mutation SetCustomerDetails($input: SetCustomerDetailsInput!) {
    setCustomerDetails(input: $input) {
      success
      user {
        id
        firstName
        lastName
        email
        phoneNumber
        spokenLanguages {
          id
          isoCode
          name
        }
      }
      errors
    }
  }
`;

/**
 * Set customer details (firstName, lastName, email, phoneNumber, spokenLanguages)
 * @param {Object} customerData - Customer details object
 * @param {string} customerData.firstName - Customer's first name
 * @param {string} customerData.lastName - Customer's last name
 * @param {string} customerData.email - Customer's email address
 * @param {string} customerData.phoneNumber - Customer's phone number
 * @param {Array<string>} customerData.spokenLanguages - Array of spoken language IDs
 * @returns {Promise<Object>} The result of the mutation
 */
export const setCustomerDetails = async (customerData) => {
  const result = await executeGraphQL(SET_CUSTOMER_DETAILS, {
    input: {
      customerDetails: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phoneNumber: customerData.phoneNumber,
        spokenLanguages: customerData.spokenLanguages || []
      }
    }
  });

  const customerResult = result.setCustomerDetails;
  
  if (customerResult.errors && customerResult.errors.length > 0) {
    throw new Error(customerResult.errors.join(', '));
  }

  return customerResult;
};
