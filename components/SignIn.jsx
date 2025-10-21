import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { authService } from '../lib/api-service';
import { storeToken, storeUserData } from '../lib/token-manager';
import { resetSessionExpiration } from '../lib/session-manager';

const { width, height } = Dimensions.get('window');

export default function SignIn({ navigation, route }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for session expired message
  const sessionMessage = route?.params?.message;

  // Format phone number for display
  const formatPhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return '';
    const cleaned = number.replace(/\D/g, '');
    
    // More stable formatting logic
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
    
    // Prevent infinite loops by checking if the value actually changed
    if (limited !== phoneNumber) {
      console.log('Phone input:', { original: text, cleaned, limited, formatted: formatPhoneNumber(limited) });
      setPhoneNumber(limited);
    }
  };

  const handleSignIn = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      // Call the sign in API with only phone number
      const result = await authService.signIn(`+1${phoneNumber}`);
      
      if (result.success) {
        // Store the JWT token and user data for future authenticated requests
        if (result.token) {
          try {
            await storeToken(result.token);
            if (result.user) {
              await storeUserData(result.user);
            }
            // Reset session expiration state after successful sign in
            resetSessionExpiration();
            console.log('JWT token and user data stored successfully');
          } catch (storageError) {
            console.error('Error storing authentication data:', storageError);
          }
        }
        // Navigate to ExplorerHome after successful sign in
        navigation.navigate('ExplorerHome');
      } else {
        Alert.alert('Error', result.message || 'Sign in failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.titleText}>Welcome Back!</Text>
        <Text style={styles.subtitleText}>Sign in to your account</Text>
        
        {/* Session Expired Message */}
        {sessionMessage && (
          <View style={styles.sessionMessageContainer}>
            <Text style={styles.sessionMessageText}>{sessionMessage}</Text>
          </View>
        )}

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.flagText}>🇺🇸</Text>
              <Text style={styles.countryCodeText}>+1</Text>
            </View>
            <TextInput
              style={styles.phoneInputText}
              placeholder="Enter phone number"
              placeholderTextColor="#666"
              value={formatPhoneNumber(phoneNumber)}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              autoFocus
              maxLength={14}
              returnKeyType="done"
              selectTextOnFocus={true}
            />
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text style={styles.signInButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fecd15',
  },
  header: {
    backgroundColor: '#28282B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: 'whitesmoke',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'whitesmoke',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1E2F',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  sessionMessageContainer: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  sessionMessageText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  phoneInputContainer: {
    width: '100%',
    height: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row', // Added for layout
    alignItems: 'center', // Added for layout
    paddingHorizontal: 15, // Added for padding
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  flagText: {
    fontSize: 24,
    marginRight: 5,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: '600',
  },
  phoneInputText: {
    fontSize: 16,
    color: '#2D1E2F',
    flex: 1,
    paddingVertical: 8,
    outlineStyle: 'none', // Remove outline on web
  },
  signInButton: {
    backgroundColor: '#2D1E2F',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  signInButtonDisabled: {
    backgroundColor: '#999',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signUpText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
