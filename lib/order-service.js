import { executeGraphQL } from './graphql-client';

// Valid order statuses
const VALID_STATUSES = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];

/**
 * Validates order status parameter
 * @param {string|string[]} status - The order status to validate (can be string or array)
 * @throws {Error} If status is invalid
 */
const validateOrderStatus = (status) => {
  if (!status) {
    throw new Error('Order status is required');
  }

  // Ensure status is an array for uniform processing
  const statusesToCheck = Array.isArray(status) ? status : [status];

  // Validate each status in the array
  for (const s of statusesToCheck) {
    if (!VALID_STATUSES.includes(s)) {
      throw new Error(
        `Invalid order status: ${s}. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
};

/**
 * Fetches a single order by ID
 * @param {string} orderId - The ID of the order to fetch
 * @returns {Promise<Object>} Order data
 * @throws {Error} If orderId is invalid or API call fails
 */
export const fetchOrder = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const query = `
      query fetchOrder($orderId: ID!) {
        fetchOrder(orderId: $orderId) {
          id
          status
          deliveryFeeCents
          tipCents
          subtotalCents
          totalCents
          orderAddresses {
            streetLineOne
            streetLineTwo
            city
            state
            country
            zipCode
            destinationType
            deliveryInstructions
            latlong
          }
          orderItems {
            id
            menuItemName
            totalPriceCents
            vendorName
          }
          orderPayments {
            id
            amountChargedCents
          }
          user {
            id
            email
            phoneNumber
            firstName
            fullName
          }
          foodTruck {
            id
            name
            logoUrl
            coverImageUrl
            description
            latitude
            longitude
            deliveryFee
          }
        }
      }
    `;

    const variables = {
      orderId,
    };

    const response = await executeGraphQL(query, variables);

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message || 'Failed to fetch order');
    }

    if (!response || !response.fetchOrder) {
      throw new Error('Order not found or invalid response format');
    }

    return response.fetchOrder;
  } catch (error) {
    console.error('Error in fetchOrder:', error);
    throw error;
  }
};

/**
 * Fetches user orders with optional status filter
 * @param {Object} params - Query parameters
 * @param {string} params.status - Order status filter (optional)
 * @param {number} params.limit - Number of orders to fetch (optional)
 * @param {number} params.offset - Number of orders to skip (optional)
 * @returns {Promise<Object>} Orders data with totalCount
 * @throws {Error} If status is invalid or API call fails
 */
export const fetchUserOrders = async (params = {}) => {
  try {
    // Validate status if provided
    if (params.status) {
      validateOrderStatus(params.status);
    }

    const query = `
      query fetchUserOrders($params: UserOrdersInput!) {
        fetchUserOrders(params: $params) {
          orders {
            id
            status
            deliveryFeeCents
            tipCents
            subtotalCents
            totalCents
            orderAddresses {
              streetLineOne
              streetLineTwo
              city
              state
              country
              zipCode
              destinationType
              deliveryInstructions
              latlong
            }
            orderItems {
              id
              menuItemName
              totalPriceCents
              vendorName
            }
            orderPayments {
              id
              amountChargedCents
            }
            user {
              id
              email
              phoneNumber
              firstName
              fullName
            }
            foodTruck {
              id
              name
              logoUrl
              coverImageUrl
              description
              latitude
              longitude
              deliveryFee
            }
          }
          totalCount
        }
      }
    `;

    const variables = {
      params: {
        ...params,
      },
    };

    const response = await executeGraphQL(query, variables);

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message || 'Failed to fetch user orders');
    }

    if (!response || typeof response.fetchUserOrders === 'undefined') {
      // If fetchUserOrders is not in response, return empty result instead of throwing error
      return {
        orders: [],
        totalCount: 0,
      };
    }

    // Handle case where fetchUserOrders exists but might be null
    const result = response.fetchUserOrders;

    if (!result) {
      return {
        orders: [],
        totalCount: 0,
      };
    }

    // Ensure orders is always an array, even if null/undefined
    if (!Array.isArray(result.orders)) {
      result.orders = [];
    }

    return result;
  } catch (error) {
    console.error('Error in fetchUserOrders:', error);
    throw error;
  }
};

/**
 * Fetches orders by specific status
 * @param {string} status - Order status to filter by
 * @param {Object} options - Additional query options
 * @param {number} options.limit - Number of orders to fetch
 * @param {number} options.offset - Number of orders to skip
 * @returns {Promise<Object>} Orders data with totalCount
 */
export const fetchOrdersByStatus = async (status, options = {}) => {
  return fetchUserOrders({
    status,
    ...options,
  });
};

/**
 * Fetches all pending orders
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Pending orders data
 */
export const fetchPendingOrders = async (options = {}) => {
  return fetchOrdersByStatus('pending', options);
};

/**
 * Fetches all preparing orders
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Preparing orders data
 */
export const fetchPreparingOrders = async (options = {}) => {
  return fetchOrdersByStatus('preparing', options);
};

/**
 * Fetches all delivering orders
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Delivering orders data
 */
export const fetchDeliveringOrders = async (options = {}) => {
  return fetchOrdersByStatus('delivering', options);
};

/**
 * Fetches all completed orders
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Completed orders data
 */
export const fetchCompletedOrders = async (options = {}) => {
  return fetchOrdersByStatus('completed', options);
};

/**
 * Fetches all cancelled orders
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Cancelled orders data
 */
export const fetchCancelledOrders = async (options = {}) => {
  return fetchOrdersByStatus('cancelled', options);
};

/**
 * Gets all valid order statuses
 * @returns {string[]} Array of valid order statuses
 */
export const getValidOrderStatuses = () => {
  return [...VALID_STATUSES];
};

/**
 * Formats order data for display
 * @param {Object} order - Order object from API
 * @returns {Object} Formatted order data
 */
export const formatOrderForDisplay = (order) => {
  if (!order) return null;

  return {
    ...order,
    // Convert cents to dollars for display
    deliveryFee: order.deliveryFeeCents ? (order.deliveryFeeCents / 100).toFixed(2) : '0.00',
    tip: order.tipCents ? (order.tipCents / 100).toFixed(2) : '0.00',
    subtotal: order.subtotalCents ? (order.subtotalCents / 100).toFixed(2) : '0.00',
    total: order.totalCents ? (order.totalCents / 100).toFixed(2) : '0.00',
    // Format order items
    formattedItems:
      order.orderItems?.map((item) => ({
        ...item,
        price: item.totalPriceCents ? (item.totalPriceCents / 100).toFixed(2) : '0.00',
      })) || [],
    // Format order payments
    formattedPayments:
      order.orderPayments?.map((payment) => ({
        ...payment,
        amountCharged: payment.amountChargedCents
          ? (payment.amountChargedCents / 100).toFixed(2)
          : '0.00',
      })) || [],
    // Format address
    formattedAddress: order.orderAddresses?.[0]
      ? {
          ...order.orderAddresses[0],
          fullAddress: [
            order.orderAddresses[0].streetLineOne,
            order.orderAddresses[0].streetLineTwo,
            order.orderAddresses[0].city,
            order.orderAddresses[0].state,
            order.orderAddresses[0].zipCode,
          ]
            .filter(Boolean)
            .join(', '),
        }
      : null,
  };
};

/**
 * Formats multiple orders for display
 * @param {Object[]} orders - Array of order objects
 * @returns {Object[]} Array of formatted order objects
 */
export const formatOrdersForDisplay = (orders) => {
  if (!Array.isArray(orders)) return [];
  return orders.map(formatOrderForDisplay).filter(Boolean);
};