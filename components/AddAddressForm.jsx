import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Map from './Map';
import { addUserAddress } from '../lib/user-service';
import KeyboardNavigableDropdown from './ui/KeyboardNavigableDropdown';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const buildingTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'office', label: 'Office' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const COUNTRIES = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
];

const AddAddressForm = ({ navigation }) => {
  const [formData, setFormData] = useState({
    label: '',
    streetLineOne: '',
    streetLineTwo: '',
    city: '',
    state: '',
    country: 'USA',
    zipCode: '',
    buildingType: 'apartment',
    isDefault: false,
    deliveryInstructions: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedAddressMarker, setSubmittedAddressMarker] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const mapRef = useRef(null);

  // Function to parse latlong string from response
  const parseLatLong = (latlongString) => {
    if (!latlongString || !latlongString.startsWith('POINT (')) {
      return null;
    }
    
    // Extract coordinates from "POINT (-73.74758 40.68969)" format
    const coordsMatch = latlongString.match(/POINT \(([^)]+)\)/);
    if (!coordsMatch) return null;
    
    const coords = coordsMatch[1].split(' ').map(Number);
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      return null;
    }
    
    // Return as [longitude, latitude] for Mapbox
    return [coords[0], coords[1]];
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.streetLineOne.trim()) {
      newErrors.streetLineOne = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (!formData.buildingType) {
      newErrors.buildingType = 'Building type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      const addressData = {
        buildingType: formData.buildingType,
        city: formData.city,
        country: formData.country,
        streetLineOne: formData.streetLineOne,
        streetLineTwo: formData.streetLineTwo || null,
        state: formData.state,
        zipCode: formData.zipCode,
        label: formData.label || null,
        deliveryInstructions: formData.deliveryInstructions || null,
        isDefault: formData.isDefault,
      };

      const result = await addUserAddress(addressData);
      
      if (result) {
        // Parse the latlong coordinates from the response
        const coordinates = parseLatLong(result.latlong);
        
        if (coordinates) {
          // Set the marker coordinates and show confirmation
          setSubmittedAddressMarker(coordinates);
          
          // Center the map on the new address
          if (mapRef.current) {
            mapRef.current.postMessage(JSON.stringify({
              type: 'centerMapOnCoordinates',
              coordinates: coordinates
            }));
            
            // Add a marker at the address location
            mapRef.current.postMessage(JSON.stringify({
              type: 'addAddressMarker',
              coordinates: coordinates,
              addressData: {
                label: result.label || formData.label,
                streetLineOne: result.streetLineOne,
                city: result.city,
                state: result.state
              }
            }));
          }
          
          // Show confirmation dialog
          setShowConfirmation(true);
        } else {
          // Fallback if no coordinates available
          Alert.alert('Success', 'Address added successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CheckoutForm'),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error adding address: ', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };


  return (
    <View style={styles.container}>
      {/* Back Button - Fixed Top Left */}
      <View style={styles.topBackButton}>
        <TouchableOpacity 
          style={styles.customBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#132a13" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Add Address</Text>
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <Map ref={mapRef} />
      </View>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationDialog}>
            <Text style={styles.confirmationQuestion}>
              Does this look correct?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationButtonNo}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.confirmationButtonTextNo}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmationButtonYes}
                onPress={() => navigation.navigate('CheckoutForm')}
              >
                <Text style={styles.confirmationButtonTextYes}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Form Section */}
      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={styles.formContentContainer}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        nestedScrollEnabled
      >
        {/* Building Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Building Type *</Text>
          <KeyboardNavigableDropdown
            items={buildingTypes}
            selectedValue={formData.buildingType}
            onSelect={(value) => updateFormData('buildingType', value)}
            placeholder="Building Type"
            searchByCode={false}
            displayCode={false}
            error={!!errors.buildingType}
          />
          {errors.buildingType && <Text style={styles.errorText}>{errors.buildingType}</Text>}
        </View>

        {/* Label */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Display Name (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.label}
            onChangeText={(value) => updateFormData('label', value)}
            placeholder="e.g., Home, Office"
            placeholderTextColor="#999"
          />
        </View>

        {/* Street Address Line 1 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Street Address *</Text>
          <TextInput
            style={[styles.textInput, errors.streetLineOne && styles.errorInput]}
            value={formData.streetLineOne}
            onChangeText={(value) => updateFormData('streetLineOne', value)}
            placeholder="123 Main St"
            placeholderTextColor="#999"
          />
          {errors.streetLineOne && <Text style={styles.errorText}>{errors.streetLineOne}</Text>}
        </View>

        {/* Street Address Line 2 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Apartment, Suite, etc. (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.streetLineTwo}
            onChangeText={(value) => updateFormData('streetLineTwo', value)}
            placeholder="Apt 4B"
            placeholderTextColor="#999"
          />
        </View>

        {/* City */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>City *</Text>
          <TextInput
            style={[styles.textInput, errors.city && styles.errorInput]}
            value={formData.city}
            onChangeText={(value) => updateFormData('city', value)}
            placeholder="New York"
            placeholderTextColor="#999"
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        {/* State and ZIP Row */}
        <View style={styles.rowContainer}>
          <View style={[styles.fieldContainer, styles.halfWidth]}>
            <Text style={styles.fieldLabel}>State *</Text>
            <KeyboardNavigableDropdown
              items={US_STATES}
              selectedValue={formData.state}
              onSelect={(value) => updateFormData('state', value)}
              placeholder="State"
              searchByCode={true}
              displayCode={false}
              error={!!errors.state}
            />
            {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
          </View>

          <View style={[styles.fieldContainer, styles.halfWidth]}>
            <Text style={styles.fieldLabel}>ZIP Code *</Text>
            <TextInput
              style={[styles.textInput, errors.zipCode && styles.errorInput]}
              value={formData.zipCode}
              onChangeText={(value) => updateFormData('zipCode', value)}
              placeholder="12345"
              placeholderTextColor="#999"
              maxLength={10}
            />
            {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
          </View>
        </View>

        {/* Country */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Country *</Text>
          <View style={[styles.dropdownButton, styles.disabledInput]}>
            <Text style={styles.countryText}>
              🇺🇸 United States
            </Text>
          </View>
        </View>

        {/* Default Address Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => updateFormData('isDefault', !formData.isDefault)}
          >
            <MaterialIcons
              name={formData.isDefault ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={formData.isDefault ? "#FECD15" : "#999"}
            />
            <Text style={styles.checkboxText}>Set as default address</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.deliveryInstructions}
            onChangeText={(value) => updateFormData('deliveryInstructions', value)}
            placeholder="Leave at the front door, ring doorbell, etc."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.characterCount}>
            {formData.deliveryInstructions.length}/300
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Address</Text>
          )}
        </TouchableOpacity>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
      },
    }),
    overflow: 'scroll',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'scroll',
      },
    }),
  },
  topBackButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1000,
  },
  customBackButton: {
    backgroundColor: '#FECD15',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FB9C12',
    ...Platform.select({
      web: {
        height: 82, // 50 + 16 + 16 (title height)
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbfad8',
    fontFamily: 'Cairo',
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
    ...Platform.select({
      web: {
        marginBottom: 20,
      },
    }),
  },
  formContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 402, // header (82) + map (300 actual rendered height) + margin (20)
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingHorizontal: 16,
        paddingTop: 20,
      },
      default: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
      },
    }),
  },
  formContentContainer: {
    ...Platform.select({
      web: {
        paddingBottom: 40,
        minHeight: '100%',
        paddingTop: 0,
      },
      default: {
        flexGrow: 1,
      }
    }),
  },
  fieldContainer: {
    marginBottom: 16,
    ...Platform.select({
      web: {
        overflow: 'visible',
        position: 'relative',
      },
      default: {
        overflow: 'visible',
      },
    }),
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'visible',
  },
  halfWidth: {
    width: '48%',
    overflow: 'visible',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Cairo',
    outlineStyle: 'none', // Remove outline on web
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
  },
  countryText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    color: '#132a13',
    marginLeft: 8,
    fontFamily: 'Cairo',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Cairo',
  },
  submitButton: {
    backgroundColor: '#FECD15',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#132a13',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Cairo',
  },
  bottomSpacer: {
    height: 50,
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationDialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmationQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#132a13',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Cairo',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmationButtonNo: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmationButtonYes: {
    backgroundColor: '#FECD15',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmationButtonTextNo: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  confirmationButtonTextYes: {
    color: '#132a13',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
});

export default AddAddressForm;
