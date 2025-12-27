import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Reusable skeleton loader component for images
 * Displays a subtle pulse animation while images are loading
 */
const ImageSkeleton = ({ style, borderRadius = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, style, { borderRadius }]}>
      <Animated.View
        style={[
          styles.pulse,
          {
            opacity,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F0F0',
  },
});

export default ImageSkeleton;
