import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ImageTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Loading Test</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test 1: Picsum Photos (HTTPS)</Text>
        <Image
          source={{ uri: 'https://picsum.photos/100/100?random=1' }}
          style={styles.testImage}
          onLoadStart={() => console.log('Picsum image loading started')}
          onLoad={() => console.log('Picsum image loaded successfully')}
          onError={(error) => console.error('Picsum image error:', error.nativeEvent)}
        />
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test 2: Placeholder.com (HTTPS)</Text>
        <Image
          source={{ uri: 'https://via.placeholder.com/100x100/FF0000/FFFFFF?text=Test' }}
          style={styles.testImage}
          onLoadStart={() => console.log('Placeholder image loading started')}
          onLoad={() => console.log('Placeholder image loaded successfully')}
          onError={(error) => console.error('Placeholder image error:', error.nativeEvent)}
        />
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test 3: HTTP URL (might fail)</Text>
        <Image
          source={{ uri: 'http://via.placeholder.com/100x100/00FF00/000000?text=HTTP' }}
          style={styles.testImage}
          onLoadStart={() => console.log('HTTP image loading started')}
          onLoad={() => console.log('HTTP image loaded successfully')}
          onError={(error) => console.error('HTTP image error:', error.nativeEvent)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  testImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
