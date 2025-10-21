# URL Routing Implementation Summary

## ✅ Problem Solved

**Issue:** URLs showed "undefined" in path parameters because components were passing full objects instead of IDs.

**Solution:** Updated navigation calls to pass both IDs (for URL routing) and full objects (for immediate data access), with components handling both scenarios.

## Changes Made

### 1. App.js - Deep Linking Configuration

Added URL routing configuration (web-only):

```javascript
const linking = Platform.OS === 'web' ? {
  prefixes: [
    'https://web.thundertruck.app', 
    'http://localhost:8081',
    'http://localhost:19006'  // Expo web dev server
  ],
  config: {
    screens: {
      ExplorerHome: '',                                    // Root: /
      MapPage: 'map',                                      // /map
      FoodTypeViewer: 'food-types/:foodTypeId',            // /food-types/123
      FoodTruckViewer: 'vendor/:foodTruckId',              // /vendor/456
      MenuItemViewer: 'vendor/:foodTruckId/item/:menuItemId', // /vendor/456/item/789
      CheckoutForm: 'cart',                                // /cart
      PaymentScreen: 'cart/pay',                           // /cart/pay
      OrderDetail: 'track/:orderId',                       // /track/order-123
      // ... other routes
    },
  },
} : undefined;
```

### 2. ExplorerHome.jsx - Updated Navigation

**Before:**
```javascript
navigation.navigate('FoodTruckViewer', { foodTruck });
```

**After:**
```javascript
navigation.navigate('FoodTruckViewer', { 
  foodTruckId: foodTruck.id,  // ✅ For URL routing
  foodTruck: foodTruck        // ✅ For immediate data access
});
```

### 3. FoodTypesHeader.jsx - Updated Navigation

**Before:**
```javascript
navigation.navigate('FoodTypeViewer', { foodType });
```

**After:**
```javascript
navigation.navigate('FoodTypeViewer', { 
  foodTypeId: foodType.id,    // ✅ For URL routing
  foodType: foodType          // ✅ For immediate data access
});
```

### 4. FoodTypeViewer.jsx - Handle Both Object and ID

**Added:**
```javascript
const { foodType: foodTypeParam, foodTypeId } = route.params;
const [foodType, setFoodType] = useState(foodTypeParam || null);

// If we only have foodTypeId (from URL), create placeholder
useEffect(() => {
  if (!foodType && foodTypeId) {
    setFoodType({ 
      id: foodTypeId, 
      title: 'Food Type'  // Placeholder until data loads
    });
  }
}, [foodTypeId]);
```

**Updated Navigation:**
```javascript
navigation.navigate('FoodTruckViewer', { 
  foodTruckId: foodTruck.id,
  foodTruck: foodTruck
});
```

### 5. FoodTruckViewer.jsx - Use ID from Either Source

**Added:**
```javascript
const { foodTruck: initialFoodTruck, foodTruckId } = route.params;
const truckId = initialFoodTruck?.id || foodTruckId;  // ✅ Works with both!
```

**Updated All Data Fetching:**
```javascript
// All functions now use truckId instead of initialFoodTruck.id
loadFoodTruckData() → uses truckId
loadCartData() → uses truckId
handleQuantityChange() → uses truckId
```

### 6. MenuItemViewer.jsx - Already Compatible

✅ Already uses `menuItemId` and `foodTruckId` from route.params  
✅ No changes needed - works with URL routing out of the box

## URL Mapping

| Navigation Call | Generated URL | Parameters Passed |
|----------------|---------------|-------------------|
| Navigate to home | `/` | None |
| Navigate to map | `/map` | None |
| Navigate to food type | `/food-types/123` | `foodTypeId: '123'` |
| Navigate to vendor | `/vendor/456` | `foodTruckId: '456'` |
| Navigate to menu item | `/vendor/456/item/789` | `foodTruckId: '456'`, `menuItemId: '789'` |
| Navigate to cart | `/cart` | None |
| Navigate to payment | `/cart/pay` | None |
| Navigate to order | `/track/order-123` | `orderId: 'order-123'` |

## How It Works

### Scenario 1: Navigation from App (Has Full Object)

```javascript
// User clicks on a food truck
handleFoodTruckPress(foodTruck)

// Navigation call passes both ID and object
navigation.navigate('FoodTruckViewer', { 
  foodTruckId: foodTruck.id,  // Used for URL
  foodTruck: foodTruck        // Used for immediate render
});

// URL updates to:
https://web.thundertruck.app/vendor/456

// Component receives both params:
route.params.foodTruckId = '456'
route.params.foodTruck = { id: '456', name: '...', ... }

// Component uses truckId to fetch fresh data
const truckId = initialFoodTruck?.id || foodTruckId;  // = '456'
```

### Scenario 2: Direct URL Access (Only Has ID)

