import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchDeliveryMethods } from '../lib/payment-service';

const DeliveryMethodSelector = ({ selectedDeliveryMethod, onDeliveryMethodSelect }) => {
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Hand It To Me');

  const categories = ['Hand It To Me', 'Leave at Location'];

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  const loadDeliveryMethods = async () => {
    try {
      setLoading(true);
      const methods = await fetchDeliveryMethods();
      setDeliveryMethods(methods);
      
      // Set default selection if none selected
      if (!selectedDeliveryMethod && methods.length > 0) {
        const defaultMethod = methods.find(method => method.category === 'Hand It To Me') || methods[0];
        onDeliveryMethodSelect(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading delivery methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodsForCategory = (category) => {
    return deliveryMethods.filter(method => method.category === category);
  };

  const renderCategorySlider = () => (
    <View style={styles.categorySlider}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.categoryButtonTextActive
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDeliveryMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.deliveryMethodItem,
        selectedDeliveryMethod?.id === method.id && styles.deliveryMethodItemSelected
      ]}
      onPress={() => onDeliveryMethodSelect(method)}
    >
      <View style={styles.deliveryMethodContent}>
        <View style={styles.deliveryMethodIcon}>
          <MaterialIcons 
            name={method.handItToMe ? "person" : "location-on"} 
            size={24} 
            color={selectedDeliveryMethod?.id === method.id ? "#FB9E12" : "#FECD15"} 
          />
        </View>
        
        <View style={styles.deliveryMethodDetails}>
          <Text style={[
            styles.deliveryMethodName,
            selectedDeliveryMethod?.id === method.id && styles.deliveryMethodNameSelected
          ]}>
            {method.name}
          </Text>
          <Text style={[
            styles.deliveryMethodDescription,
            selectedDeliveryMethod?.id === method.id && styles.deliveryMethodDescriptionSelected
          ]}>
            {method.handItToMe ? 'Hand delivery to recipient' : 'Leave at specified location'}
          </Text>
        </View>
        
        {selectedDeliveryMethod?.id === method.id && (
          <View style={styles.selectedIndicator}>
            <MaterialIcons name="check-circle" size={24} color="#FCFAD6" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FB9C12" size="large" />
        <Text style={styles.loadingText}>Loading delivery options...</Text>
      </View>
    );
  }

  const methodsForSelectedCategory = getMethodsForCategory(selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Slider */}
      {renderCategorySlider()}
      
      {/* Delivery Methods List */}
      <ScrollView style={styles.methodsList} showsVerticalScrollIndicator={false}>
        {methodsForSelectedCategory.map(renderDeliveryMethod)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo',
  },
  categorySlider: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#FB9C12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Cairo',
  },
  categoryButtonTextActive: {
    color: '#FCFAD6',
  },
  methodsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  deliveryMethodItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryMethodItemSelected: {
    backgroundColor: '#FB9C12',
    borderColor: '#FB9C12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  deliveryMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deliveryMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deliveryMethodDetails: {
    flex: 1,
  },
  deliveryMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  deliveryMethodNameSelected: {
    color: '#FCFAD6',
  },
  deliveryMethodDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
  },
  deliveryMethodDescriptionSelected: {
    color: '#FCFAD6',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
});

export default DeliveryMethodSelector;
