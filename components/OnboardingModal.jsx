import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { setCustomerDetails } from '../lib/customer-service';
import SpokenLanguagesSelector from './SpokenLanguagesSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingModal({ visible, onClose, userData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    spokenLanguages: [],
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const [confettiAnim] = useState(new Animated.Value(0));
  const [partyConeAnim] = useState(new Animated.Value(0));

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to ThunderTruck! 🚚',
      subtitle:
        "We're excited to have you on board! To personalize your experience, we'd love to know a bit more about you.",
      buttonText: "Let's Get Started",
      showProgress: false,
    },
    {
      id: 'firstName',
      title: 'What should we call you? 👋',
      subtitle: 'Your first name helps us make your experience more personal.',
      placeholder: 'Enter your first name',
      field: 'firstName',
      buttonText: 'Next',
      showProgress: true,
    },
    {
      id: 'lastName',
      title: 'And your last name? 📝',
      subtitle: 'This helps us keep your orders organized.',
      placeholder: 'Enter your last name',
      field: 'lastName',
      buttonText: 'Next',
      showProgress: true,
    },
    {
      id: 'email',
      title: "What's your email? 📧",
      subtitle: "We'll use this to send you order updates and special offers.",
      placeholder: 'Enter your email address',
      field: 'email',
      buttonText: 'Next',
      showProgress: true,
    },
    {
      id: 'spokenLanguages',
      title: 'What languages do you speak? 🗣️',
      subtitle: 'This helps us provide you with the best experience in your preferred languages.',
      field: 'spokenLanguages',
      buttonText: 'Complete Setup',
      showProgress: true,
    },
  ];

  useEffect(() => {
    // Auto-fill form data if user data exists
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        spokenLanguages: userData.spokenLanguages || [],
      });
    }
  }, [userData]);

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Submit form
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const result = await setCustomerDetails({
        userId: userData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        spokenLanguages: formData.spokenLanguages,
      });

      if (result.success) {
        // Show success animation
        setShowSuccess(true);
        startSuccessAnimation();

        // Close modal after 2 seconds and pass success flag
        setTimeout(() => {
          onClose(true); // Pass true to indicate successful completion
        }, 2000);
      }
    } catch (error) {
      console.error('Error setting customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSuccessAnimation = () => {
    // Confetti animation
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Party cone animation
    Animated.sequence([
      Animated.timing(partyConeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(partyConeAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(partyConeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStepValid = () => {
    const step = steps[currentStep];
    if (step.field) {
      if (step.field === 'spokenLanguages') {
        return formData[step.field].length > 0;
      }
      return formData[step.field].trim().length > 0;
    }
    return true;
  };

  const renderProgressBar = () => {
    if (!steps[currentStep].showProgress) return null;

    const progress = (currentStep / (steps.length - 1)) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {steps.length - 1}
        </Text>
      </View>
    );
  };

  const renderInput = () => {
    const step = steps[currentStep];
    if (!step.field) return null;

    if (step.field === 'spokenLanguages') {
      return (
        <View style={styles.inputContainer}>
          <SpokenLanguagesSelector
            selectedLanguages={formData.spokenLanguages}
            onSelectionChange={(languages) => updateFormData('spokenLanguages', languages)}
          />
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={step.placeholder}
          value={formData[step.field]}
          onChangeText={(text) => updateFormData(step.field, text)}
          autoCapitalize={step.field === 'email' ? 'none' : 'words'}
          keyboardType={step.field === 'email' ? 'email-address' : 'default'}
          autoCorrect={false}
        />
      </View>
    );
  };

  const renderSuccessAnimation = () => {
    if (!showSuccess) return null;

    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.confetti,
            {
              opacity: confettiAnim,
              transform: [
                {
                  scale: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.confettiText}>🎉</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.partyCone,
            {
              transform: [
                {
                  scale: partyConeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
                {
                  rotate: partyConeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '10deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.partyConeText}>🎊</Text>
        </Animated.View>

        <Text style={styles.successText}>Welcome aboard! 🚚</Text>
        <Text style={styles.successSubtext}>Your profile is all set up!</Text>

        {/* Manual dismiss button */}
        <TouchableOpacity style={styles.dismissButton} onPress={() => onClose(true)}>
          <Text style={styles.dismissButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStepContent = () => {
    if (showSuccess) {
      return renderSuccessAnimation();
    }

    const step = steps[currentStep];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

        {renderInput()}

        <TouchableOpacity
          style={[styles.nextButton, !isStepValid() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isStepValid() || loading}
        >
          <Text style={styles.nextButtonText}>{loading ? 'Setting up...' : step.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {renderProgressBar()}
          {renderStepContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: screenWidth * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F9B319',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Cairo',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#132a13',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'Cairo',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Cairo',
    backgroundColor: '#f9f9f9',
  },
  nextButton: {
    backgroundColor: '#F9B319',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confetti: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -20,
  },
  confettiText: {
    fontSize: 40,
  },
  partyCone: {
    marginBottom: 16,
  },
  partyConeText: {
    fontSize: 60,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#132a13',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  successSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Cairo',
    marginBottom: 24,
  },
  dismissButton: {
    backgroundColor: '#F9B319',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});
