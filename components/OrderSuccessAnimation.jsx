import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OrderSuccessAnimation = ({ visible, onComplete }) => {
  const truckPosition = useRef(new Animated.Value(-200)).current;
  const truckScale = useRef(new Animated.Value(0.5)).current;
  const truckRotation = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const confettiRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Reset all animations
    truckPosition.setValue(-200);
    truckScale.setValue(0.5);
    truckRotation.setValue(0);
    trailOpacity.setValue(0);
    confettiOpacity.setValue(0);
    confettiRotation.setValue(0);

    // Start confetti immediately
    Animated.sequence([
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(confettiOpacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start truck animation
    Animated.parallel([
      // Truck movement from left to right
      Animated.timing(truckPosition, {
        toValue: screenWidth + 200,
        duration: 2500,
        useNativeDriver: true,
      }),
      // Truck scaling effect
      Animated.sequence([
        Animated.timing(truckScale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(truckScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      // Truck rotation
      Animated.timing(truckRotation, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
      // Trail effect
      Animated.sequence([
        Animated.timing(trailOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
      // Confetti rotation
      Animated.timing(confettiRotation, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation complete
      if (onComplete) {
        onComplete();
      }
    });
  };

  const truckRotationInterpolate = truckRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiRotationInterpolate = confettiRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Confetti */}
      <Animated.View
        style={[
          styles.confetti,
          {
            opacity: confettiOpacity,
            transform: [{ rotate: confettiRotationInterpolate }],
          },
        ]}
      >
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.confettiPiece,
              {
                left: Math.random() * screenWidth,
                top: Math.random() * screenHeight,
                backgroundColor: ['#FECD15', '#FB9C12', '#FFD700', '#FFA500'][Math.floor(Math.random() * 4)],
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                transform: [{ rotate: `${Math.random() * 360}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Truck Trail */}
      <Animated.View
        style={[
          styles.trail,
          {
            opacity: trailOpacity,
            transform: [{ translateX: truckPosition }],
          },
        ]}
      />

      {/* Truck Logo */}
      <Animated.View
        style={[
          styles.truckContainer,
          {
            transform: [
              { translateX: truckPosition },
              { scale: truckScale },
              { rotate: truckRotationInterpolate },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/thundertruck logo_transparent.png')}
          style={styles.truckLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  trail: {
    position: 'absolute',
    top: screenHeight / 2 - 50,
    width: 100,
    height: 100,
    backgroundColor: '#FECD15',
    borderRadius: 50,
    opacity: 0.3,
  },
  truckContainer: {
    position: 'absolute',
    top: screenHeight / 2 - 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  truckLogo: {
    width: 100,
    height: 100,
  },
});

export default OrderSuccessAnimation;
