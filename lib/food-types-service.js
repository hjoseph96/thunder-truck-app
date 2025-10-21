// Food Types GraphQL Service
// This service handles all food type related GraphQL queries

import { executeGraphQL } from './graphql-client';

/**
 * Fetch food types using the GraphQL fetchFoodTypes query
 * @param {number} page - Page number for pagination (default: 1)
 * @returns {Promise<Array>} Array of food types
 */
export const fetchFoodTypes = async (page = 1) => {
  const query = `
    query FetchFoodTypes($page: Int) {
      fetchFoodTypes(page: $page) {
        id
        title
        iconImageUrl
        coverImageUrl
        createdAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL(query, { page });

  return result.fetchFoodTypes;
};

/**
 * Fetch a single food type by ID
 * @param {string} id - Food type ID
 * @returns {Promise<Object>} Food type object
 */
export const fetchFoodTypeById = async (id) => {
  const query = `
      query FetchFoodType($id: ID!) {
        fetchFoodType(id: $id) {
          id
          title
          iconImageUrl
          coverImageUrl
          createdAt
          updatedAt
        }
      }
    `;

    const result = await executeGraphQL(query, { id });

    // Find the specific food type by ID
    const foodType = result.fetchFoodType;
    
    return foodType;
};

/**
 * Get food types with caching for better performance
 * @param {number} page - Page number
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Array>} Array of food types
 */
let foodTypesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getFoodTypesWithCache = async (page = 1, forceRefresh = false) => {
  const cacheKey = `foodTypes_page_${page}`;
  const cached = foodTypesCache.get(cacheKey);
  
  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFoodTypes(page);
    
  // Cache the result
  foodTypesCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
  
};

/**
 * Clear the food types cache
 */
export const clearFoodTypesCache = () => {
  foodTypesCache.clear();
};
