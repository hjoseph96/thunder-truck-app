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

// GraphQL mutation for simulating courier movement (development/testing)
const SIMULATE_COURIER_MOVEMENT_MUTATION = `
  mutation SimulateCourierMovement($input: SimulateCourierMovementInput!) {
    simulateCourierMovement(input: $input) {
      clientMutationId
      message
      success
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

/**
 * Simulate courier movement from one point to another (development/testing)
 * This triggers the backend to simulate courier movement and send location updates via WebSocket
 * @param {Object} fromPoint - Starting point {latitude, longitude}
 * @param {Object} toPoint - Destination point {latitude, longitude}
 * @returns {Promise<Object>} Mutation result
 */
export const simulateCourierMovement = async (fromPoint, toPoint) => {
  try {
    console.log(
      `🚗 Simulating courier movement from [${fromPoint.latitude}, ${fromPoint.longitude}] to [${toPoint.latitude}, ${toPoint.longitude}]`,
    );

    const result = await executeGraphQL(SIMULATE_COURIER_MOVEMENT_MUTATION, {
      input: {
        fromPoint: {
          latitude: parseFloat(fromPoint.latitude),
          longitude: parseFloat(fromPoint.longitude),
        },
        toPoint: {
          latitude: parseFloat(toPoint.latitude),
          longitude: parseFloat(toPoint.longitude),
        },
      },
    });

    if (result.simulateCourierMovement.success) {
      console.log('✅ Courier movement simulation started successfully');
      console.log(`   Message: ${result.simulateCourierMovement.message}`);
      return {
        success: true,
        message: result.simulateCourierMovement.message,
        clientMutationId: result.simulateCourierMovement.clientMutationId,
      };
    } else {
      console.error('❌ Failed to start courier movement simulation');
      return {
        success: false,
        message: result.simulateCourierMovement.message,
      };
    }
  } catch (error) {
    console.error('❌ Error simulating courier movement:', error);
    return {
      success: false,
      message: error.message || 'Failed to simulate courier movement',
      error,
    };
  }
};
