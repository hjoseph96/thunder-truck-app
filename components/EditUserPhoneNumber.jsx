import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { setCustomerDetails } from '../lib/customer-service';

export default function EditUserPhoneNumber({ navigation, route }) {
  const { userData } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize with existing phone number if available
    if (userData?.phoneNumber) {
      // Remove country code if present and set just the 10-digit number
      const cleaned = userData.phoneNumber.replace(/\D/g, '');
      if (cleaned.length === 11 && cleaned[0] === '1') {
        setPhoneNumber(cleaned.slice(1));
      } else if (cleaned.length === 10) {
        setPhoneNumber(cleaned);
      } else {
        setPhoneNumber(cleaned);
      }
    }
  }, [userData?.phoneNumber]);

  // Format phone number for display
  const formatPhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return '';
    const cleaned = number.replace(/\D/g, '');
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Handle phone number input changes
  const handlePhoneNumberChange = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    if (limited !== phoneNumber) {
      setPhoneNumber(limited);
    }
  };

  const handleClearPhoneNumber = () => {
    setPhoneNumber('');
  };

  const handleUpdate = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number with country code for storage
      const formattedPhoneNumber = `+1${phoneNumber}`;
      
      const result = await setCustomerDetails({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phoneNumber: formattedPhoneNumber,
        spokenLanguages: userData?.spokenLanguages || []
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your phone number updated successfully',
          visibilityTime: 3000,
          onHide: () => navigation.goBack()
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update phone number. Please try again.',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while updating your phone number. Please try again.',
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path d="M19 12H5M12 19L5 12L12 5" stroke="#2D1E2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Number</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          You'll use this phone number to get notifications, sign in, and recover your account.
        </Text>

        {/* Country Code and Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.flagText}>🇺🇸</Text>
              <Text style={styles.countryCodeText}>+1</Text>
            </View>
            <TextInput
              style={styles.phoneInputText}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              value={formatPhoneNumber(phoneNumber)}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={14}
              returnKeyType="done"
              selectTextOnFocus={true}
            />
            {phoneNumber.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearPhoneNumber}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16">
                  <Path d="M12 4L4 12M4 4L12 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.verificationText}>
          A verification code will be sent to this phone number.
        </Text>
      </View>

      {/* Update Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.updateButtonText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  description: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    lineHeight: 24,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  flagText: {
    fontSize: 20,
    marginRight: 5,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  phoneInputText: {
    fontSize: 16,
    color: '#2D1E2F',
    flex: 1,
    fontFamily: 'Poppins',
    paddingVertical: 8,
    outlineStyle: 'none', // Remove outline on web
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    lineHeight: 20,
    marginTop: 10,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  updateButton: {
    backgroundColor: '#fecd15',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
});
