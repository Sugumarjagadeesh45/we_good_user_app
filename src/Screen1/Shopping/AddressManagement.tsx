import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAddress } from './AddressContext';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../../../src/util/backendConfig';

const AddressManagement = () => {
  const navigation = useNavigation();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, fetchAddresses, fetchUserProfileForAddress } = useAddress();
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to get user profile data first
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        setFormData(prev => ({
          ...prev,
          name: profile.name || '',
          phone: profile.phoneNumber || profile.altMobile || '',
          addressLine1: profile.address || '',
        }));
      }
      
      await fetchAddresses();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    // Basic validation
    if (!formData.name || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return;
    }

    // Validate pincode
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addAddress({ 
          ...formData, 
          phone: cleanPhone,
          isDefault: addresses.length === 0 
        });
        Alert.alert('Success', 'Address added successfully');
      }
      
      // Update user profile if this is the primary address
      if (addresses.length === 0 || editingAddress?.isDefault) {
        await updateUserProfileWithAddress(formData);
      }
      
      resetForm();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const updateUserProfileWithAddress = async (addressData: any) => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      if (!token) return;

      const backendUrl = getBackendUrl();
      await axios.put(
        `${backendUrl}/api/users/profile`,
        {
          address: addressData.addressLine1,
          name: addressData.name,
          altMobile: addressData.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local storage
      const currentProfile = await AsyncStorage.getItem('userProfile');
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        const updatedProfile = {
          ...profile,
          address: addressData.addressLine1,
          name: addressData.name,
          altMobile: addressData.phone,
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('Error updating profile with address:', error);
    }
  };

  const resetForm = () => {
    setEditingAddress(null);
    setIsEditing(false);
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    });
  };

  const startEdit = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsEditing(true);
  };

  const handleDelete = (address) => {
    if (addresses.length <= 1) {
      Alert.alert('Error', 'You must have at least one address');
      return;
    }
    
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAddress(address.id)
        },
      ]
    );
  };


  // Replace the getAddressFromCoordinates function with this improved version
const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // First try with OpenStreetMap Nominatim
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'YourAppName/1.0' // Add a user agent to avoid being blocked
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      // Check if response is OK and is JSON
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (nominatimError) {
      console.log('Nominatim service failed, trying alternative:', nominatimError.message);
    }
    
    // Fallback to a simple address format
    console.log('Using fallback address format');
    return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
  } catch (error) {
    console.error('Error in getAddressFromCoordinates:', error);
    // Return a generic address as fallback
    return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};




// Update the fetchCurrentLocation function in AddressManagement.tsx
const fetchCurrentLocation = async () => {
  setFetchingLocation(true);
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Location permission is required');
        setFetchingLocation(false);
        return;
      }
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await getAddressFromCoordinates(latitude, longitude);
          
          // Parse address components (simplified parsing)
          const addressParts = address.split(',');
          const city = addressParts[addressParts.length - 3]?.trim() || 'City';
          const state = addressParts[addressParts.length - 2]?.trim() || 'State';
          const pincodeMatch = address.match(/\b\d{6}\b/);
          const pincode = pincodeMatch ? pincodeMatch[0] : '000000';
          
          setFormData(prev => ({
            ...prev,
            addressLine1: address,
            city: city,
            state: state,
            pincode: pincode,
          }));

          Alert.alert('Success', 'Location fetched successfully');
          
        } catch (error) {
          console.error('Error getting address:', error);
          
          // If we can't get address, at least populate coordinates
          setFormData(prev => ({
            ...prev,
            addressLine1: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            city: 'City',
            state: 'State',
            pincode: '000000',
          }));
          
          Alert.alert('Partial Success', 'Location coordinates fetched. Please fill in the address details manually.');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error('Location Error:', error.message);
        setFetchingLocation(false);
        
        let errorMessage = 'Could not get your current location';
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Please check your location settings.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        Alert.alert('Location Error', errorMessage);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  } catch (error) {
    console.error('Error fetching location:', error);
    setFetchingLocation(false);
    Alert.alert('Error', 'Failed to fetch current location. Please try again.');
  }
};



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        {!isEditing && (
          <TouchableOpacity 
            onPress={() => {
              setIsEditing(true);
              setEditingAddress(null);
              // Pre-fill with user data if available
              loadUserData();
            }}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color="#4caf50" />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
          
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={fetchCurrentLocation}
            disabled={fetchingLocation}
          >
            {fetchingLocation ? (
              <ActivityIndicator size="small" color="#4caf50" />
            ) : (
              <MaterialIcons name="my-location" size={24} color="#4caf50" />
            )}
            <Text style={styles.locationButtonText}>
              {fetchingLocation ? 'Fetching Location...' : 'Use My Current Location'}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
            maxLength={10}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Address Line 1 *"
            value={formData.addressLine1}
            onChangeText={(text) => setFormData({...formData, addressLine1: text})}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Address Line 2 (Optional)"
            value={formData.addressLine2}
            onChangeText={(text) => setFormData({...formData, addressLine2: text})}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City *"
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State *"
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Pincode *"
            value={formData.pincode}
            onChangeText={(text) => setFormData({...formData, pincode: text})}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={formData.country}
            onChangeText={(text) => setFormData({...formData, country: text})}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
            <Text style={styles.saveButtonText}>
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={resetForm}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.addressesList}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{address.name}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressText}>{address.addressLine1}</Text>
              {address.addressLine2 && (
                <Text style={styles.addressText}>{address.addressLine2}</Text>
              )}
              <Text style={styles.addressText}>
                {address.city}, {address.state} - {address.pincode}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>
              
              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setDefaultAddress(address.id)}
                  >
                    <Text style={styles.actionButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => startEdit(address)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                {addresses.length > 1 && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(address)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {addresses.length === 0 && (
            <View style={styles.noAddressContainer}>
              <MaterialIcons name="location-on" size={60} color="#ddd" />
              <Text style={styles.noAddressText}>No addresses saved</Text>
              <Text style={styles.noAddressSubtext}>
                Add your first address to get started with deliveries
              </Text>
              <TouchableOpacity 
                style={styles.addFirstAddressButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.addFirstAddressText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  addressesList: {
    flex: 1,
    padding: 20,
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#e53935',
  },
  noAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noAddressText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noAddressSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  addFirstAddressButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  addFirstAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressManagement;