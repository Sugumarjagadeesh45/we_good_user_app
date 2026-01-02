// /Users/webasebrandings/Downloads/new-main/src/Screen1/Shopping/icons/Cart.tsx
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../ShoppingContent';
import { useAddress } from '../AddressContext';
import { getImageUrl } from '../../../../src/util/backendConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Cart = () => {
  const navigation = useNavigation();
  const { cartItems, removeFromCart, clearCart, updateQuantity } = useContext(CartContext);
  const { defaultAddress, addresses, fetchAddresses, loading: addressLoading } = useAddress();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [userData, setUserData] = useState(null);

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

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => removeFromCart(productId) },
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some products to checkout.');
      return;
    }
    
    // Check if we have any address (either from address context or user profile)
    const hasAddress = defaultAddress || (userData && userData.address);
    
    if (!hasAddress) {
      Alert.alert('Address Required', 'Please add a delivery address before checkout.');
      navigation.navigate('AddressManagement');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Order Confirmed',
        `Your order has been placed successfully!\nPayment Method: ${getPaymentMethodText(selectedPayment)}`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              clearCart();
              navigation.navigate('MyOrders');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = 5.99;
    const tax = subtotal * 0.08;
    return subtotal + shipping + tax;
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card': return 'Credit/Debit Card';
      case 'upi': return 'UPI Payment';
      case 'cod': return 'Cash on Delivery';
      default: return 'Credit/Debit Card';
    }
  };

  const calculateExpectedDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3); // Standard delivery in 3 days
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getDisplayAddress = () => {
    if (defaultAddress) {
      return defaultAddress;
    }
    
    if (userData && userData.address) {
      return {
        name: userData.name || 'Customer',
        phone: userData.phoneNumber || userData.altMobile || '',
        addressLine1: userData.address,
        city: extractCityFromAddress(userData.address),
        state: extractStateFromAddress(userData.address),
        pincode: extractPincodeFromAddress(userData.address) || '000000',
        country: 'India',
      };
    }
    
    return null;
  };

  const displayAddress = getDisplayAddress();

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <Image
        source={{ 
          uri: item.images && item.images.length > 0 
            ? getImageUrl(item.images[0]) 
            : 'https://via.placeholder.com/100' 
        }}
        style={styles.itemImage}
        onError={(e) => {
          console.log('❌ Cart item image failed:', {
            product: item.name,
            url: getImageUrl(item.images?.[0]),
            error: e.nativeEvent.error
          });
        }}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
        <Text style={styles.expectedDelivery}>
          Expected delivery by {calculateExpectedDeliveryDate()}
        </Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item._id, item.quantity - 1)}
          >
            <MaterialIcons name="remove" size={18} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item._id, item.quantity + 1)}
          >
            <MaterialIcons name="add" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleRemoveItem(item._id)}
          >
            <MaterialIcons name="delete" size={18} color="#e53935" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Buying', { product: item })}
          >
            <MaterialIcons name="shopping-bag" size={18} color="#4caf50" />
            <Text style={styles.actionButtonText}>Shop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (addressLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything to your cart yet</Text>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate('Shopping')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList}>
            {/* Cart Summary */}
            <View style={styles.cartSummary}>
              <Text style={styles.summaryTitle}>Cart Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total</Text>
                <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.proceedToBuyButton}
                onPress={() => navigation.navigate('Checkout', { cartItems })}
              >
                <Text style={styles.proceedToBuyText}>
                  Proceed to Buy ({calculateTotalItems()} total items)
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />

            {/* Order Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({calculateTotalItems()})</Text>
                <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>₹5.99</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>₹{(calculateSubtotal() * 0.08).toFixed(2)}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.addressContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AddressManagement')}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>
                    {displayAddress ? 'Edit' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
              {displayAddress ? (
                <View style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{displayAddress.name}</Text>
                    {defaultAddress && defaultAddress.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressPhone}>{displayAddress.phone}</Text>
                  <Text style={styles.addressText}>{displayAddress.addressLine1}</Text>
                  {displayAddress.addressLine2 && (
                    <Text style={styles.addressText}>{displayAddress.addressLine2}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {displayAddress.city}, {displayAddress.state} - {displayAddress.pincode}
                  </Text>
                  <Text style={styles.addressText}>{displayAddress.country}</Text>
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

            {/* Payment Method */}
            <View style={styles.paymentContainer}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              
              <TouchableOpacity 
                style={[styles.paymentCard, selectedPayment === 'card' && styles.selectedPaymentCard]}
                onPress={() => setSelectedPayment('card')}
              >
                <MaterialIcons name="credit-card" size={24} color="#4caf50" />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                  <Text style={styles.paymentSubtitle}>Visa •••• 1234</Text>
                </View>
                {selectedPayment === 'card' && (
                  <MaterialIcons name="check-circle" size={20} color="#4caf50" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentCard, selectedPayment === 'upi' && styles.selectedPaymentCard]}
                onPress={() => setSelectedPayment('upi')}
              >
                <MaterialIcons name="account-balance-wallet" size={24} color="#2196f3" />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>UPI Payment</Text>
                  <Text style={styles.paymentSubtitle}>Pay via UPI</Text>
                </View>
                {selectedPayment === 'upi' && (
                  <MaterialIcons name="check-circle" size={20} color="#4caf50" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentCard, selectedPayment === 'cod' && styles.selectedPaymentCard]}
                onPress={() => setSelectedPayment('cod')}
              >
                <MaterialIcons name="local-atm" size={24} color="#ff9800" />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                  <Text style={styles.paymentSubtitle}>Pay when delivered</Text>
                </View>
                {selectedPayment === 'cod' && (
                  <MaterialIcons name="check-circle" size={20} color="#4caf50" />
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Checkout Button */}
          <View style={styles.checkoutContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
              <Text style={styles.totalLabel}>Total Amount</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, loading && styles.disabledButton]} 
              onPress={handleCheckout}
              disabled={loading || !displayAddress}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  {!displayAddress ? 'Add Address First' : 'Proceed to Checkout'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Helper functions
const extractCityFromAddress = (address: string): string => {
  const cityMatch = address.match(/(\w+)(?=\s*\d{6}|$)/);
  return cityMatch ? cityMatch[1] : 'City';
};

const extractStateFromAddress = (address: string): string => {
  const stateMatch = address.match(/(Maharashtra|Karnataka|Tamil Nadu|Delhi|Kerala|Gujarat)/i);
  return stateMatch ? stateMatch[1] : 'State';
};

const extractPincodeFromAddress = (address: string): string | null => {
  const pincodeMatch = address.match(/\b\d{6}\b/);
  return pincodeMatch ? pincodeMatch[0] : null;
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '500',
  },
  cartList: {
    flex: 1,
    padding: 20,
  },
  cartSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  proceedToBuyButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  proceedToBuyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 12,
  },
  expectedDelivery: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    marginTop: 5,
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
  addressContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
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
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addAddressText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  paymentContainer: {
    marginBottom: 100,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  selectedPaymentCard: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    alignItems: 'flex-start',
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
  checkoutButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flex: 1,
    marginLeft: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Cart;