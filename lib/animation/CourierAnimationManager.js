// Courier Animation Manager - Handles smooth movement animations
// Separated from business logic for cleaner architecture

import { Animated } from 'react-native';
import { calculatePolylineDistance, getCoordinateAtDistance } from '../animation-utils';

/**
 * Configuration for different types of courier animations
 */
const ANIMATION_CONFIGS = {
  walking: {
    duration: 30000, // 30 seconds
    smoothingFactor: 0.8,
    minUpdateInterval: 100,
  },
  cycling: {
    duration: 20000, // 20 seconds
    smoothingFactor: 0.9,
    minUpdateInterval: 80,
  },
  driving: {
    duration: 15000, // 15 seconds
    smoothingFactor: 0.95,
    minUpdateInterval: 60,
  },
  default: {
    duration: 20000,
    smoothingFactor: 0.8,
    minUpdateInterval: 100,
  },
};

/**
 * Animation state for a single courier
 */
class CourierAnimation {
  constructor(courierId, route, animationType = 'default') {
    this.courierId = courierId;
    this.route = route;
    this.config = ANIMATION_CONFIGS[animationType] || ANIMATION_CONFIGS.default;

    // Animation state
    this.animatedDistance = new Animated.Value(0);
    this.totalDistance = calculatePolylineDistance(route);
    this.isRunning = false;
    this.listeners = [];
    this.onUpdate = null;
    this.onComplete = null;

    console.log(`Created animation for ${courierId}: ${(this.totalDistance / 1000).toFixed(2)}km`);
  }

  /**
   * Start the animation
   */
  start(onUpdate, onComplete) {
    if (this.isRunning) {
      console.warn(`Animation for ${this.courierId} is already running`);
      return;
    }

    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.isRunning = true;

    // Add distance listener
    const listenerId = this.animatedDistance.addListener(({ value }) => {
      this.handleDistanceUpdate(value);
    });
    this.listeners.push(listenerId);

    // Start the animation
    Animated.timing(this.animatedDistance, {
      toValue: this.totalDistance,
      duration: this.config.duration,
      useNativeDriver: false,
    }).start((finished) => {
      if (finished) {
        console.log(`Animation completed for ${this.courierId}`);
        this.isRunning = false;
        if (this.onComplete) {
          this.onComplete(this.courierId);
        }
      }
    });

    console.log(`Started animation for ${this.courierId} (${this.config.duration}ms)`);
  }

  /**
   * Handle distance update and calculate current position
   */
  handleDistanceUpdate(distance) {
    try {
      const currentPosition = getCoordinateAtDistance(this.route, distance);
      const location = {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        timestamp: Date.now(),
        progress: distance / this.totalDistance,
      };

      if (this.onUpdate) {
        this.onUpdate(this.courierId, location);
      }
    } catch (error) {
      console.error(`Error updating position for ${this.courierId}:`, error);
    }
  }

  /**
   * Stop the animation
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.animatedDistance.stopAnimation();
    this.cleanup();
    this.isRunning = false;

    console.log(`Stopped animation for ${this.courierId}`);
  }

  /**
   * Pause the animation
   */
  pause() {
    if (this.isRunning) {
      this.animatedDistance.stopAnimation();
      // Note: We don't change isRunning state for pause
      console.log(`Paused animation for ${this.courierId}`);
    }
  }

  /**
   * Resume the animation from current position
   */
  resume() {
    if (this.isRunning) {
      // Calculate remaining distance and time
      this.animatedDistance.addListener(({ value }) => {
        const remainingDistance = this.totalDistance - value;
        const remainingTime = (remainingDistance / this.totalDistance) * this.config.duration;

        // Resume animation
        Animated.timing(this.animatedDistance, {
          toValue: this.totalDistance,
          duration: remainingTime,
          useNativeDriver: false,
        }).start((finished) => {
          if (finished && this.onComplete) {
            this.onComplete(this.courierId);
          }
        });
      });

      console.log(`Resumed animation for ${this.courierId}`);
    }
  }

