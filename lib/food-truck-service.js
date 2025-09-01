// Food Truck GraphQL Service
// This service handles individual food truck GraphQL queries

import { executeGraphQL } from './graphql-client';

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
                optionGroups {
                  id
                  name
                  limit
                  options {
                    id
                    name
                    price
                    imageUrl
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await executeGraphQL(query, { id });
    
    return result.fetchFoodTruck;
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

  const data = await fetchFoodTruck(id);
    
  // Cache the result
  foodTruckCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
};

/**
 * Clear the food truck cache
 */
export const clearFoodTruckCache = () => {
  foodTruckCache.clear();
};
