import { executeGraphQL } from './graphql-client';

// GraphQL mutation for updating courier position
const UPDATE_COURIER_POSITION_MUTATION = `
  mutation updateCourierLocation($input: UpdateCourierPositionInput!) {
    updateCourierPosition(input: $input) {
      errors
      message
      success
      courierLatitude
      courierLongitude
    }
  }
`;

/**
 * Update courier position using GraphQL mutation
 * @param {number} latitude - Courier latitude
 * @param {number} longitude - Courier longitude
 * @returns {Promise<Object>} Mutation result
 */
export const updateCourierPosition = async (latitude, longitude) => {
  try {
    console.log(`📍 Updating courier position: ${latitude}, ${longitude}`);

    const result = await executeGraphQL(UPDATE_COURIER_POSITION_MUTATION, {
      input: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    if (result.updateCourierPosition.success) {
      console.log('✅ Courier position updated successfully');
      return {
        success: true,
        latitude: result.updateCourierPosition.courierLatitude,
        longitude: result.updateCourierPosition.courierLongitude,
        message: result.updateCourierPosition.message,
      };
    } else {
      console.error('❌ Failed to update courier position:', result.updateCourierPosition.errors);
      return {
        success: false,
        errors: result.updateCourierPosition.errors,
      };
    }
  } catch (error) {
    console.error('❌ Error updating courier position:', error);
    throw error;
  }
};
