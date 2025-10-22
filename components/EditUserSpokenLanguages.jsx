import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { setCustomerDetails } from '../lib/customer-service';
import { fetchSpokenLanguages } from '../lib/spoken-languages-service';

export default function EditUserSpokenLanguages({ navigation, route }) {
  const { userData } = route.params || {};
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  useEffect(() => {
    // Initialize with existing spoken languages if available
    if (userData?.spokenLanguages && Array.isArray(userData.spokenLanguages)) {
      // Extract language IDs from the language objects
      const languageIds = userData.spokenLanguages.map(lang => lang.id);
      setSelectedLanguages(languageIds);
    }
    loadLanguages();
  }, [userData?.spokenLanguages]);

  const loadLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const languages = await fetchSpokenLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('Error loading languages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load languages. Please try again.',
        visibilityTime: 4000,
      });
    } finally {
      setLoadingLanguages(false);
    }
  };

  const toggleLanguage = (languageId) => {
    const isSelected = selectedLanguages.includes(languageId);
    if (isSelected) {
      setSelectedLanguages(selectedLanguages.filter(id => id !== languageId));
    } else {
      setSelectedLanguages([...selectedLanguages, languageId]);
    }
  };

  const getSelectedLanguageNames = () => {
    return selectedLanguages
      .map(id => availableLanguages.find(lang => lang.id === id)?.name)
      .filter(Boolean);
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = selectedLanguages.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.languageItemSelected
        ]}
        onPress={() => toggleLanguage(item.id)}
      >
        <Text style={[
          styles.languageText,
          isSelected && styles.languageTextSelected
        ]}>
          {item.name}
        </Text>
        {isSelected && (
          <Svg width="20" height="20" viewBox="0 0 20 20">
            <Path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#fecd15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        )}
      </TouchableOpacity>
    );
  };

  const renderSelectedLanguages = () => {
    const selectedNames = getSelectedLanguageNames();
    
    if (selectedNames.length === 0) {
      return (
        <Text style={styles.placeholderText}>
          Select your spoken languages
        </Text>
      );
    }

    if (selectedNames.length <= 2) {
      return (
        <Text style={styles.selectedText}>
          {selectedNames.join(', ')}
        </Text>
      );
    }

    return (
      <Text style={styles.selectedText}>
        {selectedNames.slice(0, 2).join(', ')} +{selectedNames.length - 2} more
      </Text>
    );
  };

  const handleUpdate = async () => {
    if (!selectedLanguages || selectedLanguages.length === 0) {
      Alert.alert('Error', 'Please select at least one spoken language');
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCustomerDetails({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        spokenLanguages: selectedLanguages
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your spoken languages updated successfully',
          visibilityTime: 3000,
          onHide: () => navigation.goBack()
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update spoken languages. Please try again.',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while updating your spoken languages. Please try again.',
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
        <Text style={styles.headerTitle}>Languages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          We'll use this to show the app in your spoken language, as well to assist delivery couriers to better communicate with you.
        </Text>

        {/* Spoken Languages Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Spoken Languages</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setIsModalOpen(true)}
            disabled={loadingLanguages}
          >
            <View style={styles.selectorContent}>
              {renderSelectedLanguages()}
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </View>
          </TouchableOpacity>
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

      {/* Language Selection Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Languages</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalOpen(false)}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
              </Text>
            </View>

            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.id}
              renderItem={renderLanguageItem}
              style={styles.languagesList}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setIsModalOpen(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  dropdownSelector: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFF',
    minHeight: 56,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins',
  },
  selectedText: {
    fontSize: 16,
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 4,
  },
  selectedCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  languagesList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemSelected: {
    backgroundColor: '#FFF8E1',
  },
  languageText: {
    fontSize: 16,
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    flex: 1,
  },
  languageTextSelected: {
    color: '#fecd15',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#fecd15',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#2D1E2F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
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