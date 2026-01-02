import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from './ShoppingContent';
import { useAddress } from './AddressContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getBackendUrl } from '../../../src/util/backendConfig';

const EnhancedCheckout = () => {
  const navigation = useNavigation();
  const { cartItems, clearCart, getCartTotal, getCartItemsCount } = useCart();
  const { defaultAddress } = useAddress();
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'upi' | 'card' | 'wallet'>('cash');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const BASE_URL = getBackendUrl();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        setUserData(JSON.parse(userProfile));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!defaultAddress) {
      Alert.alert('Address Required', 'Please add a delivery address before placing order');
      navigation.navigate('AddressManagement');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      if (!userData) {
        throw new Error('User data not found');
      }

      const orderData = {
        userId: userData._id || userData.id,
        products: cartItems.map(item => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.images || [],
          category: item.category || 'General'
        })),
        deliveryAddress: defaultAddress,
        paymentMethod: selectedPayment,
        useWallet: false
      };

      console.log('📦 Placing order with data:', orderData);

      const response = await axios.post(`${BASE_URL}/api/orders/create`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await clearCart();
        
        Alert.alert(
          'Order Confirmed!',
          `Your order #${response.data.data.orderId} has been placed successfully!\nTotal: ₹${getCartTotal().toFixed(2)}`,
          [
            {
              text: 'View Orders',
              onPress: () => navigation.navigate('EnhancedMyOrders')
            },
            {
              text: 'Continue Shopping',
              onPress: () => navigation.navigate('Shopping')
            }
          ]
        );
      } else {
        throw new Error(response.data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Order Failed', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 499 ? 0 : 5.99;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const tax = calculateTax();
    return subtotal + shipping + tax;
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {cartItems.map((item, index) => (
        <View key={item._id} style={styles.orderItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price} × {item.quantity}</Text>
          </View>
          <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>
          {calculateShipping() === 0 ? 'FREE' : `₹${calculateShipping().toFixed(2)}`}
        </Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax (8%)</Text>
        <Text style={styles.summaryValue}>₹{calculateTax().toFixed(2)}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderAddressSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddressManagement')}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>
      
      {defaultAddress ? (
        <View style={styles.addressCard}>
          <Text style={styles.addressName}>{defaultAddress.name}</Text>
          <Text style={styles.addressPhone}>{defaultAddress.phone}</Text>
          <Text style={styles.addressText}>{defaultAddress.addressLine1}</Text>
          {defaultAddress.addressLine2 && (
            <Text style={styles.addressText}>{defaultAddress.addressLine2}</Text>
          )}
          <Text style={styles.addressText}>
            {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addAddressButton}
          onPress={() => navigation.navigate('AddressManagement')}
        >
          <MaterialIcons name="add" size={20} color="#4caf50" />
          <Text style={styles.addAddressText}>Add Delivery Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedPayment === 'cash' && styles.selectedPaymentOption
        ]}
        onPress={() => setSelectedPayment('cash')}
      >
        <MaterialIcons 
          name={selectedPayment === 'cash' ? "radio-button-checked" : "radio-button-unchecked"} 
          size={24} 
          color="#4caf50" 
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Cash on Delivery</Text>
          <Text style={styles.paymentSubtitle}>Pay when you receive the order</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedPayment === 'upi' && styles.selectedPaymentOption
        ]}
        onPress={() => setSelectedPayment('upi')}
      >
        <MaterialIcons 
          name={selectedPayment === 'upi' ? "radio-button-checked" : "radio-button-unchecked"} 
          size={24} 
          color="#4caf50" 
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>UPI Payment</Text>
          <Text style={styles.paymentSubtitle}>Pay using UPI apps</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedPayment === 'card' && styles.selectedPaymentOption
        ]}
        onPress={() => setSelectedPayment('card')}
      >
        <MaterialIcons 
          name={selectedPayment === 'card' ? "radio-button-checked" : "radio-button-unchecked"} 
          size={24} 
          color="#4caf50" 
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
          <Text style={styles.paymentSubtitle}>Pay using card</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {renderOrderSummary()}
        {renderAddressSection()}
        {renderPaymentSection()}
        
        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.deliveryInfo}>
            <MaterialIcons name="schedule" size={20} color="#4caf50" />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>Expected Delivery</Text>
              <Text style={styles.deliverySubtitle}>
                {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
          <Text style={styles.totalLabel}>Total Amount</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!defaultAddress || loading) && styles.disabledButton
          ]}
          onPress={handlePlaceOrder}
          disabled={!defaultAddress || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>
              {!defaultAddress ? 'Add Address First' : 'Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  changeText: {
    color: '#4caf50',
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addAddressText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedPaymentOption: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    marginLeft: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  placeOrderButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginLeft: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedCheckout;