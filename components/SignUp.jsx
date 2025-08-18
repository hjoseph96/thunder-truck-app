import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SignUp({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSignUp = () => {
    if (!phoneNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    // Here you would typically make an API call to sign up
    console.log('Signing up with:', { phoneNumber: `+1${phoneNumber}`, password });
    Alert.alert('Success', 'Sign up functionality would be implemented here');
  };

  const handleGoogleSignUp = () => {
    console.log('Google sign up pressed');
    Alert.alert('Google Sign Up', 'Google sign up functionality would be implemented here');
  };

  const handleFacebookSignUp = () => {
    console.log('Facebook sign up pressed');
    Alert.alert('Facebook Sign Up', 'Facebook sign up functionality would be implemented here');
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
                />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Sign Up Buttons */}
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>Sign up with Google Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignUp}>
          <View style={styles.facebookLogo}>
            <Text style={styles.facebookLogoText}>F</Text>
          </View>
          <Text style={styles.socialButtonText}>Sign up with Facebook Account</Text>
        </TouchableOpacity>

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
    backgroundColor: '#fecd15',
  },
  header: {
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
    color: '#2D1E2F',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1E2F',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
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
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#2D1E2F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButton: {
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
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  googleLogoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  facebookLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  facebookLogoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
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
