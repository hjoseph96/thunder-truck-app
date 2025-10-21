# Web URL Routing Guide

## Overview

ThunderTruck's web version now supports URL-based routing using React Navigation's deep linking configuration. This enables proper browser navigation, bookmarking, and SEO-friendly URLs.

## URL Structure

### Base URL
- **Production:** `https://web.thundertruck.app`
- **Development:** `http://localhost:8081`

## Route Mapping

### Public Routes

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **LandingPage** | `` (empty) | `https://web.thundertruck.app` | Landing page (if not authenticated) |
| **ExplorerHome** | `/` | `https://web.thundertruck.app/` | Main home/explorer screen |
| **SignIn** | `/signin` | `https://web.thundertruck.app/signin` | Sign in page |
| **SignUp** | `/signup` | `https://web.thundertruck.app/signup` | Sign up page |
| **VerifyOTP** | `/verify` | `https://web.thundertruck.app/verify` | OTP verification |

### Browse & Discover

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **MapPage** | `/map` | `https://web.thundertruck.app/map` | Interactive map view |
| **FoodTypeViewer** | `/food-types/:foodTypeId` | `https://web.thundertruck.app/food-types/123` | Browse by food type |
| **FoodTruckViewer** | `/vendor/:foodTruckId` | `https://web.thundertruck.app/vendor/456` | Food truck menu |
| **MenuItemViewer** | `/vendor/:foodTruckId/:menuItemId` | `https://web.thundertruck.app/vendor/456/789` | Menu item details |

### Cart & Checkout

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **CheckoutForm** | `/cart` | `https://web.thundertruck.app/cart` | Shopping cart & checkout |
| **PaymentScreen** | `/cart/pay` | `https://web.thundertruck.app/cart/pay` | Payment processing |

### Orders & Tracking

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **OrderIndex** | `/orders` | `https://web.thundertruck.app/orders` | Order history |
| **OrderDetail** | `/track/:orderId` | `https://web.thundertruck.app/track/order-123` | Live order tracking |

### User Profile

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **UserAddressList** | `/addresses` | `https://web.thundertruck.app/addresses` | Manage addresses |
| **AddAddressForm** | `/address/add` | `https://web.thundertruck.app/address/add` | Add new address |
| **EditUserName** | `/profile/name` | `https://web.thundertruck.app/profile/name` | Edit name |
| **EditUserPhoneNumber** | `/profile/phone` | `https://web.thundertruck.app/profile/phone` | Edit phone |
| **EditUserEmail** | `/profile/email` | `https://web.thundertruck.app/profile/email` | Edit email |
| **EditUserSpokenLanguages** | `/profile/languages` | `https://web.thundertruck.app/profile/languages` | Language preferences |
| **PaymentMethodManager** | `/profile/payment-methods` | `https://web.thundertruck.app/profile/payment-methods` | Payment methods |

### Documents

| Screen | URL Pattern | Example | Description |
|--------|-------------|---------|-------------|
| **MarkdownViewer** | `/document/:documentType` | `https://web.thundertruck.app/document/terms` | Terms, Privacy Policy |

## URL Parameters

### Dynamic Route Parameters

**FoodTypeViewer:**
```javascript
// Navigate
navigation.navigate('FoodTypeViewer', { foodTypeId: '123' });

// URL Generated
https://web.thundertruck.app/food-types/123

// Access in Component
const { foodTypeId } = route.params;
```

**FoodTruckViewer:**
```javascript
// Navigate
navigation.navigate('FoodTruckViewer', { foodTruckId: '456' });

// URL Generated
https://web.thundertruck.app/vendor/456

// Access in Component
const { foodTruckId } = route.params;
```

**MenuItemViewer:**
```javascript
// Navigate
navigation.navigate('MenuItemViewer', { 
  foodTruckId: '456',
  menuItemId: '789'
});

// URL Generated
https://web.thundertruck.app/vendor/456/789

// Access in Component
const { foodTruckId, menuItemId } = route.params;
```

