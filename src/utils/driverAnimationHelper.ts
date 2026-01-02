import { Animated, Easing } from 'react-native';

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return distance;
};

/**
 * Calculate bearing (direction) between two coordinates in degrees
 */
export const calculateBearing = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number => {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
};

/**
 * Animate driver marker position smoothly
 */
export const animateDriverMovement = (
  animatedValues: {
    latitude: Animated.Value;
    longitude: Animated.Value;
    rotation: Animated.Value;
  },
  newCoordinate: { latitude: number; longitude: number },
  bearing: number = 0,
  onComplete?: () => void
): void => {
  // Calculate distance for animation duration
  const oldLat = (animatedValues.latitude as any)._value || newCoordinate.latitude;
  const oldLng = (animatedValues.longitude as any)._value || newCoordinate.longitude;

  const distance = calculateDistance(
    { latitude: oldLat, longitude: oldLng },
    newCoordinate
  );

  // Calculate duration based on distance (1000ms minimum, 3000ms maximum)
  // Formula: 1 second per 100 meters, capped at 3 seconds
  const duration = Math.min(Math.max(distance * 10000, 1000), 3000);

  // Animate position and rotation
  Animated.parallel([
    Animated.timing(animatedValues.latitude, {
      toValue: newCoordinate.latitude,
      duration: duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }),
    Animated.timing(animatedValues.longitude, {
      toValue: newCoordinate.longitude,
      duration: duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }),
    Animated.timing(animatedValues.rotation, {
      toValue: bearing,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: false,
    }),
  ]).start(onComplete);
};

/**
 * Initialize animated values for a driver
 */
export const initializeDriverAnimation = (
  coordinate: { latitude: number; longitude: number }
): {
  latitude: Animated.Value;
  longitude: Animated.Value;
  rotation: Animated.Value;
} => {
  return {
    latitude: new Animated.Value(coordinate.latitude),
    longitude: new Animated.Value(coordinate.longitude),
    rotation: new Animated.Value(0),
  };
};

/**
 * Stop all animations for cleanup
 */
export const stopDriverAnimations = (animatedValues: {
  latitude: Animated.Value;
  longitude: Animated.Value;
  rotation: Animated.Value;
}): void => {
  animatedValues.latitude.stopAnimation();
  animatedValues.longitude.stopAnimation();
  animatedValues.rotation.stopAnimation();
};

/**
 * Interpolate polyline coordinates for smoother route display
 */
export const interpolateCoordinates = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  steps: number = 10
): Array<{ latitude: number; longitude: number }> => {
  const points: Array<{ latitude: number; longitude: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude: start.longitude + (end.longitude - start.longitude) * fraction,
    });
  }

  return points;
};

/**
 * Check if location update is significant enough to animate
 * (filters GPS jitter)
 */
export const isSignificantMovement = (
  oldLocation: { latitude: number; longitude: number },
  newLocation: { latitude: number; longitude: number },
  thresholdMeters: number = 5
): boolean => {
  const distance = calculateDistance(oldLocation, newLocation);
  return distance * 1000 > thresholdMeters; // Convert km to meters
};
