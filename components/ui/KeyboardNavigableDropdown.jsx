import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * KeyboardNavigableDropdown - A dropdown with keyboard navigation support
 * 
 * @param {Array} items - Array of items to display [{ code: 'CA', name: 'California' }]
 * @param {String} selectedValue - Currently selected value (code)
 * @param {Function} onSelect - Callback when item is selected
 * @param {String} placeholder - Placeholder text
 * @param {Boolean} searchByCode - If true, search by code; if false, search by name
 * @param {Boolean} displayCode - If true, display code; if false, display name
 * @param {Object} style - Container style
 * @param {Object} error - Error state
 */
const KeyboardNavigableDropdown = ({
  items = [],
  selectedValue,
  onSelect,
  placeholder = 'Select',
  searchByCode = true,
  displayCode = false,
  style,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [keyboardBuffer, setKeyboardBuffer] = useState('');
  
  const scrollViewRef = useRef(null);
  const keyboardTimerRef = useRef(null);
  const keyboardBufferRef = useRef('');
  const highlightedIndexRef = useRef(-1);

  // Inject CSS for web to ensure dropdowns render on top
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'keyboard-dropdown-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Remove z-index from React Native Web generated class */
          /* Ensure dropdown lists render on top of everything */
          [data-dropdown-list] {
            position: absolute !important;
            z-index: 99999 !important;
          }
          
          [data-dropdown-container] {
            position: relative !important;
          }
          
          [data-dropdown-item] {
            cursor: pointer !important;
            transition: background-color 0.2s ease;
          }
          
          [data-dropdown-item]:hover {
            background-color: #f5f5f5 !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    keyboardBufferRef.current = keyboardBuffer;
  }, [keyboardBuffer]);

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && typeof document !== 'undefined') {
      const handleKeyDown = (e) => {
        // Handle arrow keys
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = highlightedIndexRef.current;
          const nextIndex = currentIndex === -1 ? 0 : (currentIndex < items.length - 1 ? currentIndex + 1 : 0);
          highlightedIndexRef.current = nextIndex;
          setHighlightedIndex(nextIndex);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIndex = highlightedIndexRef.current;
          const prevIndex = currentIndex === -1 ? items.length - 1 : (currentIndex > 0 ? currentIndex - 1 : items.length - 1);
          highlightedIndexRef.current = prevIndex;
          setHighlightedIndex(prevIndex);
        }
        // Handle letter keys
        else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          e.preventDefault();
          
          if (keyboardTimerRef.current) {
            clearTimeout(keyboardTimerRef.current);
          }
          
          const typedKey = e.key.toLowerCase();
          const currentBuffer = keyboardBufferRef.current;
          
          // Check if typing the same letter repeatedly (cycling)
          const isSameKeyCycle = currentBuffer === typedKey && typedKey.length === 1;
          
          if (isSameKeyCycle) {
            // Cycle through items starting with this key
            const currentIndex = highlightedIndexRef.current;
            const searchField = searchByCode ? 'code' : 'name';
            const matchingItems = items.map((item, index) => ({ item, index }))
              .filter(({ item }) => item[searchField]?.toLowerCase().startsWith(typedKey));
            
            if (matchingItems.length > 0) {
              const currentMatchIndex = matchingItems.findIndex(({ index }) => index === currentIndex);
              const nextMatchIndex = (currentMatchIndex + 1) % matchingItems.length;
              const nextIndex = matchingItems[nextMatchIndex].index;
              
              highlightedIndexRef.current = nextIndex;
              setHighlightedIndex(nextIndex);
            }
            
            keyboardBufferRef.current = typedKey;
            setKeyboardBuffer(typedKey);
          } else {
            // Multi-character search
            const newBuffer = currentBuffer + typedKey;
            keyboardBufferRef.current = newBuffer;
            setKeyboardBuffer(newBuffer);
            
            const searchField = searchByCode ? 'code' : 'name';
            const matchIndex = items.findIndex(item => 
              item[searchField]?.toLowerCase().startsWith(newBuffer)
            );
            
            if (matchIndex !== -1) {
              highlightedIndexRef.current = matchIndex;
              setHighlightedIndex(matchIndex);
            }
          }
          
          // Clear buffer after 1 second
          keyboardTimerRef.current = setTimeout(() => {
            keyboardBufferRef.current = '';
            setKeyboardBuffer('');
          }, 1000);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (highlightedIndexRef.current !== -1) {
            const selectedItem = items[highlightedIndexRef.current];
            handleSelect(selectedItem);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (keyboardTimerRef.current) {
          clearTimeout(keyboardTimerRef.current);
        }
      };
    }
  }, [isOpen, items, searchByCode]);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex !== -1 && scrollViewRef.current && Platform.OS === 'web') {
      const itemHeight = 48;
      const scrollPosition = highlightedIndex * itemHeight;
      
      if (scrollViewRef.current.scrollTo) {
        scrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (item) => {
    onSelect(item.code || item.value);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setKeyboardBuffer('');
    highlightedIndexRef.current = -1;
    keyboardBufferRef.current = '';
  };

  const handleToggle = () => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      setKeyboardBuffer('');
      highlightedIndexRef.current = -1;
      keyboardBufferRef.current = '';
    }
    setIsOpen(!isOpen);
  };

  const getDisplayValue = () => {
    if (!selectedValue) return placeholder;
    const item = items.find(i => i.code === selectedValue || i.value === selectedValue);
    if (!item) return selectedValue;
    return displayCode ? item.code : (item.name || item.label);
  };

  return (
    <View 
      style={[
        styles.container,
        isOpen && Platform.OS === 'web' && { zIndex: 10000 },
        style
      ]}
      {...(Platform.OS === 'web' && { 'data-dropdown-container': true })}
    >
      <TouchableOpacity
        style={[styles.button, error && styles.errorButton]}
        onPress={handleToggle}
      >
        <Text style={[styles.buttonText, !selectedValue && styles.placeholderText]}>
          {getDisplayValue()}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
      </TouchableOpacity>

      {isOpen && (
        <View 
          style={styles.list}
          {...(Platform.OS === 'web' && { 'data-dropdown-list': true })}
        >
          <ScrollView 
            style={styles.scrollView}
            ref={scrollViewRef}
          >
            {items.map((item, index) => {
              const isHighlighted = highlightedIndex === index;
              const displayValue = displayCode ? item.code : (item.name || item.label);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.item,
                    isHighlighted && styles.itemHighlighted
                  ]}
                  onPress={() => handleSelect(item)}
                  {...(Platform.OS === 'web' && { 'data-dropdown-item': true })}
                >
                  <Text style={[
                    styles.itemText,
                    isHighlighted && styles.itemTextHighlighted
                  ]}>
                    {displayValue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    ...Platform.select({
      web: {
        position: 'relative',
      },
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  errorButton: {
    borderColor: '#ff4444',
  },
  buttonText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  list: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99999,
    ...Platform.select({
      web: {
        maxHeight: 400,
        zIndex: 99999,
      },
    }),
  },
  scrollView: {
    maxHeight: 300,
    ...Platform.select({
      web: {
        maxHeight: 400,
        zIndex: "999999999999 !important"
      },
    }),
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  itemHighlighted: {
    backgroundColor: '#F9B319',
    ...Platform.select({
      web: {
        backgroundColor: '#F9B319',
      },
    }),
  },
  itemText: {
    fontSize: 16,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  itemTextHighlighted: {
    color: '#000',
    fontWeight: '600',
  },
});

export default KeyboardNavigableDropdown;

