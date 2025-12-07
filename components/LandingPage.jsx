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
            accessibilityLabel="Thunder Truck Logo"
          />

          <Image
            source={require('../assets/images/thundertruck_emblem.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Thunder Truck Emblem"
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
        overflowX: 'hidden',
        width: '100%',
      },
      default: {
        width: '100%',
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
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: '100vw',
      },
    }),
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
    zIndex: 1,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        paddingHorizontal: screenWidth < 480 ? 16 : screenWidth < 768 ? 24 : screenWidth < 1024 ? 40 : 60,
        flexDirection: screenWidth < 768 ? 'column' : 'row',
        gap: screenWidth < 480 ? 16 : screenWidth < 768 ? 20 : 80,
        paddingBottom: 100,
        justifyContent: screenWidth < 768 ? 'center' : 'space-between',
      },
      default: {
        paddingHorizontal: screenWidth < 480 ? 16 : screenWidth < 768 ? 24 : 40,
      },
    }),
  },
  logoSection: {
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        flex: screenWidth < 768 ? 'none' : 1,
        maxWidth: screenWidth < 768 ? '100%' : 500,
        width: screenWidth < 768 ? '100%' : 'auto',
      },
      default: {
        maxWidth: '100%',
      },
    }),
  },
  textLogoImage: {
    width: 250,
    height: 250,
    ...Platform.select({
      web: {
        width: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 350,
        height: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 350,
        maxWidth: '100%',
        objectFit: 'contain',
      },
      default: {
        width: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 250,
        height: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 250,
        maxWidth: '100%',
      },
    }),
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 30,
    ...Platform.select({
      web: {
        width: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 400,
        height: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 400,
        marginBottom: screenWidth < 768 ? 20 : 0,
        maxWidth: '100%',
        objectFit: 'contain',
      },
      default: {
        width: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 250,
        height: screenWidth < 480 ? 150 : screenWidth < 768 ? 200 : 250,
        marginBottom: screenWidth < 480 ? 16 : screenWidth < 768 ? 20 : 30,
        maxWidth: '100%',
      },
    }),
  },
  ctaSection: {
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        flex: screenWidth < 768 ? 'none' : 1,
        maxWidth: screenWidth < 768 ? '100%' : 500,
        width: screenWidth < 768 ? '100%' : 'auto',
        justifyContent: 'center',
        alignItems: screenWidth < 768 ? 'center' : 'flex-start',
        paddingLeft: screenWidth < 768 ? 0 : 40,
        paddingHorizontal: screenWidth < 480 ? 16 : screenWidth < 768 ? 20 : 0,
      },
      default: {
        paddingHorizontal: screenWidth < 480 ? 16 : screenWidth < 768 ? 24 : 40,
      },
    }),
  },
  tagline: {
    fontSize: screenWidth < 480 ? 16 : screenWidth < 768 ? 18 : 24,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: screenWidth < 768 ? 'center' : 'left',
    marginBottom: screenWidth < 480 ? 16 : screenWidth < 768 ? 20 : 40,
    lineHeight: screenWidth < 480 ? 24 : screenWidth < 768 ? 28 : 36,
    fontFamily: 'Poppins',
    paddingHorizontal: screenWidth < 480 ? 16 : screenWidth < 768 ? 20 : 0,
    width: '100%',
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
        paddingHorizontal: screenWidth < 480 ? 30 : screenWidth < 768 ? 40 : 50,
        paddingVertical: screenWidth < 480 ? 14 : 18,
        borderRadius: 30,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        width: '100%',
        maxWidth: screenWidth < 480 ? '100%' : 300,
      },
      default: {
        paddingHorizontal: screenWidth < 480 ? 24 : 30,
        paddingVertical: screenWidth < 480 ? 12 : 15,
        width: screenWidth < 480 ? '100%' : 'auto',
        minWidth: screenWidth < 480 ? 0 : 200,
      },
    }),
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: screenWidth < 480 ? 16 : 20,
        fontWeight: '700',
        fontFamily: 'Poppins',
      },
      default: {
        fontSize: screenWidth < 480 ? 16 : 18,
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
    ...Platform.select({
      web: {
        paddingHorizontal: screenWidth < 480 ? 30 : screenWidth < 768 ? 40 : 50,
        paddingVertical: screenWidth < 480 ? 14 : 18,
        maxWidth: screenWidth < 480 ? '100%' : 300,
      },
      default: {
        paddingHorizontal: screenWidth < 480 ? 24 : 40,
        paddingVertical: screenWidth < 480 ? 12 : 16,
      },
    }),
  },
  secondaryButtonText: {
    color: '#2D1E2F',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Poppins',
    ...Platform.select({
      web: {
        fontSize: screenWidth < 480 ? 16 : 20,
      },
      default: {
        fontSize: screenWidth < 480 ? 16 : 18,
      },
    }),
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
