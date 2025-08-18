import { executeGraphQL, setAuthToken, clearAuthToken } from './graphql-client';

// GraphQL mutations
const REQUEST_OTP_MUTATION = `
  mutation RequestOtp($phoneNumber: String!) {
    requestOtp(input: { phoneNumber: $phoneNumber }) {
      success
      message
      errors
    }
  }
`;

const VERIFY_OTP_MUTATION = `
  mutation VerifyOtp($phoneNumber: String!, $otpCode: String!) {
    verifyOtp(input: { phoneNumber: $phoneNumber, otpCode: $otpCode }) {
      user {
        id
        phoneNumber
        email
        firstName
        lastName
        fullName
        phoneVerified
      }
      token
      success
      message
      errors
    }
  }
`;

const SIGN_IN_MUTATION = `
  mutation SignIn($phoneNumber: String!) {
    signIn(input: { phoneNumber: $phoneNumber }) {
      user {
        id
        phoneNumber
        email
        firstName
        lastName
        fullName
        phoneVerified
      }
      token
      errors
    }
  }
`;

const SIGN_OUT_MUTATION = `
  mutation SignOut {
    signOut {
      success
      message
    }
  }
`;

// API service functions
export const authService = {
  /**
   * Sign in with phone number only
   * @param {string} phoneNumber - Phone number in international format (e.g., "+1234567890")
   * @returns {Promise<Object>} - Response with user data and JWT token
   */
  async signIn(phoneNumber) {
    try {
      // Ensure phone number is in international format
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const result = await executeGraphQL(SIGN_IN_MUTATION, {
        phoneNumber: formattedPhoneNumber,
      });
      
      const response = result.signIn;
      
      // Check for errors
      if (response.errors && response.errors.length > 0) {
        return {
          success: false,
          message: response.errors[0],
          user: null,
          token: null,
        };
      }
      
      // If successful, store the JWT token
      if (response.token) {
        setAuthToken(response.token);
        return {
          success: true,
          message: 'Signed in successfully',
          user: response.user,
          token: response.token,
        };
      }
      
      return {
        success: false,
        message: 'Sign in failed',
        user: null,
        token: null,
      };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  /**
   * Request OTP code to be sent to the provided phone number
   * @param {string} phoneNumber - Phone number in international format (e.g., "+1234567890")
   * @returns {Promise<Object>} - Response with success status and message
   */
  async requestOtp(phoneNumber) {
    try {
      // Ensure phone number is in international format
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const result = await executeGraphQL(REQUEST_OTP_MUTATION, {
        phoneNumber: formattedPhoneNumber,
      });
      
      return result.requestOtp;
    } catch (error) {
      console.error('Error requesting OTP:', error);
      throw error;
    }
  },

  /**
   * Verify OTP code and authenticate user
   * @param {string} phoneNumber - Phone number in international format
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<Object>} - Response with user data and JWT token
   */
  async verifyOtp(phoneNumber, otpCode) {
    try {
      // Ensure phone number is in international format
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const result = await executeGraphQL(VERIFY_OTP_MUTATION, {
        phoneNumber: formattedPhoneNumber,
        otpCode: otpCode,
      });
      
      const response = result.verifyOtp;
      
      // If successful, store the JWT token
      if (response.success && response.token) {
        setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  },

  /**
   * Sign out user and revoke JWT token
   * @returns {Promise<Object>} - Response with success status and message
   */
  async signOut() {
    try {
      const result = await executeGraphQL(SIGN_OUT_MUTATION);
      
      // Clear the stored token regardless of response
      clearAuthToken();
      
      return result.signOut;
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear token even if API call fails
      clearAuthToken();
      throw error;
    }
  },

  /**
   * Check if user is currently authenticated
   * @returns {boolean} - True if user has valid token
   */
  isAuthenticated() {
    return !!getAuthToken();
  },

  /**
   * Get current user's authentication token
   * @returns {string|null} - JWT token or null if not authenticated
   */
  getCurrentToken() {
    return getAuthToken();
  },
};

export default authService;
