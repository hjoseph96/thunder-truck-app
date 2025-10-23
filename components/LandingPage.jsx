import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { isAuthenticated } from '../lib/token-manager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Inject hover styles for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'landing-page-hover-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-landing-primary-btn]:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
      }
      [data-landing-secondary-btn]:hover {
        background-color: rgba(45, 30, 47, 0.05) !important;
        transform: translateY(-2px) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function LandingPage({ navigation }) {
  // Redirect authenticated users to home
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          // User is already signed in, redirect to home
          navigation.replace('ExplorerHome');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // If error, stay on landing page
      }
    };

    checkAuthAndRedirect();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Custom striped background */}
      <View style={styles.stripedBackground}>
        {Array.from({ length: Platform.OS === 'web' ? 40 : 20 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stripe,
              {
                left: index * 40 - 100,
                backgroundColor: '#FCD11d', // Light brown stripes
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/images/thunder-truck-text-logo.png')}
            style={styles.textLogoImage}
            resizeMode="contain"
          />

          <Image
            source={require('../assets/images/thundertruck_emblem.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.ctaSection}>
          {Platform.OS === 'web' && (
            <Text style={styles.tagline}>
              Street food, minus the lines: locate trucks, order ahead, and watch your delivery in real time.
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              navigation.navigate('SignIn');
            }}
            {...(Platform.OS === 'web' && { 'data-landing-primary-btn': true })}
          >
            <Text style={styles.navButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                navigation.navigate('SignUp');
              }}
              data-landing-secondary-btn={true}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {Platform.OS !== 'web' && (
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowText}>▲</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fecd15', // Yellow background
    ...Platform.select({
      web: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
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
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        paddingHorizontal: 40,
        flexDirection: 'row',
        gap: 80,
        justifyContent: 'space-between',
      },
    }),
  },
  logoSection: {
    alignItems: 'center',
    ...Platform.select({
      web: {
        flex: 1,
        maxWidth: 500,
      },
    }),
  },
  textLogoImage: {
    width: 250,
    height: 250,
    ...Platform.select({
      web: {
        width: 350,
        height: 350,
      },
    }),
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 30,
    ...Platform.select({
      web: {
        width: 400,
        height: 400,
        marginBottom: 0,
      },
    }),
  },
  ctaSection: {
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        flex: 1,
        maxWidth: 500,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 40,
      },
    }),
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 36,
    fontFamily: 'Poppins',
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
    ...Platform.select({
      web: {
        paddingHorizontal: 50,
        paddingVertical: 18,
        borderRadius: 30,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        width: '100%',
        maxWidth: 300,
      },
    }),
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: 'Poppins',
      },
    }),
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2D1E2F',
    marginTop: 20,
    width: '100%',
    maxWidth: 300,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  },
  secondaryButtonText: {
    color: '#2D1E2F',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Poppins',
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
    color: '#D97706', // Dark orange/gold arrow to match stripes
    fontSize: 32,
    fontWeight: 'bold',
  },
});
