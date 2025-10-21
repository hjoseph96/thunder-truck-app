import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const StarRating = ({ rating, onRatingChange, size = 24 }) => {
  const handleStarPress = (starValue) => {
    // If clicking the same star again, allow half-star rating
    if (rating === starValue) {
      onRatingChange(starValue - 0.5);
    } else {
      onRatingChange(starValue);
    }
  };

  const renderStar = (starNumber) => {
    const isHalfStar = rating >= starNumber - 0.5 && rating < starNumber;
    const isFullStar = rating >= starNumber;
    
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => handleStarPress(starNumber)}
        style={styles.starButton}
        activeOpacity={0.7}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={isFullStar ? '#FFD700' : '#E0E0E0'}
            stroke={isFullStar ? '#FFD700' : '#E0E0E0'}
            strokeWidth="1"
          />
          {isHalfStar && (
            <Path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="#FFD700"
              stroke="#FFD700"
              strokeWidth="1"
              clipPath="url(#halfStar)"
            />
          )}
        </Svg>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(renderStar)}
    </View>
  );
};

const MenuItemReviewModal = ({ 
  visible, 
  onClose, 
  menuItems, 
  onSubmitReviews,
  menuItemImages = {}
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [reviews, setReviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentItem = menuItems[currentItemIndex];
  const isLastItem = currentItemIndex === menuItems.length - 1;
  const currentReview = reviews[currentItem.id] || { rating: 0, comment: '' };

  const handleRatingChange = (rating) => {
    setReviews(prev => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        rating,
        comment: prev[currentItem.id]?.comment || ''
      }
    }));
  };

  const handleCommentChange = (comment) => {
    setReviews(prev => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        rating: prev[currentItem.id]?.rating || 0,
        comment
      }
    }));
  };

  const handleNext = () => {
    if (isLastItem) {
      handleSubmit();
    } else {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitReviews(reviews);
      onClose();
    } catch (error) {
      console.error('Error submitting reviews:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isLastItem) {
      handleSubmit();
    } else {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const canProceed = currentReview.rating > 0;

  if (!visible || !currentItem) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                fill="#666"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Order</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentItemIndex + 1} of {menuItems.length}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((currentItemIndex + 1) / menuItems.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Menu Item Info */}
          <View style={styles.itemInfoContainer}>
            <View style={styles.itemImageContainer}>
              {/* TODO: Enable menu item images after backend implementation */}
              {/* {menuItemImages[currentItem.menuItemId] ? (
                <Image
                  source={{ uri: menuItemImages[currentItem.menuItemId] }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : ( */}
                <View style={styles.itemImagePlaceholder}>
                  <MaterialIcons name="restaurant" size={40} color="#999" />
                </View>
              {/* )} */}
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{currentItem.menuItemName}</Text>
              <Text style={styles.itemPrice}>${currentItem.price}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>How was this item?</Text>
            <Text style={styles.ratingSubtitle}>Tap a star to rate</Text>
            
            <StarRating
              rating={currentReview.rating}
              onRatingChange={handleRatingChange}
              size={32}
            />
            
            {currentReview.rating > 0 && (
              <Text style={styles.ratingValue}>
                {currentReview.rating.toFixed(1)} stars
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Tell us more (optional)</Text>
            <Text style={styles.commentSubtitle}>
              Did you enjoy it? Were there any issues?
            </Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts about this item..."
              placeholderTextColor="#999"
              value={currentReview.comment}
              onChangeText={handleCommentChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            <Text style={styles.skipButtonText}>
              {isLastItem ? 'Skip All' : 'Skip'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canProceed && styles.submitButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLastItem ? 'Submit Reviews' : 'Next Item'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  progressContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    paddingVertical: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D1E2F',
    borderRadius: 2,
  },
  itemInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  ratingSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  commentSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  commentSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    minHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#2D1E2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
});

export default MenuItemReviewModal;
