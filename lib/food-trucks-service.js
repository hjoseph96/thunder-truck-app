// Vendors GraphQL Service
// This service handles all vendor related GraphQL queries

import { executeGraphQL } from './graphql-client';

/**
 * Fetch nearby vendors using the GraphQL fetchVendors query
 * @param {number} latitude - Latitude coordinate for nearby search
 * @param {number} longitude - Longitude coordinate for nearby search
 * @param {number} radius - Search radius in miles (default: 30)
 * @param {string} unit - Unit for radius (miles or kilometers, default: miles)
 * @param {number} page - Page number for pagination (default: 1)
 * @param {string} foodTypeId - Filter by food type ID (optional)
 * @param {number} perPage - Number of vendors per page (default: 50)
 * @returns {Promise<Object>} Object with vendors array and totalCount
 */
export const fetchNearbyVendors = async ({
  latitude,
  longitude,
  radius = 30,
  unit = 'miles',
  page = 1,
  foodTypeId = null,
  perPage = 50
}) => {
    const query = `
      query FetchNearbyVendors($params: FetchVendorsInput!) {
        fetchVendors(params: $params) {
          vendors {
            id
            name
            description
            latitude
            longitude
            coverImageUrl
            logoUrl
            deliveryFee
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

    // Build params object according to FetchVendorsInput schema
    const params = {
      nearbyLat: latitude,
      nearbyLng: longitude,
      nearbyRadius: radius,
      nearbyUnit: unit,
      page,
      perPage,
      ...(foodTypeId && { foodTypeId })
    };

    const variables = { params };

    const result = await executeGraphQL(query, variables);

    const resultData = result.fetchVendors;

    return {
      vendors: resultData.vendors,
      totalCount: resultData.totalCount
    };
};

/**
 * Get vendors with caching for better performance
 * @param {Object} params - Search parameters
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Object with vendors array and totalCount
 */
let vendorsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getNearbyVendorsWithCache = async (params, forceRefresh = false) => {
  const cacheKey = `vendors_${JSON.stringify(params)}`;
  const cached = vendorsCache.get(cacheKey);

  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchNearbyVendors(params);

    // Cache the result
    vendorsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

  return data;
};

/**
 * Clear the vendors cache
 */
export const clearVendorsCache = () => {
  vendorsCache.clear();
};

// Legacy exports for backward compatibility
export const fetchNearbyFoodTrucks = fetchNearbyVendors;
export const getNearbyFoodTrucksWithCache = getNearbyVendorsWithCache;
export const clearFoodTrucksCache = clearVendorsCache;

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
