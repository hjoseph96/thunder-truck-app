# Token Manager - Platform-Aware Storage

## Overview

The `lib/token-manager.js` module provides a platform-aware storage abstraction for JWT tokens and user data. It automatically uses the appropriate storage mechanism based on the platform:

- **Web:** Browser's `localStorage`
- **iOS/Android:** `AsyncStorage` from `@react-native-async-storage/async-storage`

## Why Platform-Specific Storage?

### Web (localStorage)
- **Native to browsers:** Fast, synchronous access
- **Persistent:** Survives browser restarts and tab closures
- **Domain-specific:** Isolated per domain for security
- **Size:** ~5-10MB storage limit
- **Best for:** Web deployment where users expect to stay logged in

### Native (AsyncStorage)
- **Encrypted:** Secure storage on iOS/Android
- **Async API:** Non-blocking operations
- **Best for:** Mobile apps where security is critical

## Storage Keys

```javascript
const TOKEN_KEY = 'thunder_truck_jwt_token';    // JWT authentication token
const USER_KEY = 'thunder_truck_user_data';     // User profile data (JSON)
```

## API Reference

### Token Operations

#### `storeToken(token)`
Store JWT token persistently.
```javascript
import { storeToken } from './lib/token-manager';

await storeToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
// Token is now persisted in localStorage (web) or AsyncStorage (native)
```

#### `getStoredToken()`
Retrieve stored JWT token.
```javascript
import { getStoredToken } from './lib/token-manager';

const token = await getStoredToken();
if (token) {
  console.log('User is authenticated');
} else {
  console.log('User needs to sign in');
}
```

#### `removeToken()`
Remove JWT token from storage.
```javascript
import { removeToken } from './lib/token-manager';

await removeToken();
// User is now logged out (token removed)
```

### User Data Operations

#### `storeUserData(userData)`
Store user profile data.
```javascript
import { storeUserData } from './lib/token-manager';

const userData = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
};

await storeUserData(userData);
```

#### `getStoredUserData()`
Retrieve stored user data.
```javascript
import { getStoredUserData } from './lib/token-manager';

const userData = await getStoredUserData();
if (userData) {
  console.log(`Welcome back, ${userData.name}!`);
}
```

#### `removeUserData()`
Remove user data from storage.
```javascript
import { removeUserData } from './lib/token-manager';

await removeUserData();
```

### Utility Functions

#### `isAuthenticated()`
Check if user has a valid token stored.
```javascript
import { isAuthenticated } from './lib/token-manager';

const authenticated = await isAuthenticated();
if (!authenticated) {
  navigation.navigate('SignIn');
}
```

#### `clearAuthData()`
Clear all authentication data (token + user data).
```javascript
import { clearAuthData } from './lib/token-manager';

// Complete logout
await clearAuthData();
navigation.navigate('LandingPage');
```

## Implementation Details

### Platform Detection

The storage abstraction uses `Platform.OS` to detect the current platform:

```javascript
import { Platform } from 'react-native';

const storage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);  // Synchronous on web
    } else {
      await AsyncStorage.setItem(key, value);  // Async on native
    }
  },
  // ... other methods
};
```

### Error Handling

All storage operations include try-catch blocks:
- Logs errors to console for debugging
- Returns `null` for failed retrievals
- Throws errors for failed stores/removes (can be caught by caller)

### Data Serialization

User data is automatically serialized/deserialized:
```javascript
// Storing (automatic JSON.stringify)
await storeUserData({ name: 'John', email: 'john@example.com' });

// Retrieving (automatic JSON.parse)
const userData = await getStoredUserData();
// userData is already an object, not a string
```

## Usage Examples

### Sign In Flow

```javascript
// components/SignIn.jsx
import { storeToken, storeUserData } from '../lib/token-manager';

const handleSignIn = async (email, password) => {
  try {
    // Authenticate with backend
    const response = await signInUser({ email, password });
    
    // Store token and user data
    await storeToken(response.token);
    await storeUserData(response.user);
    
    // Navigate to home
    navigation.navigate('ExplorerHome');
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};
```

### Auto-Login on App Start

**✅ Already Implemented in App.js**

The app automatically checks for stored JWT tokens on startup and routes users accordingly:

```javascript
// App.js - Authentication check on startup
import { isAuthenticated } from './lib/token-manager';

useEffect(() => {
  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated();
      console.log('Auth check on startup:', authenticated);
      
      if (authenticated) {
        // User has valid token, go directly to ExplorerHome
        setInitialRoute('ExplorerHome');
      } else {
        // No token found, show LandingPage
        setInitialRoute('LandingPage');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On error, default to LandingPage
      setInitialRoute('LandingPage');
    } finally {
      setIsCheckingAuth(false);
    }
  };
  
  checkAuth();
}, []);
```