**OrderDetail:**
```javascript
// Navigate
navigation.navigate('OrderDetail', { orderId: 'order-123' });

// URL Generated
https://web.thundertruck.app/track/order-123

// Access in Component
const { orderId } = route.params;
```

## Implementation Details

### App.js Configuration

```javascript
const linking = {
  prefixes: ['https://web.thundertruck.app', 'http://localhost:8081'],
  config: {
    screens: {
      LandingPage: '',
      SignIn: 'signin',
      SignUp: 'signup',
      VerifyOTP: 'verify',
      MarkdownViewer: 'document/:documentType',
      ExplorerHome: '/',
      MapPage: 'map',
      FoodTypeViewer: 'food-types/:foodTypeId',
      FoodTruckViewer: 'vendor/:foodTruckId',
      MenuItemViewer: 'vendor/:foodTruckId/:menuItemId',
      CheckoutForm: 'cart',
      PaymentScreen: 'cart/pay',
      AddAddressForm: 'address/add',
      UserAddressList: 'addresses',
      EditUserName: 'profile/name',
      EditUserPhoneNumber: 'profile/phone',
      EditUserEmail: 'profile/email',
      EditUserSpokenLanguages: 'profile/languages',
      PaymentMethodManager: 'profile/payment-methods',
      OrderIndex: 'orders',
      OrderDetail: 'track/:orderId',
    },
  },
};
```

### NavigationContainer Setup

```javascript
<NavigationContainer 
  ref={navigationRef} 
  onReady={onReady}
  linking={linking}
  fallback={<LoadingScreen />}
>
```

## Features

### Browser Navigation
✅ **Back/Forward Buttons**: Browser navigation works seamlessly  
✅ **URL Updates**: URL changes as you navigate through the app  
✅ **Bookmarkable**: Users can bookmark specific pages  
✅ **Shareable Links**: Share direct links to food trucks, menu items, etc.  
✅ **Deep Links**: Open specific screens directly from URLs  

### SEO Benefits
✅ **Crawlable URLs**: Search engines can index individual pages  
✅ **Semantic URLs**: `/vendor/456` instead of `/?screen=vendor&id=456`  
✅ **Better Analytics**: Track specific page views  
✅ **Social Sharing**: Proper URLs for Open Graph tags  

### User Experience
✅ **Refresh Works**: Refreshing maintains current page  
✅ **Direct Access**: Paste URL to jump to specific content  
✅ **State Restoration**: URL preserves navigation state  
✅ **Mobile Compatible**: Same navigation code works on native  

## Usage Examples

### Navigating with URL Parameters

**Navigate to Food Truck:**
```javascript
// In any component
navigation.navigate('FoodTruckViewer', { foodTruckId: truck.id });

// Browser URL updates to:
// https://web.thundertruck.app/vendor/456
```

**Navigate to Menu Item:**
```javascript
navigation.navigate('MenuItemViewer', { 
  foodTruckId: truck.id,
  menuItemId: item.id 
});

// Browser URL updates to:
// https://web.thundertruck.app/vendor/456/789
```

**Navigate to Order Tracking:**
```javascript
navigation.navigate('OrderDetail', { orderId: order.id });

// Browser URL updates to:
// https://web.thundertruck.app/track/order-123
```

### Handling Deep Links

**User Opens Direct URL:**
```
URL: https://web.thundertruck.app/vendor/456/789

Result:
1. App loads
2. Authentication check runs
3. If authenticated → Loads MenuItemViewer with params:
   - foodTruckId: '456'
   - menuItemId: '789'
4. If not authenticated → Redirects to signin (then back to original URL)
```

## URL Slug Best Practices

### Future Enhancement: Friendly Slugs

Instead of IDs, you can use friendly slugs:

**Current (ID-based):**
```
/vendor/456
/vendor/456/789
```

**Future (Slug-based):**
```
/vendor/joes-taco-truck
/vendor/joes-taco-truck/carne-asada-burrito
```

To implement friendly slugs:

