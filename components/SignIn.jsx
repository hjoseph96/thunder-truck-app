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
import PhoneInput from 'react-native-phone-number-input';

const { width, height } = Dimensions.get('window');

export default function SignIn({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

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

  const handleSignIn = () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Here you would typically make an API call to sign in
    console.log('Signing in with:', { phoneNumber: `+1${phoneNumber}`, password });
    Alert.alert('Success', 'Sign in functionality would be implemented here');
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in pressed');
    Alert.alert('Google Sign In', 'Google sign in functionality would be implemented here');
  };

  const handleFacebookSignIn = () => {
    console.log('Facebook sign in pressed');
    Alert.alert('Facebook Sign In', 'Facebook sign in functionality would be implemented here');
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

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Sign In Buttons */}
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>Sign in with Google Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignIn}>
          <View style={styles.facebookLogo}>
            <Text style={styles.facebookLogoText}>F</Text>
          </View>
          <Text style={styles.socialButtonText}>Sign in with Facebook Account</Text>
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
  signInButtonText: {
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
