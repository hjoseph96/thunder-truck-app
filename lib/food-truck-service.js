// Vendor GraphQL Service
// This service handles individual vendor GraphQL queries

import { executeGraphQL } from './graphql-client';

/**
 * Fetch a single vendor by ID using the GraphQL fetchVendor query
 * Only fetches necessary columns for better performance
 * @param {string} id - Vendor ID
 * @returns {Promise<Object>} Vendor object with menu data
 */
export const fetchVendor = async (id) => {
  try {
    const query = `
      query FetchVendor($id: ID!) {
        fetchVendor(id: $id) {
          id
          name
          description
          coverImageUrl
          logoUrl
          deliveryFee
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
    
    return result.fetchVendor;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    throw error;
  }
};

/**
 * Get vendor with caching for better performance
 * @param {string} id - Vendor ID
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Vendor object
 */
let vendorCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getVendorWithCache = async (id, forceRefresh = false) => {
  const cacheKey = `vendor_${id}`;
  const cached = vendorCache.get(cacheKey);
  
  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchVendor(id);
    
  // Cache the result
  vendorCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
};

/**
 * Clear the vendor cache
 */
export const clearVendorCache = () => {
  vendorCache.clear();
};

// Legacy exports for backward compatibility
export const fetchFoodTruck = fetchVendor;
export const getFoodTruckWithCache = getVendorWithCache;
export const clearFoodTruckCache = clearVendorCache;
