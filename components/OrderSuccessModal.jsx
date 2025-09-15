import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OrderSuccessModal = ({ visible, onComplete }) => {
  const [animationValues] = useState(() => ({
    checkScale: new Animated.Value(0),
    circleScale: new Animated.Value(0),
    confettiOpacity: new Animated.Value(0),
    confettiRotation: new Animated.Value(0),
    modalOpacity: new Animated.Value(0),
  }));

  const {
    checkScale,
    circleScale,
    confettiOpacity,
    confettiRotation,
    modalOpacity,
  } = animationValues;

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      // Reset animation values when not visible
      checkScale.setValue(0);
      circleScale.setValue(0);
      confettiOpacity.setValue(0);
      confettiRotation.setValue(0);
      modalOpacity.setValue(0);
    }
  }, [visible]);

  const startAnimation = () => {
    // Fade in modal
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Start confetti immediately
    Animated.parallel([
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(confettiRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate circle and check
    Animated.sequence([
      // Circle appears first
      Animated.spring(circleScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Then check mark appears with bounce
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-close after 2 seconds
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);
  };

  const confettiRotationInterpolate = confettiRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
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
          {[...Array(15)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  left: Math.random() * screenWidth,
                  top: Math.random() * screenHeight,
                  backgroundColor: ['#FECD15', '#FB9C12', '#4CAF50', '#FFD700'][Math.floor(Math.random() * 4)],
                  width: Math.random() * 6 + 4,
                  height: Math.random() * 6 + 4,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Success Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.circle,
                { transform: [{ scale: circleScale }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.checkContainer,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                <MaterialIcons name="check" size={48} color="#fff" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Success Text */}
          <Text style={styles.title}>Order Complete! 🎉</Text>
          
          <Text style={styles.message}>
            Your delicious order is on its way! Track its real-time progress on our live map and get ready for an amazing meal experience.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: screenWidth - 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#132a13',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Cairo',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Cairo',
  },
});

export default OrderSuccessModal;
