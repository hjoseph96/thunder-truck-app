import { executeGraphQL } from './graphql-client';

const FETCH_SPOKEN_LANGUAGES = `
  query fetchSpokenLanguages {
    fetchSpokenLanguages {
      id
      isoCode
      name
    }
  }
`;

/**
 * Fetch all available spoken languages
 * @returns {Promise<Array>} Array of language objects with id, isoCode, and name
 */
export const fetchSpokenLanguages = async () => {
  try {
    const result = await executeGraphQL(FETCH_SPOKEN_LANGUAGES);
    return result.fetchSpokenLanguages || [];
  } catch (error) {
    console.error('Error fetching spoken languages:', error);
    throw error;
  }
};
