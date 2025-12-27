import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Platform, StyleSheet } from 'react-native';
import ImageSkeleton from './ImageSkeleton';

/**
 * LazyImage component with Intersection Observer for web optimization
 * - On web: Uses Intersection Observer to load images when visible
 * - On native: Loads immediately (React Native handles optimization)
 * - Maintains React Native Image API compatibility
 * - Shows skeleton loader while loading
 */
const LazyImage = ({
  source,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
  lazy = true,
  skeletonBorderRadius = 0,
  fallbackSource,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(!lazy || Platform.OS !== 'web');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Only set up Intersection Observer on web when lazy loading is enabled
    if (Platform.OS !== 'web' || !lazy) {
      return;
    }

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Stop observing once visible
            if (observerRef.current && containerRef.current) {
              observerRef.current.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    // Start observing
    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy]);

  const handleLoad = (event) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError(event);
    }
  };

  // Get style as array for easier manipulation
  const styleArray = Array.isArray(style) ? style : [style];
  const flatStyle = StyleSheet.flatten(styleArray);
  
  // Extract border radius for skeleton
  const borderRadius = skeletonBorderRadius || flatStyle?.borderRadius || 0;

  return (
    <View
      ref={containerRef}
      style={[flatStyle, styles.container]}
      {...(Platform.OS === 'web' ? { 'data-lazy-image': 'true' } : {})}
    >
      {/* Show skeleton while loading */}
      {isLoading && isVisible && !hasError && (
        <ImageSkeleton style={flatStyle} borderRadius={borderRadius} />
      )}

      {/* Show image once visible or immediately on native */}
      {isVisible && (
        <Image
          source={hasError && fallbackSource ? fallbackSource : source}
          style={[
            flatStyle,
            {
              opacity: isLoading ? 0 : 1,
              position: isLoading ? 'absolute' : 'relative',
            },
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default LazyImage;
