import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const SearchBar = ({ searchText, setSearchText, onSubmit }) => {
  return (
    <View style={styles.searchContainer}>
      <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.searchIcon}>
        <Path
          d="M7.33335 12.0001C9.91068 12.0001 12 9.91074 12 7.33342C12 4.75609 9.91068 2.66675 7.33335 2.66675C4.75602 2.66675 2.66669 4.75609 2.66669 7.33342C2.66669 9.91074 4.75602 12.0001 7.33335 12.0001Z"
          stroke="#EE6C4D"
          strokeWidth="1.33333"
        />
        <Path
          d="M13.3334 13.3335L11.3334 11.3335"
          stroke="#EE6C4D"
          strokeWidth="1.33333"
          strokeLinecap="round"
        />
      </Svg>

      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#000"
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />

      <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.micIcon}>
        <Path
          d="M8 9.33325C9.10667 9.33325 10 8.43992 10 7.33325V3.33325C10 2.22659 9.10667 1.33325 8 1.33325C6.89333 1.33325 6 2.22659 6 3.33325V7.33325C6 8.43992 6.89333 9.33325 8 9.33325Z"
          fill="#EE6C4D"
        />
        <Path
          d="M11.3333 7.33325C11.3333 9.17325 9.83998 10.6666 7.99998 10.6666C6.15998 10.6666 4.66665 9.17325 4.66665 7.33325H3.33331C3.33331 9.68659 5.07331 11.6199 7.33331 11.9466V13.9999H8.66665V11.9466C10.9266 11.6199 12.6666 9.68659 12.6666 7.33325H11.3333Z"
          fill="#EE6C4D"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    height: 40,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Inter',
  },
  micIcon: {
    marginLeft: 8,
  },
});