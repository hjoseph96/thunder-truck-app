import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

const { width, height } = Dimensions.get('window');

export default function MarkdownViewer({ navigation, route }) {
  const { title, markdownContent, type } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (markdownContent) {
      setContent(markdownContent);
      setIsLoading(false);
    }
  }, [markdownContent]);

  const markdownStyles = {
    body: {
      color: 'white',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 16,
    },
    paragraph: {
      color: 'white',
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
    },
    strong: {
      color: 'white',
      fontWeight: 'bold',
    },
    em: {
      color: 'white',
      fontStyle: 'italic',
    },
    list_item: {
      color: 'white',
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 8,
    },
    bullet_list: {
      marginBottom: 16,
    },
    ordered_list: {
      marginBottom: 16,
    },
    link: {
      color: '#fecd15',
      textDecorationLine: 'underline',
    },
    blockquote: {
      backgroundColor: '#333',
      borderLeftWidth: 4,
      borderLeftColor: '#fecd15',
      paddingLeft: 16,
      marginVertical: 12,
    },
    code_block: {
      backgroundColor: '#333',
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      marginVertical: 12,
    },
    code_inline: {
      backgroundColor: '#333',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    hr: {
      backgroundColor: '#666',
      height: 1,
      marginVertical: 20,
    },
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D1E2F" />
        <Text style={styles.loadingText}>Loading {type}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Markdown style={markdownStyles}>
          {content}
        </Markdown>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fecd15',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fecd15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2D1E2F',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fecd15',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#2D1E2F',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1E2F',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    backgroundColor: '#2D1E2F',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
});
