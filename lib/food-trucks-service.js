// Food Trucks GraphQL Service
// This service handles all food truck related GraphQL queries

import { executeGraphQL } from './graphql-client';

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

    const result = await executeGraphQL(query, variables);
    
    const resultData = result.fetchFoodTrucks;
    
    return {
      foodTrucks: resultData.foodTrucks,
      totalCount: resultData.totalCount
    };
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

  const data = await fetchNearbyFoodTrucks(params);
    
    // Cache the result
    foodTrucksCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

  return data;
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