1. **Add slug field to models:**
   ```javascript
   foodTruck.slug = "joes-taco-truck"
   menuItem.slug = "carne-asada-burrito"
   ```

2. **Update navigation:**
   ```javascript
   navigation.navigate('FoodTruckViewer', { 
     foodTruckId: truck.slug  // Use slug instead of ID
   });
   ```

3. **Update API queries:**
   ```javascript
   // Backend accepts slugs
   getFoodTruckBySlug(slug)
   getMenuItemBySlug(foodTruckSlug, menuItemSlug)
   ```

4. **Update linking config:**
   ```javascript
   FoodTruckViewer: 'vendor/:slug',
   MenuItemViewer: 'vendor/:foodTruckSlug/:menuItemSlug',
   ```

## Testing

### Local Testing

**Development Server:**
```bash
npm run web
# Opens at http://localhost:8081
```

**Test URLs:**
```
http://localhost:8081/
http://localhost:8081/map
http://localhost:8081/signin
http://localhost:8081/cart
http://localhost:8081/orders
```

### Production Testing

After deployment, test these URLs:
```
https://web.thundertruck.app/
https://web.thundertruck.app/map
https://web.thundertruck.app/vendor/123
https://web.thundertruck.app/cart
https://web.thundertruck.app/track/order-456
```

## Vercel Configuration

The `vercel.json` already includes rewrites to handle client-side routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes are handled by the React app, not Vercel's server routing.

## Analytics Integration

With URL routing, you can now:

1. **Track Page Views:**
   ```javascript
   // Add to navigation listener
   navigationRef.current?.addListener('state', (e) => {
     const currentRoute = navigationRef.current?.getCurrentRoute();
     analytics.logPageView(currentRoute.name, currentRoute.params);
   });
   ```

2. **Google Analytics:**
   ```javascript
   // Track route changes
   ReactGA.pageview(window.location.pathname + window.location.search);
   ```

3. **Custom Events:**
   ```javascript
   // Track specific actions
   analytics.logEvent('view_food_truck', { foodTruckId: params.foodTruckId });
   ```

## Troubleshooting

### URL Doesn't Update

**Problem:** Navigation works but URL doesn't change.

**Solution:**
- Verify `linking` prop is passed to `NavigationContainer`
- Check browser console for linking errors
- Ensure screen names match exactly

### Deep Link Doesn't Work

**Problem:** Opening a URL directly doesn't work.

**Solution:**
- Check Vercel rewrites are configured
- Verify route parameters match
- Check if authentication is blocking access

### Parameters Not Passed

**Problem:** Screen loads but `route.params` is undefined.

**Solution:**
- Ensure parameter names match in linking config
- Use `navigation.navigate()` with params object
- Check component is accessing `route.params` correctly

## Migration Notes

### Existing Navigation Calls

All existing `navigation.navigate()` calls will continue to work without changes. The linking configuration automatically:
- Generates URLs from navigation calls
- Extracts parameters from URLs
- Updates browser history

### Backward Compatibility

✅ **Mobile Apps**: No impact on iOS/Android  
✅ **Existing Code**: No changes required to navigation calls  
✅ **Deep Links**: Works with existing mobile deep linking  
✅ **Web URLs**: New feature for web platform only  

## Next Steps

1. **Deploy to Vercel** with new routing configuration
2. **Test All Routes** in production
3. **Update Social Sharing** to use specific URLs
4. **Add Analytics** to track page views
5. **Consider Friendly Slugs** for better SEO (optional)

## Related Files

- `App.js` - Linking configuration
- `vercel.json` - Rewrite rules for SPA routing
- `public/sitemap.xml` - Updated with new URL structure
- `web/index.html` - SEO meta tags

## Resources

- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [React Navigation Configuring Links](https://reactnavigation.org/docs/configuring-links/)
- [Expo Linking](https://docs.expo.dev/guides/linking/)

---

**Implementation Date:** October 21, 2025  
**Status:** ✅ Implemented and Ready for Testing

