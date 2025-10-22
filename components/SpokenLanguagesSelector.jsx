import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchSpokenLanguages } from '../lib/user-service';

const SpokenLanguagesSelector = ({ selectedLanguages, onSelectionChange, style }) => {
  const [languages, setLanguages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const fetchedLanguages = await fetchSpokenLanguages();
      
      // Sort languages with English at the top
      const sortedLanguages = fetchedLanguages.sort((a, b) => {
        // Check if either language is English
        const aIsEnglish = a.isoCode?.toLowerCase().startsWith('en');
        const bIsEnglish = b.isoCode?.toLowerCase().startsWith('en');
        
        // If a is English, it comes first
        if (aIsEnglish && !bIsEnglish) return -1;
        // If b is English, it comes first
        if (!aIsEnglish && bIsEnglish) return 1;
        // Otherwise, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      
      setLanguages(sortedLanguages);
    } catch (error) {
      console.error('Error loading languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (languageId) => {
    const isSelected = selectedLanguages.includes(languageId);
    if (isSelected) {
      onSelectionChange(selectedLanguages.filter(id => id !== languageId));
    } else {
      onSelectionChange([...selectedLanguages, languageId]);
    }
  };

  const getSelectedLanguageNames = () => {
    return selectedLanguages
      .map(id => languages.find(lang => lang.id === id)?.name)
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
          <MaterialIcons name="check" size={20} color="#F9B319" />
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

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        disabled={loading}
      >
        <View style={styles.selectorContent}>
          {renderSelectedLanguages()}
          <MaterialIcons 
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#666" 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Languages</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
              </Text>
            </View>

            <FlatList
              data={languages}
              keyExtractor={(item) => item.id}
              renderItem={renderLanguageItem}
              style={styles.languagesList}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
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
    fontFamily: 'Cairo',
  },
  selectedText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  closeButton: {
    padding: 4,
  },
  selectedCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
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
    borderBottomColor: '#f0f0f0',
  },
  languageItemSelected: {
    backgroundColor: '#fff8e1',
  },
  languageText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
    flex: 1,
  },
  languageTextSelected: {
    color: '#F9B319',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#F9B319',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo',
  },
});

export default SpokenLanguagesSelector;
