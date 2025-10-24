import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * KeyboardNavigableDropdown - A dropdown with keyboard navigation support
 * 
 * Self-manages zIndex: automatically elevates to z-index 1000 when open, 
 * returns to 1 when closed. No parent container zIndex management needed.
 * 
 * @param {Array} items - Array of items to display [{ code: 'CA', name: 'California' }]
 * @param {String} selectedValue - Currently selected value (code)
 * @param {Function} onSelect - Callback when item is selected
 * @param {String} placeholder - Placeholder text
 * @param {Boolean} searchByCode - If true, search by code; if false, search by name
 * @param {Boolean} displayCode - If true, display code; if false, display name
 * @param {Object} style - Container style
 * @param {Object} error - Error state
 * @param {Number} zIndex - Optional base zIndex when closed (defaults to 1)
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
  zIndex,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [keyboardBuffer, setKeyboardBuffer] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const scrollViewRef = useRef(null);
  const keyboardTimerRef = useRef(null);
  const keyboardBufferRef = useRef('');
  const highlightedIndexRef = useRef(-1);
  const buttonRef = useRef(null);
  const hiddenInputRef = useRef(null);

  // Inject CSS for web to ensure dropdowns render on top
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'keyboard-dropdown-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Ensure dropdown containers can establish stacking context */
          [data-dropdown-container] {
            position: relative !important;
          }
          
          /* Override any React Native Web z-index on dropdown list */
          [data-dropdown-list] {
            position: absolute !important;
            z-index: 999999 !important;
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
        // Handle Enter key FIRST with aggressive preventDefault
        if (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const currentHighlightedIndex = highlightedIndexRef.current;
          
          if (currentHighlightedIndex !== -1 && currentHighlightedIndex < items.length) {
            const selectedItem = items[currentHighlightedIndex];
            const selectedValue = selectedItem.code || selectedItem.value;
            onSelect(selectedValue);
            setIsOpen(false);
            setHighlightedIndex(-1);
            setKeyboardBuffer('');
            highlightedIndexRef.current = -1;
            keyboardBufferRef.current = '';
          }
          return false;
        }
        
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
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          setKeyboardBuffer('');
          highlightedIndexRef.current = -1;
          keyboardBufferRef.current = '';
        }
      };
      
      // Use capture phase to catch the event BEFORE it bubbles
      document.addEventListener('keydown', handleKeyDown, true);
      
      // Also add a keyup listener as a fallback
      const handleKeyUp = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener('keyup', handleKeyUp, true);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keyup', handleKeyUp, true);
        if (keyboardTimerRef.current) {
          clearTimeout(keyboardTimerRef.current);
        }
      };
    }
  }, [isOpen, items, searchByCode, onSelect]);

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

  // Handle click outside to close dropdown
  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && typeof document !== 'undefined') {
      const handleClickOutside = (event) => {
        // Check if click is on a dropdown item
        const isDropdownItem = event.target.closest('[data-dropdown-item]');
        if (isDropdownItem) {
          return; // Don't close if clicking on an item
        }
        
        if (buttonRef.current && !buttonRef.current.contains(event.target)) {
          // Check if click is not on dropdown list
          const dropdownList = document.querySelector('[data-dropdown-list]');
          if (!dropdownList || !dropdownList.contains(event.target)) {
            handleClose();
          }
        }
      };

      // Use setTimeout to ensure this runs after any click handlers
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Update dropdown position on scroll
  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      };

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    const selectedValue = item.code || item.value;
    onSelect(selectedValue);
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
    const newOpenState = !isOpen;
    
    if (!newOpenState) {
      // Closing - reset state
      setHighlightedIndex(-1);
      setKeyboardBuffer('');
      highlightedIndexRef.current = -1;
      keyboardBufferRef.current = '';
    } else {
      if (Platform.OS === 'web' && buttonRef.current) {
        // Opening - calculate position for portal
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
      
      // On mobile, focus the hidden input to enable keyboard submission
      if (Platform.OS !== 'web' && hiddenInputRef.current) {
        setTimeout(() => {
          hiddenInputRef.current?.focus();
        }, 100);
      }
    }
    
    setIsOpen(newOpenState);
  };

  const getDisplayValue = () => {
    if (!selectedValue) return placeholder;
    const item = items.find(i => i.code === selectedValue || i.value === selectedValue);
    if (!item) return selectedValue;
    return displayCode ? item.code : (item.name || item.label);
  };

  // Handle mobile keyboard text input for navigation
  const handleMobileKeyInput = (text) => {
    if (!text || text.length === 0) return;
    
    const typedKey = text.toLowerCase();
    const searchField = searchByCode ? 'code' : 'name';
    
    // Clear previous timer
    if (keyboardTimerRef.current) {
      clearTimeout(keyboardTimerRef.current);
    }
    
    // Check if typing the same letter repeatedly (cycling)
    const isSameKeyCycle = keyboardBuffer === typedKey && typedKey.length === 1;
    
    if (isSameKeyCycle) {
      // Cycle through items starting with this key
      const currentIndex = highlightedIndexRef.current;
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
      const newBuffer = keyboardBuffer + typedKey;
      keyboardBufferRef.current = newBuffer;
      setKeyboardBuffer(newBuffer);
      
      const matchIndex = items.findIndex(item => 
        item[searchField]?.toLowerCase().startsWith(newBuffer)
      );
      
      if (matchIndex !== -1) {
        highlightedIndexRef.current = matchIndex;
        setHighlightedIndex(matchIndex);
      }
    }
    
    // Clear the input
    if (hiddenInputRef.current) {
      hiddenInputRef.current.clear();
    }
    
    // Clear buffer after 1 second
    keyboardTimerRef.current = setTimeout(() => {
      keyboardBufferRef.current = '';
      setKeyboardBuffer('');
    }, 1000);
  };

  // Handle mobile keyboard submission (Done button)
  const handleMobileSubmit = () => {
    if (highlightedIndexRef.current !== -1) {
      const selectedItem = items[highlightedIndexRef.current];
      handleSelect(selectedItem);
    } else if (items.length > 0) {
      // If nothing is highlighted, select the first item
      handleSelect(items[0]);
    }
  };

  // Self-managed zIndex with higher boost when open
  // Default base zIndex is 100 (high enough to work in forms)
  // When open, boost by 10000 to ensure dropdown list appears on top
  const baseZIndex = zIndex !== undefined ? zIndex : 100;
  const activeZIndex = isOpen ? baseZIndex + 10000 : baseZIndex;

  // Render dropdown list content
  const renderDropdownList = () => {
    if (!isOpen) return null;

    const listContent = (
      <View 
        style={[
          styles.list,
          Platform.OS === 'web' && {
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 999999,
            pointerEvents: 'auto',
          }
        ]}
        {...(Platform.OS === 'web' && { 'data-dropdown-list': true })}
        pointerEvents="auto"
      >
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          nestedScrollEnabled={true}
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
                activeOpacity={0.7}
                {...(Platform.OS === 'web' && { 
                  'data-dropdown-item': true,
                  onMouseDown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(item);
                  }
                })}
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
    );

    // Use Portal on web to render outside the component tree
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return ReactDOM.createPortal(listContent, document.body);
    }

    return listContent;
  };

  return (
    <View 
      style={[
        styles.container,
        { zIndex: activeZIndex },
        Platform.OS === 'web' && isOpen && { position: 'relative' },
        style
      ]}
      {...(Platform.OS === 'web' && { 'data-dropdown-container': true })}
    >
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.button, error && styles.errorButton]}
        onPress={handleToggle}
      >
        <Text style={[styles.buttonText, !selectedValue && styles.placeholderText]}>
          {getDisplayValue()}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
      </TouchableOpacity>

      {/* Hidden TextInput for mobile keyboard navigation */}
      {Platform.OS !== 'web' && isOpen && (
        <TextInput
          ref={hiddenInputRef}
          style={styles.hiddenInput}
          onChangeText={handleMobileKeyInput}
          onSubmitEditing={handleMobileSubmit}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="none"
        />
      )}

      {renderDropdownList()}
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
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
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
    ...Platform.select({
      web: {
        maxHeight: 400,
      },
    }),
  },
  scrollView: {
    maxHeight: 300,
    ...Platform.select({
      web: {
        maxHeight: 400,
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

