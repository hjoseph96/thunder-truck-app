import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../lib/api-service';
import { storeToken, storeUserData } from '../lib/token-manager';


const { width, height } = Dimensions.get('window');

export default function VerifyOTP({ navigation, route }) {
  const { phoneNumber } = route.params;
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  // Handle OTP input changes
  const handleOtpChange = (text, index) => {
    const newOtpCode = [...otpCode];
    newOtpCode[index] = text;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits are entered
    if (text && index === 5) {
      const code = newOtpCode.join('');
      if (code.length === 6) {
        handleVerifyOtp();
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      if (Platform.OS === 'web') {
        console.error('Please enter the complete 6-digit OTP code');
      } else {
        Alert.alert('Error', 'Please enter the complete 6-digit OTP code');
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyOtp(phoneNumber, code);
      
      if (result.success) {
        // On web: navigate directly without Alert
        if (Platform.OS === 'web') {

          await storeToken(result.token);
          if (result.user) {
            await storeUserData(result.user);
          }

          navigation.navigate('ExplorerHome');
        } else {
          // On mobile: show success Alert
          Alert.alert(
            'Success!', 
            'Phone number verified successfully!',
            [
              {
                text: 'Continue',
                onPress: () => {
                  navigation.navigate('ExplorerHome');
                }
              }
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          console.error('Error:', result.message || 'Verification failed');
        } else {
          Alert.alert('Error', result.message || 'Verification failed');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        console.error('Error:', error.message || 'An error occurred during verification');
      } else {
        Alert.alert('Error', error.message || 'An error occurred during verification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      const result = await authService.requestOtp(phoneNumber);
      
      if (result.success) {
        if (Platform.OS === 'web') {
          console.log('Success: New OTP code sent to your phone');
        } else {
          Alert.alert('Success', 'New OTP code sent to your phone');
        }
        // Start resend timer (60 seconds)
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (Platform.OS === 'web') {
          console.error('Error:', result.message || 'Failed to resend OTP');
        } else {
          Alert.alert('Error', result.message || 'Failed to resend OTP');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        console.error('Error:', error.message || 'An error occurred while resending OTP');
      } else {
        Alert.alert('Error', error.message || 'An error occurred while resending OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.titleText}>Enter Verification Code</Text>
        <Text style={styles.subtitleText}>
          We've sent a 6-digit code to {formatPhoneNumber(phoneNumber.replace('+1', ''))}
        </Text>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otpCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
              returnKeyType={index === 5 ? "done" : "next"}
              onSubmitEditing={index === 5 ? handleVerifyOtp : undefined}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} 
          onPress={handleVerifyOtp}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity 
            onPress={handleResendOtp}
            disabled={resendTimer > 0 || isLoading}
          >
            <Text style={[
              styles.resendLink, 
              (resendTimer > 0 || isLoading) && styles.resendLinkDisabled
            ]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 50,
    height: 60,
    marginHorizontal: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1E2F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    outlineStyle: 'none', // Remove outline on web
  },
  verifyButton: {
    backgroundColor: '#2D1E2F',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#999',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#666',
  },
  resendLink: {
    fontSize: 16,
    color: '#2D1E2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
});
