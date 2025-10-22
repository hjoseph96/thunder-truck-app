import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { authService } from '../lib/api-service';
import { getMarkdownContent } from '../lib/markdown-loader';

const { width, height } = Dimensions.get('window');

export default function SignUp({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignUp = async () => {
    if (!phoneNumber) {
      if (Platform.OS === 'web') {
        console.error('Please enter your phone number');
      } else {
        Alert.alert('Error', 'Please enter your phone number');
      }
      return;
    }

    if (phoneNumber.length !== 10) {
      if (Platform.OS === 'web') {
        console.error('Please enter a valid 10-digit phone number');
      } else {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      // Request OTP from the API
      const result = await authService.requestOtp(`+1${phoneNumber}`);
      
      if (result.success) {
        // On web: navigate directly without Alert
        if (Platform.OS === 'web') {
          navigation.navigate('VerifyOTP', {
            phoneNumber: `+1${phoneNumber}`
          });
        } else {
          // On mobile: show Alert with confirmation
          Alert.alert(
            'OTP Sent!', 
            result.message,
            [
              {
                text: 'Continue',
                onPress: () => {
                  navigation.navigate('VerifyOTP', {
                    phoneNumber: `+1${phoneNumber}`
                  });
                }
              }
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          console.error('Error:', result.message || 'Failed to send OTP');
        } else {
          Alert.alert('Error', result.message || 'Failed to send OTP');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        console.error('Error:', error.message || 'An error occurred while requesting OTP');
      } else {
        Alert.alert('Error', error.message || 'An error occurred while requesting OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTerms = () => {
    navigation.navigate('MarkdownViewer', {
      title: 'Terms of Service',
      markdownContent: getMarkdownContent('terms'),
      type: 'Terms of Service'
    });
  };

  const handleViewPrivacy = () => {
    navigation.navigate('MarkdownViewer', {
      title: 'Privacy Policy',
      markdownContent: getMarkdownContent('privacy'),
      type: 'Privacy Policy'
    });
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
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.titleText}>Create Account</Text>
        <Text style={styles.subtitleText}>Sign up to get started</Text>

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
              onSubmitEditing={handleSignUp}
            />
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]} 
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.signUpButtonText}>
            {isLoading ? 'Sending OTP...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Terms and Privacy Links */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By signing up, you agree to our{' '}
            <Text style={styles.legalLink} onPress={handleViewTerms}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={handleViewPrivacy}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: {
        backgroundColor: '#535355',
      },
      default: {
        backgroundColor: '#fecd15',
      },
    }),
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
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'whitesmoke'
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    ...Platform.select({
      web: {
        maxWidth: 500,
        width: '100%',
        marginHorizontal: 'auto',
        marginTop: 80,
        marginBottom: 40,
        backgroundColor: '#eee',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
        alignSelf: 'center',
      },
    }),
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
    flexDirection: 'row', // Added for country code and input alignment
    alignItems: 'center',
    paddingHorizontal: 15,
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
  signUpButton: {
    backgroundColor: '#2D1E2F',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  signUpButtonDisabled: {
    backgroundColor: '#999',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legalContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    color: '#2D1E2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 16,
    color: '#666',
  },
  signInLink: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
