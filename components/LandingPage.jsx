import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LandingPage({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom striped background */}
      <View style={styles.stripedBackground}>
        {Array.from({ length: 20 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stripe,
              {
                left: index * 40 - 100,
                backgroundColor: '#D4A574', // Light brown stripes
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.contentContainer}>
        
        <Image
          source={require('../assets/images/thunder-truck-text-logo.png')}
          style={styles.textLogoImage}
          resizeMode="contain"
        />

        <Image
          source={require('../assets/images/thunder-truck-hero-image.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        
        {/* Future navigation button - you can customize this */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            navigation.navigate('SignIn');
          }}
        >
          <Text style={styles.navButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.arrowContainer}>
        <Text style={styles.arrowText}>▲</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fecd15', // Yellow background
  },
  stripedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    width: 20,
    height: screenHeight * 2,
    transform: [{ rotate: '45deg' }],
    top: -screenHeight / 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 86,
    zIndex: 1,
  },
  textLogoImage: {
    width: 250,
    height: 250
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: '#2D1E2F',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1a1419',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  arrowText: {
    color: '#D4A574', // Light brown arrow to match stripes
    fontSize: 32,
    fontWeight: 'bold',
  },
});

