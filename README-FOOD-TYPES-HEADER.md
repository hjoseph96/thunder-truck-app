# FoodTypesHeader Component

A horizontally scrolling header component that displays food types with icons and titles, designed for the Thunder Truck app.

## Features

- **Horizontally Scrolling**: Smooth horizontal scroll with snap-to-interval behavior
- **Top and Bottom Borders**: Yellow top border and light gray bottom border matching app theme
- **Food Type Icons**: Displays icons from CDN URLs via GraphQL API
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Graceful error handling with retry functionality
- **Loading States**: Loading and empty state handling

## GraphQL Schema Integration

This component integrates with your backend GraphQL schema:

```graphql
type FoodType {
  id: ID!
  title: String!
  iconImageUrl: String
  coverImageUrl: String
  createdAt: ISO8601DateTime!
  updatedAt: ISO8601DateTime!
}

query FetchFoodTypes($page: Int) {
  fetchFoodTypes(page: $page) {
    id
    title
    iconImageUrl
    coverImageUrl
    createdAt
    updatedAt
  }
}
```

## Usage

### Basic Implementation

```jsx
import FoodTypesHeader from './components/FoodTypesHeader';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FoodTypesHeader />
      {/* Other content */}
    </View>
  );
}
```

### With Navigation

```jsx
import FoodTypesHeader from './components/FoodTypesHeader';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FoodTypesHeader navigation={navigation} />
      {/* Other content */}
    </View>
  );
}
```

## Configuration

### Environment Variables

Set your GraphQL endpoint in your environment:

```bash
EXPO_PUBLIC_GRAPHQL_ENDPOINT=https://your-api-endpoint.com/graphql
```

### API Service

The component uses the `food-types-service.js` file located in `lib/` directory. This service:

- Handles GraphQL queries
- Implements caching (5-minute cache duration)
- Provides error handling
- Supports pagination

## Styling

The component uses React Native StyleSheet with:

- **Colors**: Matches your app theme (#fecd15 yellow, #2D1E2F dark)
- **Shadows**: Subtle shadows for depth
- **Borders**: Top yellow border, bottom gray border
- **Typography**: Consistent font weights and sizes

## Customization

### Modifying Styles

Edit the `styles` object in `FoodTypesHeader.jsx`:

```jsx
const styles = StyleSheet.create({
  topBorder: {
    height: 2,
    backgroundColor: '#your-color', // Custom border color
  },
  // ... other styles
});
```

### Adding Navigation

Update the `handleFoodTypePress` function:

```jsx
const handleFoodTypePress = (foodType) => {
  navigation.navigate('FoodTypeDetail', { 
    foodTypeId: foodType.id,
    foodTypeTitle: foodType.title 
  });
};
```

## Dependencies

- React Native core components
- Expo StatusBar
- Custom GraphQL service

## Future Enhancements

- **Pagination**: Load more food types as user scrolls
- **Search**: Filter food types by name
- **Categories**: Group food types by category
- **Favorites**: Allow users to favorite food types
- **Analytics**: Track user interactions with food types

## Troubleshooting

### Common Issues

1. **Images not loading**: Check CDN URLs in your GraphQL response
2. **API errors**: Verify GraphQL endpoint and authentication
3. **Performance**: Ensure proper image optimization on CDN

### Debug Mode

Enable console logging by checking the browser console or React Native debugger for:

- API response data
- Error messages
- Loading states

## API Response Format

Expected GraphQL response structure:

```json
{
  "data": {
    "fetchFoodTypes": [
      {
        "id": "1",
        "title": "Pizza",
        "iconImageUrl": "https://cdn.example.com/icons/pizza-icon.png",
        "coverImageUrl": "https://cdn.example.com/covers/pizza-cover.jpg",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Performance Considerations

- **Image Caching**: CDN should implement proper caching headers
- **Lazy Loading**: Consider implementing lazy loading for large lists
- **Memory Management**: Images are automatically managed by React Native
- **Network Optimization**: GraphQL service includes built-in caching

## Security

- **CDN URLs**: Ensure CDN URLs are properly validated
- **GraphQL**: Implement proper authentication for API calls
- **Input Validation**: GraphQL schema provides type safety
