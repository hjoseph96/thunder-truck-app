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

export default function EditUserName({ navigation, route }) {
  const { userData } = route.params || {};
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearFirstName = () => {
    setFirstName('');
  };

  const handleClearLastName = () => {
    setLastName('');
  };

  const handleUpdate = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in both first name and last name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCustomerDetails({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: userData?.email || '',
        spokenLanguages: userData?.spokenLanguages || []
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your name updated successfully',
          visibilityTime: 3000,
          onHide: () => navigation.goBack()
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update name. Please try again.',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while updating your name. Please try again.',
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
        <Text style={styles.headerTitle}>Name</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          This is the name you would like other people to use when referring to you in our platform.
        </Text>

        {/* First Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {firstName.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearFirstName}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16">
                  <Path d="M12 4L4 12M4 4L12 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Last Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {lastName.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearLastName}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16">
                  <Path d="M12 4L4 12M4 4L12 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    marginBottom: 25,
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
