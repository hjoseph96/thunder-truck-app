import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Custom Success Toast Component
const SuccessToast = ({ text1, text2 }) => (
  <View style={styles.successContainer}>
    <View style={styles.successIcon}>
      <Svg width="20" height="20" viewBox="0 0 20 20">
        <Path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.successTitle}>{text1}</Text>
      {text2 && <Text style={styles.successMessage}>{text2}</Text>}
    </View>
  </View>
);

// Custom Error Toast Component
const ErrorToast = ({ text1, text2 }) => (
  <View style={styles.errorContainer}>
    <View style={styles.errorIcon}>
      <Svg width="20" height="20" viewBox="0 0 20 20">
        <Path d="M15 5L5 15M5 5L15 15" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.errorTitle}>{text1}</Text>
      {text2 && <Text style={styles.errorMessage}>{text2}</Text>}
    </View>
  </View>
);

// Toast Configuration
export const toastConfig = {
  success: (props) => <SuccessToast {...props} />,
  error: (props) => <ErrorToast {...props} />,
};

const styles = StyleSheet.create({
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 60,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 60,
  },
  successIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  successMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins',
  },
});