**How It Works:**
1. App checks for stored JWT token on launch
2. If token exists → User goes directly to ExplorerHome (auto-login)
3. If no token → User sees LandingPage with "Get Started" button
4. Loading spinner shown while checking authentication

### Sign Out Flow

```javascript
// components/UserProfile.jsx
import { clearAuthData } from '../lib/token-manager';

const handleSignOut = async () => {
  try {
    await clearAuthData();
    navigation.navigate('LandingPage');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};
```

### Protected API Requests

```javascript
// lib/graphql-client.js
import { getStoredToken } from './token-manager';

const authLink = setContext(async (_, { headers }) => {
  const token = await getStoredToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});
```

## Security Considerations

### Web (localStorage)
- ✅ **Domain isolation:** Each domain has its own storage
- ✅ **HTTPS only:** Always use HTTPS in production to prevent token theft
- ⚠️ **XSS vulnerability:** Accessible to JavaScript (protect against XSS attacks)
- ⚠️ **No encryption:** Tokens are stored in plain text
- ℹ️ **Best practice:** Use short-lived tokens + refresh tokens

### Native (AsyncStorage)
- ✅ **App sandboxing:** Isolated per app
- ✅ **Encrypted on iOS:** Secure storage by default
- ✅ **Not accessible to other apps**
- ℹ️ **Platform-specific encryption:** Varies by Android device

### General Best Practices

1. **Use HTTPS:** Always use HTTPS in production
2. **Short token expiry:** Set reasonable token expiration times (e.g., 24 hours)
3. **Refresh tokens:** Implement refresh token flow for better security
4. **Logout on sensitive operations:** Clear tokens after password changes
5. **Validate tokens server-side:** Never trust client-side token validation alone

## Troubleshooting

### Web: Token not persisting

**Problem:** User has to sign in after every page refresh.

**Solution:**
1. Check browser console for localStorage errors
2. Ensure browser allows localStorage (not in private/incognito mode)
3. Check if storage quota is exceeded
4. Verify domain is correct (localhost vs deployed domain)

```javascript
// Test localStorage availability
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage is available');
} catch (e) {
  console.error('localStorage is not available:', e);
}
```

### Native: Token not persisting

**Problem:** User has to sign in after app restart.

**Solution:**
1. Ensure `@react-native-async-storage/async-storage` is installed
2. For iOS: Run `pod install` in the ios directory
3. For Android: Rebuild the app
4. Check for AsyncStorage errors in console

### Token not being included in API requests

**Problem:** API returns 401 Unauthorized even after sign in.

**Solution:**
1. Verify token is stored: `console.log(await getStoredToken())`
2. Check GraphQL client configuration in `lib/graphql-client.js`
3. Ensure `authLink` is properly set up
4. Verify server expects `Bearer ${token}` format

## Testing

### Manual Testing

```javascript
// Test in browser console (web) or React Native Debugger (native)

// Store a test token
await storage.setItem('test_token', 'test123');

// Retrieve it
const token = await storage.getItem('test_token');
console.log(token); // Should log: 'test123'

// Remove it
await storage.removeItem('test_token');

// Verify removal
const removed = await storage.getItem('test_token');
console.log(removed); // Should log: null
```

### Automated Testing

Consider adding unit tests:
```javascript
// __tests__/token-manager.test.js
import { storeToken, getStoredToken, removeToken } from '../lib/token-manager';

describe('Token Manager', () => {
  it('should store and retrieve token', async () => {
    const testToken = 'test_jwt_token_123';
    await storeToken(testToken);
    const retrieved = await getStoredToken();
    expect(retrieved).toBe(testToken);
  });
  
  // ... more tests
});
```

## Migration Notes

### From AsyncStorage-only to Platform-Aware

The new implementation is **backward compatible**. Existing tokens stored with AsyncStorage on web will continue to work, but new tokens will use localStorage.

If you need to migrate existing web users:
1. Old AsyncStorage data will remain accessible
2. New sign-ins will use localStorage
3. Users may need to sign in once after the migration

## Future Enhancements

Potential improvements:
- [ ] Token refresh flow
- [ ] Encrypted storage for web (using Web Crypto API)
- [ ] Token expiration checking
- [ ] Automatic token renewal
- [ ] Multi-device token management
- [ ] Biometric authentication integration

## Related Files

- `lib/graphql-client.js` - Uses tokens for authenticated API requests
- `components/SignIn.jsx` - Stores tokens after successful authentication
- `components/SignUp.jsx` - Stores tokens after user registration
- `lib/session-manager.js` - May use token manager for session handling

## Support

For issues or questions:
1. Check browser/native console for error messages
2. Verify Platform.OS is correctly detected
3. Test storage operations manually
4. Review this documentation

## Version History

- **v2.0** (2025-10-21): Added platform-aware storage (localStorage for web)
- **v1.0** (2024): Initial AsyncStorage-only implementation

