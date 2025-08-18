import axios from 'axios';
import { CURRENT_API_CONFIG } from '../config/api-config';

// GraphQL API configuration
const GRAPHQL_ENDPOINT = `${CURRENT_API_CONFIG.baseURL}${CURRENT_API_CONFIG.graphqlEndpoint}`;

// Create axios instance for GraphQL requests
const graphqlClient = axios.create({
  baseURL: GRAPHQL_ENDPOINT,
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
graphqlClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
graphqlClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

// Token management functions
export const setAuthToken = (token) => {
  if (token) {
    // In a real app, you'd use secure storage like expo-secure-store
    // For now, using global variable (replace with proper storage in production)
    try {
      global.authToken = token;
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }
};

export const getAuthToken = () => {
  try {
    return global.authToken || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const clearAuthToken = () => {
  try {
    global.authToken = null;
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

// GraphQL query executor
export const executeGraphQL = async (query, variables = {}) => {
  try {
    const response = await graphqlClient.post('', {
      query,
      variables,
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('GraphQL Error:', error);
    
    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found. Please check the server configuration.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

export default graphqlClient;
