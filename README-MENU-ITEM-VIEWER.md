# MenuItemViewer Component

## Overview
The `MenuItemViewer` component is a comprehensive screen for displaying detailed information about a specific menu item, including its options, customization choices, and add-to-cart functionality.

## Features

### 🖼️ **Header Section**
- **Cover Image**: Displays the menu item's `imageUrl` as a full-width header image
- **Back Button**: Golden (#FECD15) circular X button positioned top-right for navigation
- **Responsive Design**: Header height adapts to 40% of screen height

### 📝 **Content Section**
- **Menu Item Name**: Large heading (28px) with Cairo font family
- **Price Display**: Bold price with "+" prefix in golden color (#fecd15)
- **Description**: Detailed description text in muted gray with proper line height

### ⚙️ **Option Groups System**
- **Dynamic Rendering**: Supports multiple option groups with different selection types
- **Required Tags**: Visual indicators that change from red "Required" to green "✓" when complete
- **Selection Limits**: Displays limit information (e.g., "Select up to 3 options")
- **Smart Selection Logic**: Handles both single-select (radio) and multi-select (checkbox) groups

### 🎯 **Option Selection**
- **Visual Feedback**: Interactive selectors with golden background when selected
- **Radio Buttons**: Single selection groups show circular indicators
- **Checkboxes**: Multi-selection groups show checkmark indicators
- **Option Images**: Right-aligned option images (60x60px) when available
- **Price Display**: Each option shows its additional cost with "+" prefix

### 🛒 **Add to Cart**
- **Call-to-Action**: Prominent golden button with black text
- **Professional Styling**: Rounded corners, shadows, and proper spacing
- **Responsive Design**: Adapts to different screen sizes

## Component Structure

### **Props**
```javascript
{
  navigation: NavigationProp,  // React Navigation object
  route: RouteProp             // Route containing menuItem parameter
}
```

### **Route Parameters**
```javascript
{
  menuItem: {
    id: string,
    name: string,
    description: string,
    price: number,
    imageUrl: string,
    optionGroups?: OptionGroup[]
  }
}
```

### **Option Group Structure**
```javascript
{
  id: string,
  name: string,
  limit: number,           // Selection limit (1 for single-select)
  options: Option[]
}

interface Option {
  id: string,
  name: string,
  price: number,
  imageUrl?: string
}
```

## State Management

### **Selected Options State**
```javascript
const [selectedOptions, setSelectedOptions] = useState({});
// Structure: { optionGroupId: [optionId1, optionId2, ...] }
```

### **Key Functions**
- `handleOptionSelect()`: Manages option selection logic
- `isOptionSelected()`: Checks if an option is currently selected
- `isOptionGroupComplete()`: Determines if selection limit is reached

## Styling & Design

### **Color Palette**
- **Primary**: #FECD15 (Golden Yellow)
- **Text Primary**: #132a13 (Dark Green)
- **Text Secondary**: #666 (Muted Gray)
- **Background**: #f5f5f5 (Light Gray)
- **Required Tag**: #ff6b6b (Red) → #51cf66 (Green when complete)

### **Typography**
- **Font Family**: Cairo (Google Fonts)
- **Headings**: Bold weights for hierarchy
- **Body Text**: Regular weights for readability
- **Option Text**: Bold for names, semi-bold for prices

### **Layout & Spacing**
- **Container Padding**: 20px standard spacing
- **Card Spacing**: 16px border radius, 20px internal padding
- **Option Spacing**: 12px vertical padding between options
- **Button Spacing**: 16px vertical, 32px horizontal padding

## Navigation Integration

### **From MenuItemComponent**
```javascript
// In MenuItemComponent
const handlePress = () => {
  if (navigation && menuItem) {
    navigation.navigate('MenuItemViewer', { menuItem });
  }
};
```

### **Navigation Stack**
```javascript
// In App.js
<Stack.Screen
  name="MenuItemViewer"
  component={MenuItemViewer}
  options={{ title: 'Menu Item Viewer' }}
/>
```

## Mock Data Structure

### **Current Implementation**
Since the GraphQL schema doesn't yet include `OptionGroup` and `Option` types, the component includes mock data for testing:

```javascript
const mockOptionGroups = [
  {
    id: '1',
    name: 'Size',
    limit: 1,  // Single select
    options: [
      { id: '1-1', name: 'Small', price: 0.00 },
      { id: '1-2', name: 'Medium', price: 2.00 },
      { id: '1-3', name: 'Large', price: 4.00 }
    ]
  },
  {
    id: '2',
    name: 'Toppings',
    limit: 3,  // Multi-select
    options: [
      { id: '2-1', name: 'Extra Cheese', price: 1.50 },
      { id: '2-2', name: 'Bacon', price: 2.50 },
      { id: '2-3', name: 'Mushrooms', price: 1.00 },
      { id: '2-4', name: 'Pepperoni', price: 2.00 }
    ]
  }
];
```

## Future Enhancements

### **Schema Integration**
- Replace mock data with actual GraphQL queries
- Add `OptionGroup` and `Option` types to schema
- Implement real-time option availability

### **Advanced Features**
- **Option Dependencies**: Conditional option availability
- **Price Calculation**: Real-time total price updates
- **Allergen Information**: Dietary restriction indicators
- **Nutritional Data**: Calorie and macro information
- **Customization Notes**: Special instruction fields

### **User Experience**
- **Option Search**: Filter options by name or category
- **Favorites**: Save frequently selected combinations
- **Quick Add**: One-tap common selections
- **Share Options**: Social sharing of customizations

## Usage Examples

### **Basic Implementation**
```javascript
// Navigate from any component
navigation.navigate('MenuItemViewer', { 
  menuItem: {
    id: '123',
    name: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella pizza',
    price: 12.99,
    imageUrl: 'https://example.com/pizza.jpg'
  }
});
```

### **With Option Groups**
```javascript
const menuItem = {
  id: '123',
  name: 'Custom Burger',
  description: 'Build your perfect burger',
  price: 8.99,
  imageUrl: 'https://example.com/burger.jpg',
  optionGroups: [
    {
      id: 'size',
      name: 'Size',
      limit: 1,
      options: [
        { id: 'small', name: 'Small', price: 0 },
        { id: 'large', name: 'Large', price: 2.50 }
      ]
    }
  ]
};
```

## Error Handling

### **Missing Data**
- **No Menu Item**: Shows error message with retry option
- **Missing Image**: Displays placeholder image
- **Missing Options**: Gracefully handles undefined optionGroups

### **Loading States**
- **Image Loading**: Skeleton loaders for option images
- **Data Fetching**: Loading indicators for dynamic content
- **Error Recovery**: Retry mechanisms for failed operations

## Performance Considerations

### **Optimization Techniques**
- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Option groups load as needed
- **Image Caching**: Efficient image loading and storage
- **State Updates**: Batched state updates for better performance

### **Memory Management**
- **Cleanup**: Proper cleanup of animations and timers
- **State Reset**: Clear selections when navigating away
- **Image Optimization**: Proper image sizing and compression

## Testing & Debugging

### **Test Scenarios**
- **Option Selection**: Single vs. multi-select behavior
- **Limit Enforcement**: Maximum selection validation
- **Navigation**: Back button and navigation flow
- **Data Display**: Various menu item configurations

### **Debug Features**
- **Console Logging**: Option selection tracking
- **State Inspection**: Selected options monitoring
- **Error Boundaries**: Graceful error handling
- **Performance Metrics**: Render time monitoring

## Accessibility

### **Screen Reader Support**
- **Semantic Labels**: Proper accessibility labels for options
- **Focus Management**: Logical tab order through options
- **Voice Commands**: Support for voice navigation

### **Visual Accessibility**
- **High Contrast**: Clear visual hierarchy
- **Touch Targets**: Adequate button sizes (44x44px minimum)
- **Color Independence**: Information not conveyed by color alone

## Browser Compatibility

### **Web Platform**
- **React Native Web**: Full compatibility
- **CSS Features**: Modern CSS with fallbacks
- **Touch Events**: Touch and mouse event support
- **Responsive Design**: Mobile-first responsive layout

### **Mobile Platforms**
- **iOS**: Native performance and animations
- **Android**: Material Design compliance
- **Cross-Platform**: Consistent experience across devices

---

## Summary

The `MenuItemViewer` component provides a comprehensive, user-friendly interface for menu item customization and ordering. With its intuitive option selection system, professional styling, and robust state management, it creates an engaging user experience that encourages customization and increases order value.

The component is designed to be easily integrated with the existing navigation system and can be enhanced with real GraphQL data once the schema is updated to include option groups and options.
