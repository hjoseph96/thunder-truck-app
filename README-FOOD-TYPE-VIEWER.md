# FoodTypeViewer Component

A comprehensive component that displays a FoodType with its cover image and associated FoodTrucks in a 2x2 grid layout with **infinite scrolling** support.

## Features

- **Cover Image Display**: Shows the FoodType's cover image from `coverImageUrl`
- **Food Trucks Grid**: 2x2 grid of FoodTrucks associated with the selected FoodType
- **Infinite Scrolling**: Automatically loads more food trucks as user scrolls
- **Location-based Search**: Finds food trucks within 30 miles of user's location
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Graceful error handling with retry functionality
- **Loading States**: Proper loading indicators for better UX
- **Total Count Display**: Shows total number of available food trucks

## GraphQL Integration

This component integrates with your updated backend GraphQL schema that returns `FoodTruckResult`:

```graphql
# Uses fetchFoodTrucks query with foodTypeId filter
query FetchNearbyFoodTrucks($foodTypeId: ID, $nearbyLat: Float, $nearbyLng: Float) {
  fetchFoodTrucks(
    foodTypeId: $foodTypeId
    nearbyLat: $nearbyLat
    nearbyLng: $nearbyLng
    nearbyRadius: 30
    nearbyUnit: "miles"
  ) {
    foodTrucks {
      id
      name
      description
      coverImageUrl
      deliveryFee
      isSubscriber
      # ... other fields
    }
    totalCount
  }
}
```

## Infinite Scrolling Implementation

### How It Works

1. **Initial Load**: Loads first page of food trucks (12 per page)
2. **Scroll Detection**: Monitors scroll position using `onEndReached`
3. **Automatic Loading**: Triggers `loadMoreFoodTrucks` when near end
4. **Data Appending**: New trucks are appended to existing list
5. **Pagination Control**: Tracks current page and determines if more pages exist

### Key Components

- **`currentPage`**: Tracks current page number
- **`loadingMore`**: Shows loading state for additional pages
- **`hasMorePages`**: Determines if more data is available
- **`totalCount`**: Total number of food trucks from API
- **`onEndReached`**: FlatList prop that triggers pagination
- **`onEndReachedThreshold`**: Distance from end to trigger loading (0.1 = 10%)

### Performance Features

- **FlatList**: Uses React Native's optimized list component
- **2-Column Grid**: Efficient rendering with `numColumns={2}`
- **Lazy Loading**: Only loads visible items
- **Memory Management**: Appends data without recreating entire list

## Usage

### Navigation

```jsx
// From FoodTypesHeader component
navigation.navigate('FoodTypeViewer', { 
  foodType: {
    id: '1',
    title: 'Pizza',
    coverImageUrl: 'https://cdn.example.com/covers/pizza.jpg'
  }
});
```

### Component Structure

```jsx
<FoodTypeViewer 
  navigation={navigation}
  route={{
    params: {
      foodType: {
        id: '1',
        title: 'Pizza',
        coverImageUrl: 'https://cdn.example.com/covers/pizza.jpg'
      }
    }
  }}
/>
```

## Component Layout

### 1. Header Section
- **Back Button**: Returns to previous screen
- **Title**: FoodType name (e.g., "Pizza")
- **Dark Theme**: Matches app's design system

### 2. Cover Image Section
- **Full-width Image**: Displays `foodType.coverImageUrl`
- **Overlay Text**: FoodType title overlaid on image
- **Fallback**: Placeholder image if no cover image available

### 3. Food Trucks Section
- **Section Header**: Shows total count of available trucks
- **Infinite Scroll Grid**: 2x2 layout with automatic pagination
- **Loading Indicators**: Shows loading state for additional pages
- **Card Design**: Each truck displayed in a styled card with:
  - Cover image
  - Name
  - Description
  - Delivery fee
  - Premium subscriber badge (if applicable)

## Data Flow

### 1. Component Mount
- Receives `foodType` from route params
- Automatically loads first page of associated food trucks

