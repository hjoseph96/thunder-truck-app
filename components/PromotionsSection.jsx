import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PromotionsSection = () => {
  // Mock promotion data - replace with actual data from your API
  const promotion = {
    title: "20% off your first order",
    description: "Save on your first ThunderTruck order"
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.promotionButton}>
        <View style={styles.promotionContent}>
          <MaterialIcons 
            name="local-offer" 
            size={24} 
            color="#FECD15" 
            style={styles.couponIcon} 
          />
          <View style={styles.promotionDetails}>
            <Text style={styles.promotionTitle}>Promotions</Text>
            <Text style={styles.promotionSubtext}>{promotion.title}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  promotionButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponIcon: {
    marginRight: 12,
  },
  promotionDetails: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 18,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  promotionSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: 'forestgreen',
    borderRadius: 18,
  },
});

export default PromotionsSection;
