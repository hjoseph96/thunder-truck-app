import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';

const PromotionsSection = () => {
  // Mock promotion data - replace with actual data from your API
  const promotion = {
    title: "20% off your first order",
    description: "Save on your first ThunderTruck order"
  };

  // Promotion SVG content from assets/images/promotions.svg (with inline colors)
  const promotionSvg = `<svg width="800px" height="800px" viewBox="0 0 120 120" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
      <path fill="#C44151" d="M102.5,55.6L89.1,40.3c-0.7-0.8-1.8-1.3-2.9-1.3H20.6c-2.6,0-4.7,2.1-4.7,4.7v32.4c0,2.6,2.1,4.7,4.7,4.7h65.6   c1.1,0,2.2-0.5,2.9-1.3l13.4-15.3C104.7,61.9,104.7,58.1,102.5,55.6z M91.4,64.2c-2.3,0-4.2-1.9-4.2-4.2s1.9-4.2,4.2-4.2   s4.2,1.9,4.2,4.2S93.7,64.2,91.4,64.2z"/>
      <g opacity="0.1">
        <path d="M23.7,80.4c-2.6,0-4.7-2.1-4.7-4.7V43.2c0-1.8,1-3.3,2.5-4.1h-0.8c-2.6,0-4.7,2.1-4.7,4.7v32.4c0,2.6,2.1,4.7,4.7,4.7    h65.6c0.7,0,1.4-0.2,2-0.6H23.7z"/>
        <path d="M90.7,64.1c0.2,0,0.5,0.1,0.8,0.1c2.3,0,4.2-1.9,4.2-4.2s-1.9-4.2-4.2-4.2c-0.8,0-1.6,0.3-2.3,0.7c1.9,0.4,3.4,2,3.4,4.1    C92.6,62.1,91.8,63.3,90.7,64.1z"/>
      </g>
      <g>
        <path fill="#FFC612" d="M37.1,60.8c-0.3-0.5-0.7-0.9-1.1-1.2c-0.5-0.3-1-0.6-1.5-0.7c-0.5-0.2-1.1-0.3-1.7-0.4    c-0.6-0.1-1.1-0.2-1.5-0.3c-0.5-0.1-0.8-0.2-1.1-0.4c-0.3-0.1-0.4-0.3-0.4-0.6c0-0.2,0.1-0.3,0.2-0.4c0.1-0.1,0.3-0.2,0.6-0.3    c0.3-0.1,0.6-0.1,1.1-0.1c0.6,0,1.2,0.1,1.9,0.3c0.6,0.2,1.3,0.4,2,0.8l1.4-3.4c-0.7-0.4-1.6-0.7-2.5-0.9    c-0.9-0.2-1.9-0.3-2.8-0.3c-1.4,0-2.7,0.2-3.6,0.6c-1,0.4-1.7,1-2.2,1.7c-0.5,0.7-0.7,1.5-0.7,2.4c0,0.8,0.1,1.4,0.4,1.9    c0.3,0.5,0.7,0.9,1.1,1.2c0.5,0.3,1,0.6,1.5,0.7c0.6,0.2,1.1,0.3,1.7,0.5c0.5,0.1,1.1,0.2,1.5,0.3c0.5,0.1,0.8,0.2,1.1,0.4    c0.3,0.1,0.4,0.3,0.4,0.6c0,0.2-0.1,0.3-0.2,0.4c-0.1,0.1-0.3,0.2-0.6,0.3c-0.3,0.1-0.6,0.1-1.1,0.1c-0.8,0-1.6-0.1-2.4-0.4    c-0.8-0.2-1.6-0.5-2.2-0.9l-1.5,3.5c0.7,0.4,1.6,0.8,2.7,1c1.1,0.3,2.2,0.4,3.4,0.4c1.5,0,2.7-0.2,3.6-0.7c1-0.4,1.7-1,2.2-1.7    c0.5-0.7,0.7-1.5,0.7-2.4C37.5,61.9,37.4,61.3,37.1,60.8z"/>
        <path fill="#FFC612" d="M43.5,53L37.4,67h4.8l0.9-2.5h5.3l0.9,2.5h4.9L48.2,53H43.5z M44.5,61.2l1.4-3.5l1.4,3.5H44.5z"/>
        <polygon fill="#FFC612" points="59.8,53 55.1,53 55.1,67 66.2,67 66.2,63.4 59.8,63.4   "/>
        <polygon fill="#FFC612" points="72.2,63.5 72.2,61.6 78.1,61.6 78.1,58.2 72.2,58.2 72.2,56.5 78.9,56.5 78.9,53 67.5,53 67.5,67     79.2,67 79.2,63.5   "/>
      </g>
    </g>
  </svg>`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.promotionButton}>
        <View style={styles.promotionContent}>
          <SvgXml
            xml={promotionSvg}
            width={50}
            height={50}
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