```javascript
// User opens URL directly
https://web.thundertruck.app/vendor/456

// React Navigation parses URL and extracts params
route.params.foodTruckId = '456'
route.params.foodTruck = undefined

// Component handles missing object
const truckId = initialFoodTruck?.id || foodTruckId;  // = '456'

// Fetches data using ID
const data = await getFoodTruckWithCache(truckId);
setFoodTruck(data);

// Renders normally after data loads
```

## Benefits

✅ **Clean URLs**: `/vendor/456` instead of complex state parameters  
✅ **Bookmarkable**: Users can bookmark specific pages  
✅ **Shareable**: Direct links work correctly  
✅ **Browser Navigation**: Back/forward buttons work  
✅ **Deep Linking**: Open specific screens from external links  
✅ **SEO Friendly**: Search engines can index individual pages  
✅ **No Breaking Changes**: Existing navigation calls still work  
✅ **Backward Compatible**: Works on web and mobile  

## Testing

### Test Navigation (In-App)

```javascript
// Navigate from ExplorerHome to a food truck
Click on food truck → URL changes to /vendor/456 ✅

// Navigate to menu item
Click on menu item → URL changes to /vendor/456/item/789 ✅

// Navigate to cart
Click cart → URL changes to /cart ✅

// Browser back button
Press back → Returns to previous screen, URL updates ✅
```

### Test Deep Links (Direct URLs)

```bash
# Start dev server
npm run web

# Test these URLs in browser:
http://localhost:8081/                    # Explorer home
http://localhost:8081/map                 # Map page
http://localhost:8081/vendor/456          # Food truck (if ID exists)
http://localhost:8081/cart                # Cart
http://localhost:8081/orders              # Orders
```

## Files Modified

1. ✅ `App.js` - Added linking configuration (web-only)
2. ✅ `components/ExplorerHome.jsx` - Updated navigation to pass IDs
3. ✅ `components/FoodTypesHeader.jsx` - Updated navigation to pass IDs
4. ✅ `components/FoodTypeViewer.jsx` - Handle both object and ID, updated navigation
5. ✅ `components/FoodTruckViewer.jsx` - Use ID from either source
6. ✅ `components/MenuItemViewer.jsx` - Already compatible (no changes)

## Migration Notes

### Dual Parameter Pattern

All navigation calls now follow this pattern:

```javascript
navigation.navigate('ScreenName', { 
  objectId: object.id,     // For URL generation
  object: object           // For immediate data access (optional)
});
```

### Component Pattern

Components handle both scenarios:

```javascript
const { object: initialObject, objectId } = route.params;
const id = initialObject?.id || objectId;  // Get ID from either source

// Use id to fetch data
```

## Future Enhancements

### 1. Friendly Slugs

Replace IDs with human-readable slugs:

```
Current: /vendor/456
Future:  /vendor/joes-taco-truck
```

### 2. URL Serialization

For complex params, implement custom serializers:

```javascript
const linking = {
  config: {
    screens: {
      FoodTruckViewer: {
        path: 'vendor/:foodTruckId',
        parse: {
          foodTruckId: (id) => id,
        },
        stringify: {
          foodTruckId: (id) => id,
        },
      },
    },
  },
};
```

### 3. State Preservation

Preserve scroll position and filters in URL:

```
/vendor/456?sort=price&filter=vegan
```

## Known Limitations

1. **Initial Load**: When accessing URL directly, there's a brief loading state while data fetches
2. **404 Handling**: Invalid IDs in URLs will show error state (need to add 404 page)
3. **Query Params**: Additional filters/state not yet in URL (can be added)

## Troubleshooting

### URL Shows "undefined"

**Cause:** Object ID is missing or undefined  
**Fix:** Ensure all navigation calls include the ID parameter

```javascript
// ❌ Wrong
navigation.navigate('FoodTruckViewer', { foodTruck });

// ✅ Correct
navigation.navigate('FoodTruckViewer', { 
  foodTruckId: foodTruck.id,
  foodTruck: foodTruck
});
```

### Deep Link Doesn't Load Data

**Cause:** Component expects object but only has ID  
**Fix:** Component should fetch data by ID if object is missing

```javascript
const id = initialObject?.id || objectId;
useEffect(() => {
  if (id) {
    fetchData(id);
  }
}, [id]);
```

### Browser Back Button Doesn't Work

**Cause:** Linking not configured in NavigationContainer  
**Fix:** Verify `linking` prop is passed to `NavigationContainer`

## Next Steps

1. ✅ Navigation calls updated to pass IDs
2. ✅ Components updated to handle both object and ID
3. ✅ Linking configuration added to App.js
4. 🔄 Test in development (`npm run web`)
5. 🔄 Test in production (after deployment)
6. 🔄 Add 404 page for invalid IDs
7. 🔄 Consider implementing friendly slugs

---

**Status:** ✅ Implemented and Ready for Testing  
**Date:** October 21, 2025