  /**
   * Clean up listeners and resources
   */
  cleanup() {
    this.listeners.forEach(listenerId => {
      this.animatedDistance.removeListener(listenerId);
    });
    this.listeners = [];
    this.onUpdate = null;
    this.onComplete = null;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress() {
    // This is async, but we can return last known value
    let currentValue = 0;
    this.animatedDistance.addListener(({ value }) => {
      currentValue = value;
    });
    return currentValue / this.totalDistance;
  }
}

/**
 * Manager for all courier animations
 */
export class CourierAnimationManager {
  constructor() {
    this.animations = new Map();
    this.globalOnUpdate = null;
    this.globalOnComplete = null;
  }

  /**
   * Set global event handlers
   */
  setGlobalHandlers(onUpdate, onComplete) {
    this.globalOnUpdate = onUpdate;
    this.globalOnComplete = onComplete;
  }

  /**
   * Start animation for a courier
   */
  startAnimation(courierId, route, animationType = 'default') {
    // Stop existing animation if any
    this.stopAnimation(courierId);

    // Create new animation
    const animation = new CourierAnimation(courierId, route, animationType);
    this.animations.set(courierId, animation);

    // Start with global handlers
    animation.start(
      (id, location) => {
        if (this.globalOnUpdate) {
          this.globalOnUpdate(id, location);
        }
      },
      (id) => {
        if (this.globalOnComplete) {
          this.globalOnComplete(id);
        }
        // Auto-cleanup completed animation
        this.stopAnimation(id);
      }
    );

    return true;
  }

  /**
   * Stop animation for a courier
   */
  stopAnimation(courierId) {
    const animation = this.animations.get(courierId);
    if (animation) {
      animation.stop();
      this.animations.delete(courierId);
      return true;
    }
    return false;
  }

  /**
   * Pause animation for a courier
   */
  pauseAnimation(courierId) {
    const animation = this.animations.get(courierId);
    if (animation) {
      animation.pause();
      return true;
    }
    return false;
  }

  /**
   * Resume animation for a courier
   */
  resumeAnimation(courierId) {
    const animation = this.animations.get(courierId);
    if (animation) {
      animation.resume();
      return true;
    }
    return false;
  }

  /**
   * Stop all animations
   */
  stopAllAnimations() {
    const animationIds = Array.from(this.animations.keys());
    animationIds.forEach(id => this.stopAnimation(id));
    console.log(`Stopped ${animationIds.length} animations`);
    return animationIds.length;
  }

  /**
   * Pause all animations
   */
  pauseAllAnimations() {
    let pausedCount = 0;
    this.animations.forEach((animation, id) => {
      animation.pause();
      pausedCount++;
    });
    console.log(`Paused ${pausedCount} animations`);
    return pausedCount;
  }

  /**
   * Resume all animations
   */
  resumeAllAnimations() {
    let resumedCount = 0;
    this.animations.forEach((animation, id) => {
      animation.resume();
      resumedCount++;
    });
    console.log(`Resumed ${resumedCount} animations`);
    return resumedCount;
  }

  /**
   * Get animation status
   */
  getAnimationStatus(courierId) {
    const animation = this.animations.get(courierId);
    if (!animation) {
      return { exists: false };
    }

    return {
      exists: true,
      isRunning: animation.isRunning,
      progress: animation.getProgress(),
      totalDistance: animation.totalDistance,
      config: animation.config,
    };
  }

  /**
   * Get status of all animations
   */
  getAllAnimationStatus() {
    const status = {};
    this.animations.forEach((animation, id) => {
      status[id] = this.getAnimationStatus(id);
    });
    return status;
  }

  /**
   * Clean up all animations and reset
   */
  reset() {
    const count = this.stopAllAnimations();
    this.globalOnUpdate = null;
    this.globalOnComplete = null;
    console.log(`Reset animation manager (cleaned up ${count} animations)`);
  }
}

// Export singleton instance
export const courierAnimationManager = new CourierAnimationManager();
export default courierAnimationManager;