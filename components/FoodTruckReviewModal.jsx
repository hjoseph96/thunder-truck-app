import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';

const StarRating = ({ rating, onRatingChange, size = 32 }) => {
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

const FoodTruckReviewModal = ({ 
  visible, 
  onClose, 
  foodTruckName,
  onSubmitReview
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitReview({
        rating,
        comment: comment.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error submitting food truck review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const canSubmit = rating > 0;

  if (!visible) return null;

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
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L17.59 19L19 17.59L13.41 12L19 6.41Z"
                fill="#666"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Experience</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Food Truck Info */}
          <View style={styles.truckInfoContainer}>
            <View style={styles.truckIconContainer}>
              <MaterialIcons name="restaurant" size={48} color="#2D1E2F" />
            </View>
            <View style={styles.truckDetails}>
              <Text style={styles.truckName}>{foodTruckName}</Text>
              <Text style={styles.truckSubtitle}>How was your overall experience?</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Rate this food truck</Text>
            <Text style={styles.ratingSubtitle}>Tap a star to rate</Text>
            
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={40}
            />
            
            {rating > 0 && (
              <Text style={styles.ratingValue}>
                {rating.toFixed(1)} stars
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Tell us more (optional)</Text>
            <Text style={styles.commentSubtitle}>
              Did you enjoy the food? Were there any issues?
            </Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts about this food truck..."
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  truckInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  truckIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  truckDetails: {
    flex: 1,
  },
  truckName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  truckSubtitle: {
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
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    marginHorizontal: 6,
    padding: 4,
  },
  ratingValue: {
    fontSize: 18,
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
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    outlineStyle: 'none', // Remove outline on web
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

export default FoodTruckReviewModal;
