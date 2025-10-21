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

export default function EditUserEmail({ navigation, route }) {
  const { userData } = route.params || {};
  const [email, setEmail] = useState(userData?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleClearEmail = () => {
    setEmail('');
  };

  const handleUpdate = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCustomerDetails({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: email.trim(),
        phoneNumber: userData?.phoneNumber || '',
        spokenLanguages: userData?.spokenLanguages || []
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your email updated successfully',
          visibilityTime: 3000,
          onHide: () => navigation.goBack()
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to update email',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while updating your email',
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
        <Text style={styles.headerTitle}>Email</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          You'll use this email to receive messages, get notified about promotions, and recover your account.
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
            />
            {email.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearEmail}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16">
                  <Path d="M12 4L4 12M4 4L12 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.verificationText}>
          A verification code will be sent to this email.
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
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#2D1E2F',
    backgroundColor: '#FFF',
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
