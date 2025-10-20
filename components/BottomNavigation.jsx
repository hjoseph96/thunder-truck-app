import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg';
import UserProfileView from './UserProfileView';

export default function BottomNavigation({ navigation, userData }) {
  const [showProfile, setShowProfile] = useState(false);
  const handleHomePress = () => {
    // Navigate to home/explorer screen
    navigation.navigate('ExplorerHome');
  };

  const handleMapPress = () => {
    // Navigate to map screen
    navigation.navigate('MapPage');
  };

  const handleExplorePress = () => {
    // Handle explore button press
    console.log('Explore button pressed');
  };

  const handleNotificationsPress = () => {
    // Navigate to notifications screen
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    setShowProfile(true);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M16 28L14.0666 26.2667C11.8222 24.2444 9.96663 22.5 8.49996 21.0333C7.03329 19.5667 5.86663 18.2498 4.99996 17.0827C4.13329 15.9164 3.52796 14.8444 3.18396 13.8667C2.83996 12.8889 2.66751 11.8889 2.66663 10.8667C2.66663 8.77777 3.36663 7.03332 4.76663 5.63333C6.16663 4.23333 7.91107 3.53333 9.99996 3.53333C11.1555 3.53333 12.2555 3.77777 13.3 4.26666C14.3444 4.75555 15.2444 5.44444 16 6.33333C16.7555 5.44444 17.6555 4.75555 18.7 4.26666C19.7444 3.77777 20.8444 3.53333 22 3.53333C24.0888 3.53333 25.8333 4.23333 27.2333 5.63333C28.6333 7.03332 29.3333 8.77777 29.3333 10.8667C29.3333 11.8889 29.1613 12.8889 28.8173 13.8667C28.4733 14.8444 27.8675 15.9164 27 17.0827C26.1333 18.2498 24.9666 19.5667 23.5 21.0333C22.0333 22.5 20.1777 24.2444 17.9333 26.2667L16 28Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={handleMapPress}>
        <Svg width="36" height="32" viewBox="0 0 36 32">
          <G clipPath="url(#clip0_29_622)">
            <Path d="M18 0C13.6506 0 10.125 3.52563 10.125 7.875C10.125 11.3912 15.2719 17.8 17.2437 20.1262C17.6431 20.5975 18.3575 20.5975 18.7563 20.1262C20.7281 17.8 25.875 11.3912 25.875 7.875C25.875 3.52563 22.3494 0 18 0ZM1.2575 13.4969C0.886361 13.6453 0.568207 13.9016 0.344068 14.2325C0.11993 14.5635 8.8888e-05 14.954 0 15.3538L0 30.9988C0 31.7063 0.714375 32.19 1.37125 31.9275L10 28V13.4325C9.4475 12.4338 8.99562 11.4613 8.67188 10.5312L1.2575 13.4969ZM18 22.4794C17.1206 22.4794 16.2887 22.0931 15.7181 21.4194C14.4894 19.9694 13.1825 18.3181 12 16.6244V27.9994L24 31.9994V16.625C22.8175 18.3181 21.5113 19.97 20.2819 21.42C19.7113 22.0931 18.8794 22.4794 18 22.4794ZM34.6287 10.0725L26 14V32L34.7425 28.5031C35.1137 28.3548 35.4319 28.0985 35.656 27.7675C35.8802 27.4366 36 27.046 36 26.6462V11.0013C36 10.2938 35.2856 9.81 34.6287 10.0725Z" fill="#fecd15"/>
          </G>

          <Defs>
            <ClipPath id="clip0_29_622">
              <Rect width="36" height="32" fill="#2D1E2F"/>
            </ClipPath>
          </Defs>
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exploreButton} onPress={handleExplorePress}>
        <View style={styles.exploreButtonBackground}>
          <Svg width="48" height="48" viewBox="0 0 48 48">
            <Path d="M13 35L28 28L35 13L20 20L13 35ZM24 26C23.4333 26 22.9587 25.808 22.576 25.424C22.1933 25.04 22.0013 24.5653 22 24C22 23.4333 22.192 22.9587 22.576 22.576C22.96 22.1933 23.4347 22.0013 24 22C24.5667 22 25.042 22.192 25.426 22.576C25.81 22.96 26.0013 23.4347 26 24C26 24.5667 25.808 25.042 25.424 25.426C25.04 25.81 24.5653 26.0013 24 26ZM24 44C21.2333 44 18.6333 43.4747 16.2 42.424C13.7667 41.3733 11.65 39.9487 9.85 38.15C8.05 36.35 6.62533 34.2333 5.576 31.8C4.52667 29.3667 4.00133 26.7667 4 24C4 21.2333 4.52533 18.6333 5.576 16.2C6.62667 13.7667 8.05133 11.65 9.85 9.85C11.65 8.05 13.7667 6.62533 16.2 5.576C18.6333 4.52667 21.2333 4.00133 24 4C26.7667 4 29.3667 4.52533 31.8 5.576C34.2333 6.62667 36.35 8.05133 38.15 9.85C39.95 11.65 41.3753 13.7667 42.426 16.2C43.4767 18.6333 44.0013 21.2333 44 24C44 26.7667 43.4747 29.3667 42.424 31.8C41.3733 34.2333 39.9487 36.35 38.15 38.15C36.35 39.95 34.2333 41.3753 31.8 42.426C29.3667 43.4767 26.7667 44.0013 24 44Z" fill="#2D1E2F"/>
          </Svg>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={handleNotificationsPress}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path fillRule="evenodd" clipRule="evenodd" d="M16 1.33337C15.6178 1.33332 15.24 1.41544 14.8923 1.57416C14.5446 1.73287 14.2351 1.96448 13.9847 2.25329C13.7343 2.5421 13.549 2.88135 13.4412 3.24806C13.3334 3.61477 13.3057 4.00036 13.36 4.37871C11.4275 4.94927 9.73142 6.12967 8.52506 7.7436C7.31869 9.35753 6.66678 11.3184 6.66667 13.3334V24H5.33333C4.97971 24 4.64057 24.1405 4.39052 24.3906C4.14048 24.6406 4 24.9798 4 25.3334C4 25.687 4.14048 26.0261 4.39052 26.2762C4.64057 26.5262 4.97971 26.6667 5.33333 26.6667H26.6667C27.0203 26.6667 27.3594 26.5262 27.6095 26.2762C27.8595 26.0261 28 25.687 28 25.3334C28 24.9798 27.8595 24.6406 27.6095 24.3906C27.3594 24.1405 27.0203 24 26.6667 24H25.3333V13.3334C25.3332 11.3184 24.6813 9.35753 23.4749 7.7436C22.2686 6.12967 20.5725 4.94927 18.64 4.37871C18.6943 4.00036 18.6666 3.61477 18.5588 3.24806C18.451 2.88135 18.2657 2.5421 18.0153 2.25329C17.7649 1.96448 17.4554 1.73287 17.1077 1.57416C16.76 1.41544 16.3822 1.33332 16 1.33337ZM18.6667 29.3334C18.6667 29.687 18.5262 30.0261 18.2761 30.2762C18.0261 30.5262 17.687 30.6667 17.3333 30.6667H14.6667C14.313 30.6667 13.9739 30.5262 13.7239 30.2762C13.4738 30.0261 13.3333 29.687 13.3333 29.3334C13.3333 28.9798 13.4738 28.6406 13.7239 28.3906C13.9739 28 14.313 28 14.6667 28H17.3333C17.687 28 18.0261 28.1405 18.2761 28.3906C18.5262 28.6406 18.6667 28.9798 18.6667 29.3334Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
        <Svg width="32" height="32" viewBox="0 0 32 32">
          <Path d="M5.33337 29.3334C5.33337 26.5044 6.45718 23.7913 8.45757 21.7909C10.458 19.7905 13.1711 18.6667 16 18.6667C18.829 18.6667 21.5421 19.7905 23.5425 21.7909C25.5429 23.7913 26.6667 26.5044 26.6667 29.3334H5.33337ZM16 17.3334C11.58 17.3334 8.00004 13.7534 8.00004 9.33337C8.00004 4.91337 11.58 1.33337 16 1.33337C20.42 1.33337 24 4.91337 24 9.33337C24 13.7534 20.42 17.3334 16 17.3334Z" fill="#fecd15"/>
        </Svg>
      </TouchableOpacity>

      {/* User Profile Modal */}
      <UserProfileView
        visible={showProfile}
        onClose={handleProfileClose}
        userData={userData}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2D1E2F',
    borderTopColor: '#000',
    borderTopWidth: 1,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 16,
    // Fixed to bottom - platform specific
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        zIndex: 98,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        borderTopWidth: 1,
      },
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  exploreButton: {
    position: 'relative',
    marginTop: -30,
  },
  exploreButtonBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fecd15',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for the center button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
