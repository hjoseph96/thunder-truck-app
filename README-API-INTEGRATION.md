# Thunder Truck App - GraphQL API Integration

This document explains how the React Native app integrates with the Rails GraphQL API for authentication and user management.

## Overview

The app uses GraphQL with axios to communicate with the Rails backend, implementing a phone number-based authentication system with OTP verification.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   GraphQL Client │    │   Rails API     │
│      App        │───▶│   (axios)        │───▶│   (GraphQL)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## File Structure

```
lib/
├── graphql-client.js      # Axios-based GraphQL client
├── api-service.js         # Authentication service functions
config/
├── api-config.js          # Environment-specific API configuration
components/
├── SignIn.jsx             # Sign in with phone number
├── SignUp.jsx             # Sign up with phone number
└── OtpVerification.jsx    # OTP verification screen
```

## API Endpoints

### 1. Request OTP
- **Purpose**: Send 6-digit OTP code to user's phone number
- **GraphQL**: `requestOtp` mutation
- **Parameters**: `phoneNumber` (String)
- **Response**: Success status, message, and errors

### 2. Verify OTP
- **Purpose**: Verify OTP code and authenticate user
- **GraphQL**: `verifyOtp` mutation
- **Parameters**: `phoneNumber` (String), `otpCode` (String)
- **Response**: User data, JWT token, success status, and errors

### 3. Sign Out
- **Purpose**: Revoke JWT token and sign out user
- **GraphQL**: `signOut` mutation
- **Parameters**: None (uses JWT token from Authorization header)
- **Response**: Success status and message

## Authentication Flow

1. **User enters phone number** in SignIn or SignUp screen
2. **App requests OTP** via `requestOtp` mutation
3. **User receives SMS** with 6-digit code
4. **User enters OTP** in OtpVerification screen
5. **App verifies OTP** via `verifyOtp` mutation
6. **JWT token is stored** locally for authenticated requests
7. **User is redirected** to main app

## Usage Examples

### Requesting OTP
```javascript
import { authService } from '../lib/api-service';

try {
  const result = await authService.requestOtp('+1234567890');
  if (result.success) {
    // Navigate to OTP verification
    navigation.navigate('OtpVerification', { phoneNumber: '+1234567890' });
  }
} catch (error) {
  console.error('OTP request failed:', error);
}
```

### Verifying OTP
```javascript
import { authService } from '../lib/api-service';

try {
  const result = await authService.verifyOtp('+1234567890', '123456');
  if (result.success) {
    // User is authenticated, token is automatically stored
    navigation.navigate('LandingPage');
  }
} catch (error) {
  console.error('OTP verification failed:', error);
}
```

### Checking Authentication Status
```javascript
import { authService } from '../lib/api-service';

if (authService.isAuthenticated()) {
  // User is logged in
  const token = authService.getCurrentToken();
} else {
  // User needs to sign in
}
```

### Signing Out
```javascript
import { authService } from '../lib/api-service';

try {
  await authService.signOut();
  // Token is automatically cleared
  navigation.navigate('SignIn');
} catch (error) {
  console.error('Sign out failed:', error);
}
```

## Configuration

### Environment Setup
Update `config/api-config.js` with your Rails server URLs:

```javascript
export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',        // Local Rails server
    graphqlEndpoint: '/graphql',
    timeout: 10000,
  },
  staging: {
    baseURL: 'https://your-staging-api.com',
    graphqlEndpoint: '/graphql',
    timeout: 15000,
  },
  production: {
    baseURL: 'https://your-production-api.com',
    graphqlEndpoint: '/graphql',
    timeout: 20000,
  },
};
```

### Rails Server Requirements
- Rails 8 with GraphQL
- GraphQL endpoint at `/graphql`
- CORS configured for React Native
- Twilio integration for SMS OTP
- JWT token generation and validation

## Error Handling

The API client includes comprehensive error handling:

- **Network timeouts**: Configurable timeout with user-friendly messages
- **Authentication errors**: Automatic token clearing on 401 responses
- **Server errors**: Differentiated handling for 4xx vs 5xx errors
- **GraphQL errors**: Parsing and display of GraphQL-specific error messages

## Security Features

- **JWT tokens**: Secure authentication with automatic token management
- **Phone verification**: OTP-based phone number verification
- **Rate limiting**: OTP request limits (handled by Rails backend)
- **Token expiration**: 30-day JWT token validity (configurable on backend)

## Development Notes

### Token Storage
Currently uses global variables for token storage. In production, replace with:
- `expo-secure-store` for secure token storage
- `AsyncStorage` for development/testing

### Environment Variables
Consider using environment variables for API configuration:
```bash
# .env
API_BASE_URL=http://localhost:3000
API_TIMEOUT=10000
```

### Testing
Test API integration with:
- Rails server running locally
- Valid Twilio credentials configured
- Phone number verification enabled

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if Rails server is running on correct port
2. **CORS errors**: Ensure Rails CORS configuration allows React Native
3. **OTP not received**: Verify Twilio credentials and phone number format
4. **Token validation fails**: Check JWT secret and expiration settings

### Debug Mode
Enable detailed logging in `lib/graphql-client.js`:
```javascript
// Add this for debugging
console.log('GraphQL Request:', { query, variables });
console.log('GraphQL Response:', response.data);
```

## Future Enhancements

- [ ] Implement secure token storage with expo-secure-store
- [ ] Add offline support and request queuing
- [ ] Implement token refresh mechanism
- [ ] Add request/response interceptors for analytics
- [ ] Implement retry logic for failed requests
- [ ] Add request caching for improved performance
