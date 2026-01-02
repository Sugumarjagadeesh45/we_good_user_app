// /Users/webasebrandings/Downloads/new_far-main 2/src/Screen1/Shopping/ShoppingContent.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'user_cart_data'

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
  stock?: number;
  description?: string;
  originalPrice?: number;
  discount?: number;
  category?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  getCartTotal: () => 0,
  getCartItemsCount: () => 0,
});

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);



  const loadCartFromStorage = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('🛒 Loaded cart from storage:', parsedCart.length, 'items');
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('❌ Error loading cart from storage:', error);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      console.log('💾 Saved cart to storage:', cartItems.length, 'items');
    } catch (error) {
      console.error('❌ Error saving cart to storage:', error);
    }
  };

  const addToCart = (product: any) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      let newItems;
      
      if (existingItem) {
        newItems = prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prevItems, { 
          ...product, 
          quantity: 1 
        }];
      }
      
      console.log('🛒 Added to cart:', product.name, 'Total items:', newItems.length);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item._id !== productId);
      console.log('🗑️ Removed from cart. Total items:', newItems.length);
      return newItems;
    });
  };

  const clearCart = () => {
    console.log('🧹 Clearing entire cart');
    setCartItems([]);
    // Also clear from storage
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(console.error);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item._id === productId ? { ...item, quantity } : item
        )
      );
    }
  };


  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

import ProfessionalShoppingContent from './ProfessionalShoppingContent';

const ShoppingContent = () => {
  return <ProfessionalShoppingContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default ShoppingContent;

