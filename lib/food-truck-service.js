// Food Truck GraphQL Service
// This service handles individual food truck GraphQL queries

import { getAuthToken } from './graphql-client';

const GRAPHQL_ENDPOINT = process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql';

/**
 * Get headers for authenticated requests
 * @returns {Promise<Object>} Headers object with Authorization if token exists
 */
const getHeaders = async () => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

/**
 * Fetch a single food truck by ID using the GraphQL fetchFoodTruck query
 * Only fetches necessary columns for better performance
 * @param {string} id - Food truck ID
 * @returns {Promise<Object>} Food truck object with menu data
 */
export const fetchFoodTruck = async (id) => {
  try {
    const query = `
      query FetchFoodTruck($id: ID!) {
        fetchFoodTruck(id: $id) {
          id
          name
          description
          coverImageUrl
          logoUrl
          deliveryFee
          isSubscriber
          menu {
            id
            categories {
              id
              name
              menuItems {
                id
                name
                description
                price
                imageUrl
              }
            }
          }
        }
      }
    `;

    const variables = { id };

    const headers = await getHeaders();

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data.fetchFoodTruck;
  } catch (error) {
    console.error('Error fetching food truck:', error);
    throw error;
  }
};

/**
 * Get food truck with caching for better performance
 * @param {string} id - Food truck ID
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Food truck object
 */
let foodTruckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getFoodTruckWithCache = async (id, forceRefresh = false) => {
  const cacheKey = `foodTruck_${id}`;
  const cached = foodTruckCache.get(cacheKey);
  
  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const data = await fetchFoodTruck(id);
    
    // Cache the result
    foodTruckCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      console.warn('Using cached food truck due to API error:', error);
      return cached.data;
    }
    throw error;
  }
};

/**
 * Clear the food truck cache
 */
export const clearFoodTruckCache = () => {
  foodTruckCache.clear();
};
