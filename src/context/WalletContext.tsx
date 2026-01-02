import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getBackendUrl } from '../util/backendConfig';
import socket from '../socket';

interface WalletContextType {
  walletBalance: number;
  loading: boolean;
  updateWallet: (newBalance: number) => Promise<void>;
  fetchWalletBalance: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch wallet balance from backend
  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      const backendUrl = getBackendUrl();

      console.log('💰 Fetching wallet balance from:', `${backendUrl}/api/wallet/balance`);
      console.log('🔑 Using token:', token?.substring(0, 20) + '...');

      const response = await axios.get(`${backendUrl}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      // Backend can return either "wallet" or "balance" field - support both
      const balance = response.data.wallet ?? response.data.balance ?? 0;

      setWalletBalance(balance);
      await AsyncStorage.setItem('userWalletBalance', balance.toString());
      console.log('✅ Wallet balance fetched:', balance);
      console.log('   Full response:', JSON.stringify(response.data));
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
      // Fallback to AsyncStorage
      try {
        const cached = await AsyncStorage.getItem('userWalletBalance');
        if (cached) {
          setWalletBalance(parseFloat(cached));
          console.log('💾 Using cached wallet balance:', cached);
        }
      } catch (cacheError) {
        console.error('❌ Error reading cached balance:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Update wallet balance
  const updateWallet = useCallback(async (newBalance: number) => {
    console.log('💰 Updating wallet balance to:', newBalance);
    setWalletBalance(newBalance);
    await AsyncStorage.setItem('userWalletBalance', newBalance.toString());
  }, []);

  // Refresh wallet (same as fetch, for manual refresh)
  const refreshWallet = useCallback(async () => {
    await fetchWalletBalance();
  }, [fetchWalletBalance]);

  // Fetch wallet on mount
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // Listen for wallet updates from socket
  useEffect(() => {
    const handleWalletUpdate = (data: any) => {
      const balance = data?.walletBalance ?? data?.wallet ?? data?.balance;
      console.log('🔔 Wallet update received via socket:', balance);
      if (balance !== undefined) {
        updateWallet(balance);
      } else {
        fetchWalletBalance();
      }
    };

    const handleRideCompleted = (data: any) => {
      console.log('🎉 Ride completed - updating wallet:', data);
      const balance = data?.walletBalance ?? data?.wallet ?? data?.balance;
      if (balance !== undefined) {
        updateWallet(balance);
      } else {
        fetchWalletBalance();
      }
    };

    socket.on('walletUpdate', handleWalletUpdate);
    socket.on('rideCompleted', handleRideCompleted);

    return () => {
      socket.off('walletUpdate', handleWalletUpdate);
      socket.off('rideCompleted', handleRideCompleted);
    };
  }, [updateWallet, fetchWalletBalance]);

  return (
    <WalletContext.Provider
      value={{
        walletBalance,
        loading,
        updateWallet,
        fetchWalletBalance,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;
