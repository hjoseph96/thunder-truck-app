import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PaymentMethodManager from './PaymentMethodManager';
import { authService } from '../lib/api-service';

const { height: screenHeight } = Dimensions.get('window');

export default function UserProfileView({ visible, onClose, userData, navigation }) {
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'Not provided';

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Format as 1+ (XXX)-XXX-XXXX
    if (cleaned.length === 10) {
      return `1+ (${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `1+ (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    return phoneNumber; // Return original if format doesn't match
  };

  const formatLanguages = (languages) => {
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return 'Not specified';
    }
    return languages.join(', ');
  };

  const handleNamePress = () => {
    onClose(); // Close the profile modal first
    navigation.navigate('EditUserName', { userData });
  };

  const handlePhonePress = () => {
    onClose(); // Close the profile modal first
    navigation.navigate('EditUserPhoneNumber', { userData });
  };

  const handleEmailPress = () => {
    onClose(); // Close the profile modal first
    navigation.navigate('EditUserEmail', { userData });
  };

  const handleLanguagesPress = () => {
    onClose(); // Close the profile modal first
    navigation.navigate('EditUserSpokenLanguages', { userData });
  };

  const handlePaymentMethodsPress = () => {
    setShowPaymentMethodModal(true);
  };

  const handleOrdersPress = () => {
    onClose(); // Close the profile modal first
    navigation.navigate('OrderIndex');
  }

  const handleSignOut = async () => {
    try {
      onClose(); // Close the profile modal first
      await authService.signOut();
      // Navigate to LandingPage
      navigation.reset({
        index: 0,
        routes: [{ name: 'LandingPage' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate to LandingPage even if signOut fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'LandingPage' }],
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#2D1E2F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userData?.firstName?.[0] || 'U'}
                    {userData?.lastName?.[0] || ''}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Svg width="16" height="16" viewBox="0 0 16 16">
                    <Path
                      d="M11.3333 2.66667C11.5083 2.49167 11.7167 2.40417 11.9583 2.40417C12.2 2.40417 12.4083 2.49167 12.5833 2.66667C12.7583 2.84167 12.8458 3.05 12.8458 3.29167C12.8458 3.53333 12.7583 3.74167 12.5833 3.91667L4.25 12.25H2.66667V10.6667L11.3333 2.66667ZM11.3333 4.08333L3.66667 11.75H4.25V12.3333L11.3333 4.08333Z"
                      fill="#2D1E2F"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* Settings List */}
            <View style={styles.settingsList}>
              {/* Name */}
              <TouchableOpacity style={styles.settingItem} onPress={handleNamePress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Name</Text>
                  <Text style={styles.settingValue}>
                    {userData?.firstName && userData?.lastName
                      ? `${userData.firstName} ${userData.lastName}`
                      : 'Not provided'}
                  </Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Phone Number */}
              <TouchableOpacity style={styles.settingItem} onPress={handlePhonePress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Phone Number</Text>
                  <Text style={styles.settingValue}>
                    {formatPhoneNumber(userData?.phoneNumber)}
                  </Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Email */}
              <TouchableOpacity style={styles.settingItem} onPress={handleEmailPress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Email</Text>
                  <Text style={styles.settingValue}>{userData?.email || 'Not provided'}</Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Language */}
              <TouchableOpacity style={styles.settingItem} onPress={handleLanguagesPress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingValue}>
                    {formatLanguages(userData?.spokenLanguages.map((language) => language.name))}
                  </Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Orders */}
              <TouchableOpacity style={styles.settingItem} onPress={handleOrdersPress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Orders</Text>
                  <Text style={styles.settingValue}>View your order history</Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Payment Method */}
              <TouchableOpacity style={styles.settingItem} onPress={handlePaymentMethodsPress}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Payment Methods</Text>
                  <Text style={styles.settingValue}>Manage your payment methods</Text>
                </View>
                <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.caret}>
                  <Path
                    d="M6 4L10 8L6 12"
                    stroke="#2D1E2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Sign Out */}
              <TouchableOpacity style={styles.signOutItem} onPress={handleSignOut}>
                <View style={styles.signOutContent}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </View>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Payment Method Manager Modal */}
      <PaymentMethodManager
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: screenHeight * 0.7,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
    elevation: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fecd15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2D1E2F',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D1E2F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  settingsList: {
    paddingHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  caret: {
    marginLeft: 10,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
    backgroundColor: '#FFF5F5',
  },
  signOutContent: {
    flex: 1,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    fontFamily: 'Poppins',
  },
});
