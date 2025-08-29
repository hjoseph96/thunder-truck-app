import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MenuItemViewer({ navigation, route }) {
  const { menuItem } = route.params;
  const [selectedOptions, setSelectedOptions] = useState({});

  // Mock data structure for testing - remove when schema is updated
  const mockOptionGroups = menuItem.optionGroups || [
    {
      id: '1',
      name: 'Size',
      limit: 1,
      options: [
        { id: '1-1', name: 'Small', price: 0.00, imageUrl: null },
        { id: '1-2', name: 'Medium', price: 2.00, imageUrl: null },
        { id: '1-3', name: 'Large', price: 4.00, imageUrl: null },
      ]
    },
    {
      id: '2',
      name: 'Toppings',
      limit: 3,
      options: [
        { id: '2-1', name: 'Extra Cheese', price: 1.50, imageUrl: null },
        { id: '2-2', name: 'Bacon', price: 2.50, imageUrl: null },
        { id: '2-3', name: 'Mushrooms', price: 1.00, imageUrl: null },
        { id: '2-4', name: 'Pepperoni', price: 2.00, imageUrl: null },
      ]
    }
  ];

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleOptionSelect = (optionGroupId, optionId, isSingleSelect = false) => {
    setSelectedOptions(prev => {
      const newSelection = { ...prev };
      
      if (isSingleSelect) {
        // For single select, replace the entire group selection
        newSelection[optionGroupId] = [optionId];
      } else {
        // For multi-select, toggle the option
        if (!newSelection[optionGroupId]) {
          newSelection[optionGroupId] = [];
        }
        
        const currentSelection = newSelection[optionGroupId];
        const optionIndex = currentSelection.indexOf(optionId);
        
        if (optionIndex > -1) {
          currentSelection.splice(optionIndex, 1);
        } else {
          currentSelection.push(optionId);
        }
      }
      
      return newSelection;
    });
  };

  const isOptionSelected = (optionGroupId, optionId) => {
    return selectedOptions[optionGroupId]?.includes(optionId) || false;
  };

  const isOptionGroupComplete = (optionGroup) => {
    if (!optionGroup.limit) return true;
    const selectedCount = selectedOptions[optionGroup.id]?.length || 0;
    return selectedCount >= optionGroup.limit;
  };

  const renderOptionGroup = (optionGroup) => {
    const isComplete = isOptionGroupComplete(optionGroup);
    const isSingleSelect = optionGroup.limit === 1;

    return (
      <View key={optionGroup.id} style={styles.optionGroup}>
        <View style={styles.optionGroupHeader}>
          <Text style={styles.optionGroupTitle}>{optionGroup.name}</Text>
          <View style={[
            styles.requiredTag,
            isComplete && styles.requiredTagComplete
          ]}>
            <Text style={[
              styles.requiredTagText,
              isComplete && styles.requiredTagTextComplete
            ]}>
              {isComplete ? '✓' : 'Required'}
            </Text>
          </View>
        </View>
        
        {optionGroup.limit && (
          <Text style={styles.optionGroupLimit}>
            Select up to {optionGroup.limit} {optionGroup.limit === 1 ? 'option' : 'options'}
          </Text>
        )}

        <View style={styles.optionsList}>
          {optionGroup.options?.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionPrice}>+${option.price}</Text>
                </View>
                
                {option.imageUrl && (
                  <Image
                    source={{ uri: option.imageUrl }}
                    style={styles.optionImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.optionSelector,
                  isOptionSelected(optionGroup.id, option.id) && styles.optionSelectorSelected
                ]}
                onPress={() => handleOptionSelect(optionGroup.id, option.id, isSingleSelect)}
              >
                {isOptionSelected(optionGroup.id, option.id) && (
                  <View style={styles.optionSelectorInner}>
                    {isSingleSelect ? (
                      <View style={styles.radioButtonSelected} />
                    ) : (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!menuItem) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No menu item data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Menu Item Image */}
      <View style={styles.header}>
        <Image
          source={menuItem.imageUrl 
            ? { uri: menuItem.imageUrl }
            : require('../assets/images/blank-menu-item.png')
          }
          style={styles.headerImage}
          resizeMode="cover"
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.menuItemName}>{menuItem.name}</Text>
          <Text style={styles.menuItemPrice}>+${menuItem.price}</Text>
          {menuItem.description && (
            <Text style={styles.menuItemDescription}>{menuItem.description}</Text>
          )}
        </View>

        {/* Option Groups */}
        {mockOptionGroups.map((optionGroup) => renderOptionGroup(optionGroup))}
        
        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: screenHeight * 0.4,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    borderBottomWidth: 5,
    borderBottomColor: '#e39219',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FECD15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  backButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 0,
    zIndex: 2,
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  menuItemPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fecd15',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  menuItemDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    fontFamily: 'Cairo',
  },
  optionGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    fontFamily: 'Cairo',
    flex: 1,
  },
  requiredTag: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  requiredTagComplete: {
    backgroundColor: '#51cf66',
  },
  requiredTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredTagTextComplete: {
    color: 'white',
  },
  optionGroupLimit: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    fontFamily: 'Cairo',
    fontStyle: 'italic',
  },
  optionsList: {
    // Options list container
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  optionPrice: {
    fontSize: 14,
    color: '#fecd15',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  optionSelector: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionSelectorSelected: {
    backgroundColor: '#fecd15',
    borderColor: '#fecd15',
  },
  optionSelectorInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#fecd15',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
