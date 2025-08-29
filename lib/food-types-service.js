// Food Types GraphQL Service
// This service handles all food type related GraphQL queries

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
 * Fetch food types using the GraphQL fetchFoodTypes query
 * @param {number} page - Page number for pagination (default: 1)
 * @returns {Promise<Array>} Array of food types
 */
export const fetchFoodTypes = async (page = 1) => {
  try {
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

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        query,
        variables: { page },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data.fetchFoodTypes;
  } catch (error) {
    console.error('Error fetching food types:', error);
    throw error;
  }
};

/**
 * Fetch a single food type by ID
 * @param {string} id - Food type ID
 * @returns {Promise<Object>} Food type object
 */
export const fetchFoodTypeById = async (id) => {
  try {
    const query = `
      query FetchFoodType($id: ID!) {
        fetchFoodTypes {
          id
          title
          iconImageUrl
          coverImageUrl
          createdAt
          updatedAt
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        query,
        variables: { id },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // Find the specific food type by ID
    const foodType = result.data.fetchFoodTypes.find(ft => ft.id === id);
    if (!foodType) {
      throw new Error(`Food type with ID ${id} not found`);
    }

    return foodType;
  } catch (error) {
    console.error('Error fetching food type by ID:', error);
    throw error;
  }
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

  try {
    const data = await fetchFoodTypes(page);
    
    // Cache the result
    foodTypesCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      console.warn('Using cached food types due to API error:', error);
      return cached.data;
    }
    throw error;
  }
};

/**
 * Clear the food types cache
 */
export const clearFoodTypesCache = () => {
  foodTypesCache.clear();
};
