// Food Trucks GraphQL Service
// This service handles all food truck related GraphQL queries

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
 * Fetch nearby food trucks using the GraphQL fetchFoodTrucks query
 * @param {number} latitude - Latitude coordinate for nearby search
 * @param {number} longitude - Longitude coordinate for nearby search
 * @param {number} radius - Search radius in miles (default: 30)
 * @param {string} unit - Unit for radius (miles or kilometers, default: miles)
 * @param {number} page - Page number for pagination (default: 1)
 * @param {string} foodTypeId - Filter by food type ID (optional)
 * @param {boolean} isSubscriber - Filter by subscriber status (optional)
 * @returns {Promise<Object>} Object with foodTrucks array and totalCount
 */
export const fetchNearbyFoodTrucks = async ({
  latitude,
  longitude,
  radius = 30,
  unit = 'miles',
  page = 1,
  foodTypeId = null,
  isSubscriber = null
}) => {
  try {
    const query = `
      query FetchNearbyFoodTrucks(
        $nearbyLat: Float
        $nearbyLng: Float
        $nearbyRadius: Float
        $nearbyUnit: String
        $page: Int
        $foodTypeId: ID
        $isSubscriber: Boolean
      ) {
        fetchFoodTrucks(
          nearbyLat: $nearbyLat
          nearbyLng: $nearbyLng
          nearbyRadius: $nearbyRadius
          nearbyUnit: $nearbyUnit
          page: $page
          foodTypeId: $foodTypeId
          isSubscriber: $isSubscriber
        ) {
          foodTrucks {
            id
            name
            coverImageUrl
            deliveryFee
            isSubscriber
            foodTypes {
              id
              title
              iconImageUrl
            }
            operatingHours {
              dayOfWeek
              openingTime
              closingTime
            }
            createdAt
            updatedAt
          }
          totalCount
        }
      }
    `;

    const variables = {
      nearbyLat: latitude,
      nearbyLng: longitude,
      nearbyRadius: radius,
      nearbyUnit: unit,
      page,
      ...(foodTypeId && { foodTypeId }),
      ...(isSubscriber !== null && { isSubscriber })
    };

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

    const resultData = result.data.fetchFoodTrucks;
    return {
      foodTrucks: resultData.foodTrucks,
      totalCount: resultData.totalCount
    };
  } catch (error) {
    console.error('Error fetching nearby food trucks:', error);
    throw error;
  }
};

/**
 * Get food trucks with caching for better performance
 * @param {Object} params - Search parameters
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Object with foodTrucks array and totalCount
 */
let foodTrucksCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getNearbyFoodTrucksWithCache = async (params, forceRefresh = false) => {
  const cacheKey = `foodTrucks_${JSON.stringify(params)}`;
  const cached = foodTrucksCache.get(cacheKey);
  
  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const data = await fetchNearbyFoodTrucks(params);
    
    // Cache the result
    foodTrucksCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      console.warn('Using cached food trucks due to API error:', error);
      return cached.data;
    }
    throw error;
  }
};

/**
 * Clear the food trucks cache
 */
export const clearFoodTrucksCache = () => {
  foodTrucksCache.clear();
};

/**
 * Get mock location for testing (replace with actual user location)
 * @returns {Object} Mock coordinates for testing
 */
export const getMockLocation = () => {
  // Mock coordinates for testing - replace with actual user location
  return {
    latitude: 40.7128, // New York coordinates for testing
    longitude: -74.0060,
    radius: 30,
    unit: 'miles'
  };
};
