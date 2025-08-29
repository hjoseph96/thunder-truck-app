# FoodTruckViewer Component

A comprehensive component that displays detailed information about a specific food truck, including its menu organized by categories and featured items.

## Features

- **Header with Cover Image**: Full-width cover image with overlay information
- **Logo Circle**: Circular logo image positioned in top-right corner
- **Food Truck Information**: Name, delivery fee, and premium subscriber status
- **Description Section**: About section with food truck description
- **Featured Items**: Horizontal scrollable section highlighting featured menu items
- **Full Menu**: Organized by categories with grid layout
- **Interactive Menu Items**: Touchable menu items with images and details

## Component Layout

### 1. Header Section
- **Cover Image**: Full-width background image (300px height)
- **Logo Circle**: 80x80 circular logo positioned at top-right
- **Back Button**: Navigation back button with white text
- **Food Truck Info**: Name, delivery fee, and premium badge overlay

### 2. Description Section
- **About Title**: "About" section header
- **Description Text**: Food truck description with fallback text

### 3. Featured Items Section
- **Section Title**: "Featured Items" header
- **Horizontal Scroll**: Scrollable list of featured menu items
- **Featured Cards**: Large cards (280px width) with images and details
- **Item Information**: Name, description, price, and category

### 4. Full Menu Section
- **Section Title**: "Full Menu" header
- **Categories**: Organized by menu categories
- **Category Headers**: Styled headers with yellow underlines
- **Menu Items Grid**: 2-column grid layout for menu items
- **Item Cards**: Compact cards with images, names, descriptions, and prices

## Data Structure

### Food Truck Object
```javascript
{
  id: '1',
  name: 'Pizza Palace',
  description: 'Authentic Italian pizza',
  coverImageUrl: 'https://cdn.example.com/truck-cover.jpg',
  deliveryFee: 3.99,
  isSubscriber: true
}
```

### Menu Structure
```javascript
{
  id: '1',
  name: 'Pizza Palace',
  categories: [
    {
      id: '1',
      name: 'Appetizers',
      menuItems: [
        {
          id: '1',
          name: 'Garlic Bread',
          description: 'Fresh baked garlic bread with herbs',
          price: 4.99,
          imageUrl: 'https://cdn.example.com/garlic-bread.jpg',
          isFeatured: true
        }
      ]
    }
  ]
}
```

## Navigation

### From FoodTypeViewer
```javascript
navigation.navigate('FoodTruckViewer', { 
  foodTruck: {
    id: '1',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizza',
    coverImageUrl: 'https://cdn.example.com/truck-cover.jpg',
    deliveryFee: 3.99,
    isSubscriber: true
  }
});
```

### Component Usage
```jsx
<FoodTruckViewer 
  navigation={navigation}
  route={{
    params: {
      foodTruck: {
        id: '1',
        name: 'Pizza Palace',
        description: 'Authentic Italian pizza',
        coverImageUrl: 'https://cdn.example.com/truck-cover.jpg',
        deliveryFee: 3.99,
        isSubscriber: true
      }
    }
  }}
/>
```

## Styling

### Color Scheme
- **Primary**: #2D1E2F (Dark theme)
- **Accent**: #fecd15 (Yellow)
- **Background**: #ffffff (White)
- **Text**: Various grays for hierarchy
- **Overlays**: Semi-transparent black for header overlay

### Layout Dimensions
- **Header Height**: 300px
- **Logo Size**: 80x80px (circular)
- **Featured Item Width**: 280px
- **Menu Item Width**: 48% (2-column grid)
- **Image Heights**: 160px (featured), 120px (menu items)

### Shadows and Elevation
- **Logo Container**: Subtle shadow with elevation 5
- **Menu Cards**: Light shadows for depth
- **Featured Items**: Enhanced shadows for prominence

## Interactive Features

### Menu Item Selection
- **Touchable Cards**: All menu items are pressable
- **Visual Feedback**: Active opacity changes on press
- **Alert Display**: Shows selected item details (placeholder for future navigation)

### Navigation
- **Back Button**: Returns to previous screen
- **Status Bar**: Light theme for better contrast with dark header

## Future Enhancements

### GraphQL Integration
- **Menu Query**: Replace mock data with actual GraphQL menu query
- **Real-time Updates**: Live menu updates from backend
- **Image Loading**: Proper CDN image handling with error states

### Advanced Features
- **Add to Cart**: Shopping cart functionality
- **Favorites**: User favorite menu items
- **Reviews**: User ratings and reviews
- **Ordering**: Direct food ordering integration

### UI Improvements
- **Pull to Refresh**: Manual refresh functionality
- **Search**: Menu item search within food truck
- **Filtering**: Filter by category, price, or dietary restrictions
- **Animations**: Smooth transitions and micro-interactions

## Dependencies

- **React Native**: Core components and hooks
- **Expo StatusBar**: Status bar management
- **Navigation**: React Navigation for routing
- **Dimensions**: Screen size detection for responsive design

## Mock Data

Currently uses mock menu data for development and testing:

- **Appetizers**: Garlic Bread, Bruschetta
- **Main Dishes**: Margherita Pizza, Pasta Carbonara
- **Featured Items**: Garlic Bread, Margherita Pizza
- **Placeholder Images**: Using placeholder.com for development

## Performance Considerations

- **Image Optimization**: CDN images should be properly sized
- **Lazy Loading**: Images load as needed
- **Memory Management**: Efficient rendering of large menus
- **Scroll Performance**: Optimized horizontal and vertical scrolling

## Accessibility

- **Touch Targets**: Adequate size for touch interaction
- **Text Contrast**: High contrast text on overlays
- **Screen Reader**: Proper text labels and descriptions
- **Navigation**: Clear back button and navigation flow
