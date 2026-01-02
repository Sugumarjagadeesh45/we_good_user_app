import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getBackendUrl } from '../util/backendConfig';

export interface UserData {
  name: string;
  phoneNumber: string;
  customerId: string;
  email: string;
  gender: string;
  altMobile: string;
  profilePicture: string;
  address: string;
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      const backendUrl = getBackendUrl();

      if (!token) {
        // Try to get from AsyncStorage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          setUserData(JSON.parse(storedProfile));
        }
        return;
      }

      const response = await axios.get(`${backendUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data.success) {
        const user = response.data.user;
        const userData: UserData = {
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          customerId: user.customerId || '',
          email: user.email || '',
          gender: user.gender || '',
          altMobile: user.altMobile || '',
          profilePicture: user.profilePicture || '',
          address: user.address || '',
        };
        
        setUserData(userData);
        await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
      
      // Try to get from AsyncStorage as fallback
      const storedProfile = await AsyncStorage.getItem('userProfile');
      if (storedProfile) {
        setUserData(JSON.parse(storedProfile));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const refreshUserData = () => {
    fetchUserData();
  };

  const updateUserData = async (updates: Partial<UserData>) => {
    try {
      if (userData) {
        const updatedData = { ...userData, ...updates };
        setUserData(updatedData);
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  return { 
    userData, 
    loading, 
    error, 
    refreshUserData, 
    updateUserData,
    refetch: fetchUserData 
  };
};