### 2. Initial API Call
- Calls `fetchNearbyFoodTrucks` with:
  - `foodTypeId`: Filters trucks by food type
  - `nearbyLat/lng`: User's location (currently mock data)
  - `radius`: 30 miles search radius
  - `page`: 1 (first page)

### 3. Infinite Scroll
- User scrolls near end of list
- `onEndReached` triggers `loadMoreFoodTrucks`
- Next page is fetched and appended to existing list
- Process continues until all pages are loaded

### 4. Data Processing
- Handles new schema structure with `foodTrucks` array and `totalCount`
- Appends new data to existing list for smooth UX
- Updates pagination state for next load

## Styling

### Color Scheme
- **Primary**: #2D1E2F (Dark theme)
- **Accent**: #fecd15 (Yellow)
- **Background**: #ffffff (White)
- **Text**: Various grays for hierarchy

### Layout
- **Cover Image**: 250px height, full width
- **Grid Cards**: 48% width each (2 per row)
- **Responsive**: Adapts to different screen sizes
- **Shadows**: Subtle elevation for cards
- **Infinite Scroll**: Smooth loading with footer indicators

## Error Handling

### Loading States
- **Initial Load**: Shows "Loading food trucks..." message
- **Infinite Scroll**: Shows "Loading more food trucks..." in footer
- **Centered Indicators**: Proper loading feedback

### Error States
- **API Errors**: Displays error message with retry button
- **Network Issues**: Graceful fallback with cached data
- **Empty Results**: Helpful message explaining the situation

### Retry Mechanism
- **Retry Button**: Allows users to retry failed requests
- **State Reset**: Clears error state and reloads data
- **User Feedback**: Clear indication of what went wrong

## Future Enhancements

### Location Services
- **Real GPS**: Replace mock coordinates with actual user location
- **Location Permission**: Request and handle location access
- **Dynamic Radius**: Allow users to adjust search radius

### Advanced Pagination
- **Page Size Control**: Allow users to choose items per page
- **Jump to Page**: Direct navigation to specific pages
- **Search Filters**: Additional filtering options

### Interactive Features
- **Favorites**: Allow users to favorite food trucks
- **Reviews**: Display user ratings and reviews
- **Ordering**: Direct integration with food truck ordering
- **Pull to Refresh**: Manual refresh functionality

## Dependencies

- **React Native**: Core components and hooks
- **Expo StatusBar**: Status bar management
- **Food Trucks Service**: Updated API integration
- **Navigation**: React Navigation for routing
- **FlatList**: Optimized list rendering with infinite scroll

## API Requirements

### Backend Endpoints
- **GraphQL**: `fetchFoodTrucks` query with new schema
- **Authentication**: JWT token in Authorization header
- **Filtering**: Support for `foodTypeId` parameter
- **Location**: Support for nearby search parameters
- **Pagination**: Support for page-based pagination

### Response Format
```json
{
  "data": {
    "fetchFoodTrucks": {
      "foodTrucks": [
        {
          "id": "1",
          "name": "Pizza Palace",
          "description": "Authentic Italian pizza",
          "coverImageUrl": "https://cdn.example.com/trucks/pizza-palace.jpg",
          "deliveryFee": 3.99,
          "isSubscriber": true
        }
      ],
      "totalCount": 25
    }
  }
}
```

## Performance Considerations

- **Image Optimization**: CDN images should be properly sized
- **Caching**: Food trucks data is cached for 5 minutes
- **Lazy Loading**: Images load as needed
- **Infinite Scroll**: Efficient pagination without full page reloads
- **Memory Management**: Appends data without memory leaks
- **Error Boundaries**: Graceful degradation on failures

## Security

- **JWT Authentication**: All API calls include Authorization header
- **Input Validation**: FoodType data validated before use
- **Secure Storage**: Tokens stored securely in AsyncStorage
- **Error Logging**: Sensitive data not logged to console
- **Rate Limiting**: Respects API rate limits for pagination
