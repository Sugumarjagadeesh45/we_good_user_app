// DriverLocationService.ts
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';
import database from '@react-native-firebase/database';
import { Platform, PermissionsAndroid } from 'react-native';

interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

class DriverLocationService {
  private driverId: string | null = null;
  private lastLocation: { lat: number; lng: number } | null = null;
  private isTracking = false;
  private locationWatchId: number | null = null;

  async requestLocationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);
        
        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
          granted['android.permission.ACCESS_BACKGROUND_LOCATION'] === 'granted'
        );
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async pushLocationToFirebase(location: LocationUpdate): Promise<void> {
    try {
      await database()
        .ref(`drivers/${this.driverId}/location`)
        .set({
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        });
      
      console.log('✅ Location pushed to Firebase:', location.lat, location.lng);
    } catch (error) {
      console.error('❌ Firebase push error:', error);
    }
  }

  async startTracking(driverId: string): Promise<void> {
    this.driverId = driverId;
    
    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permissions denied');
    }

    // Configure background geolocation
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 1, // Minimum 1 meter movement
      stopTimeout: 1,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      foregroundService: true,
      locationUpdateInterval: 1000, // 1 second (Android)
      fastestLocationUpdateInterval: 1000, // 1 second (Android)
      deferTime: 0, // Send immediately
      activityType: BackgroundGeolocation.ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION,
      pausesLocationUpdatesAutomatically: false,
      saveBatteryOnBackground: false,
      preventSuspend: true,
      heartbeatInterval: 60,
      foregroundServiceNotificationTitle: 'Driver App Active',
      foregroundServiceNotificationText: 'Tracking your location',
      notificationPriority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
    });

    // Listen to location updates
    BackgroundGeolocation.onLocation(
      async (location) => {
        const { latitude, longitude, heading, speed, accuracy, timestamp } = location.coords;

        // Check if moved at least 0.5 meters (to filter GPS jitter)
        if (this.lastLocation) {
          const distance = this.calculateDistance(
            this.lastLocation.lat,
            this.lastLocation.lng,
            latitude,
            longitude
          );
          
          if (distance < 0.5) {
            console.log('⏭️ Skipped: Movement < 0.5m (GPS jitter)');
            return;
          }
        }

        const locationUpdate: LocationUpdate = {
          driverId: this.driverId!,
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 0,
          timestamp: Date.now(),
        };

        // Push to Firebase immediately
        await this.pushLocationToFirebase(locationUpdate);

        this.lastLocation = { lat: latitude, lng: longitude };
      },
      (error) => {
        console.error('❌ Location error:', error);
      }
    );

    // Start tracking
    await BackgroundGeolocation.start();
    this.isTracking = true;
    
    console.log('🚀 Background tracking started for driver:', driverId);

    // FALLBACK: High-frequency foreground tracking (every 2 seconds)
    this.startForegroundTracking();
  }

  private startForegroundTracking(): void {
    this.locationWatchId = Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;

        if (this.lastLocation) {
          const distance = this.calculateDistance(
            this.lastLocation.lat,
            this.lastLocation.lng,
            latitude,
            longitude
          );
          
          if (distance < 0.5) return;
        }

        const locationUpdate: LocationUpdate = {
          driverId: this.driverId!,
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 0,
          timestamp: Date.now(),
        };

        await this.pushLocationToFirebase(locationUpdate);
        this.lastLocation = { lat: latitude, lng: longitude };
      },
      (error) => console.error('Foreground tracking error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 1, // 1 meter
        interval: 2000, // 2 seconds (Android)
        fastestInterval: 1000, // 1 second (Android)
        timeout: 5000,
        maximumAge: 1000,
      }
    );
  }

  async stopTracking(): Promise<void> {
    if (this.locationWatchId !== null) {
      Geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }

    await BackgroundGeolocation.stop();
    this.isTracking = false;
    
    console.log('🛑 Tracking stopped');
  }

  getTrackingStatus(): boolean {
    return this.isTracking;
  }
}

export default new DriverLocationService();