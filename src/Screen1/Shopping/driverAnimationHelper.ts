import { Animated, Easing, Platform } from 'react-native';
import { LatLng, Marker } from 'react-native-maps';

const ANIMATION_DURATION = 1000; // ms for driver icon to move

/**
 * Calculates the bearing (direction) between two coordinates.
 */
export function calculateBearing(prevLatLng: LatLng, newLatLng: LatLng): number {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const toDeg = (rad: number) => rad * (180 / Math.PI);

  const lat1 = toRad(prevLatLng.latitude);
  const lon1 = toRad(prevLatLng.longitude);
  const lat2 = toRad(newLatLng.latitude);
  const lon2 = toRad(newLatLng.longitude);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Checks if the movement is significant enough to warrant an animation.
 * This helps filter out GPS jitter.
 */
export function isSignificantMovement(prevLatLng: LatLng, newLatLng: LatLng, thresholdMeters = 5): boolean {
    if (!prevLatLng || !newLatLng) return false;

    const getDistance = (p1: LatLng, p2: LatLng): number => {
        const R = 6371e3; // metres
        const φ1 = p1.latitude * Math.PI/180;
        const φ2 = p2.latitude * Math.PI/180;
        const Δφ = (p2.latitude-p1.latitude) * Math.PI/180;
        const Δλ = (p2.longitude-p1.longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // in metres
    };

    const distance = getDistance(prevLatLng, newLatLng);
    return distance > thresholdMeters;
}

/**
 * Animates a driver marker on the map.
 * @param driverCoordinate - The AnimatedRegion value for the marker.
 * @param newLatLng - The new coordinate to move to.
 */
export function animateDriverMovement(
  driverCoordinate: Animated.ValueXY | Animated.AnimatedRegion,
  newLatLng: LatLng
) {
  const newCoordinate = {
    latitude: newLatLng.latitude,
    longitude: newLatLng.longitude,
  };

  if ('timing' in driverCoordinate) { // For AnimatedRegion
      driverCoordinate.timing(newCoordinate, {
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: false, // Required for map markers
      }).start();
  }
}