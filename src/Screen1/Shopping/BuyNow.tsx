// /Users/webasebrandings/Documents/new-main/src/Screen1/Shopping/BuyNow.tsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from './ShoppingContent';
import { useAddress } from './AddressContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getImageUrl, getBackendUrl } from '../../util/backendConfig';
import { useWallet } from '../../context/WalletContext';

const BuyNow = () => {
  const navigation = useNavigation();
  const { cartItems, removeFromCart, clearCart, updateQuantity } = useContext(CartContext);
  const { defaultAddress, addresses, fetchAddresses, loading: addressLoading } = useAddress();
  const { walletBalance, fetchWalletBalance, loading: walletLoading } = useWallet();
  const [loading, setLoading] = useState(false);
  const [useWalletAmount, setUseWalletAmount] = useState(false); // New state for wallet usage
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
    fetchWalletBalance(); // Fetch wallet balance on mount
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


  



  // In your handleCheckout function, replace the axios call with this:
const handleCheckout = async () => {
  if (cartItems.length === 0) {
    Alert.alert('Empty Cart', 'Your cart is empty. Add some products to checkout.');
    return;
  }
  
  // Check for delivery address
  const hasAddress = defaultAddress || (userData && userData.address);
  
  if (!hasAddress) {
    Alert.alert('Address Required', 'Please add a delivery address before checkout.');
    navigation.navigate('AddressManagement');
    return;
  }
  
  setLoading(true);
  
  try {
    // Get authentication token
    let token = await AsyncStorage.getItem('userToken');
    if (!token) token = await AsyncStorage.getItem('authToken');
    if (!token) token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('User not authenticated - no token found');
    }

    // Get user data
    let userProfileData = userData;
    if (!userProfileData) {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        userProfileData = JSON.parse(userProfile);
      } else {
        // Fallback: Fetch profile from API if missing in storage
        try {
          console.log('⚠️ User profile not found in storage, fetching from API...');
          const profileResponse = await axios.get(`${getBackendUrl()}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (profileResponse.data.success || profileResponse.data.user) {
            userProfileData = profileResponse.data.user || profileResponse.data;
            // Save for future use
            await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
            setUserData(userProfileData);
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } catch (fetchError) {
          console.error('Error fetching profile in BuyNow:', fetchError);
          throw new Error('User data not found. Please go back to Home screen to refresh.');
        }
      }
    }


    console.log('🔗 Using backend URL:', getBackendUrl());
    console.log('👤 User Profile Data:', userProfileData);

    // Extract identifiers
    const customerId = userProfileData.customerId;
    const userId = userProfileData._id || userProfileData.id;
    const phoneNumber = userProfileData.phoneNumber;

    if (!customerId) {
      throw new Error('Customer ID not found in user profile');
    }

    console.log(`🔑 Using identifiers - CustomerId: ${customerId}, UserId: ${userId}`);

    // Prepare products data
    const products = cartItems.map(item => ({
      productId: item._id || item.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      _id: item._id || item.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || 'Unknown Product',
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      images: Array.isArray(item.images) ? item.images : [],
      category: item.category || 'General'
    }));

    // Prepare order data
    const orderData = {
      customerId: customerId, // Primary identifier
      userId: userId,
      products: products,
      deliveryAddress: defaultAddress || {
        name: userProfileData.name || 'Customer',
        phone: userProfileData.phoneNumber || '',
        addressLine1: userProfileData.address || '',
        city: 'City',
        state: 'State', 
        pincode: '000000',
        country: 'India'
      },
      paymentMethod: 'cash', // Always cash on delivery
      totalAmount: Number(calculateTotal().toFixed(2)),
      orderDate: new Date().toISOString(),
      useWallet: useWalletAmount,
      walletDeduction: useWalletAmount ? getWalletDeduction() : 0,
      originalTotal: calculateSubtotal() + calculateShipping() + calculateTax()
    };

    console.log('📦 Placing order with data:', orderData);

    // ✅ FIRST: Test if the main order endpoint exists
    try {
      const testResponse = await axios.get(`${getBackendUrl()}/api/orders/test-connection`, {
        timeout: 5000
      });
      console.log('✅ Order endpoint test successful:', testResponse.data);
    } catch (testError) {
      console.error('❌ Order endpoint test failed:', testError.message);
      throw new Error('Order service is unavailable. Please try again later.');
    }

    // ✅ SECOND: Try to create order using main endpoint
    console.log('🚀 Attempting to create order via /api/orders/create...');
    const orderResponse = await axios.post(
      `${getBackendUrl()}/api/orders/create`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    
    console.log('✅ Order response:', orderResponse.data);

    if (orderResponse.data.success) {
      clearCart();

      // Handle different response structures safely
      const orderId = orderResponse.data.orderId || 
                      (orderResponse.data.order && orderResponse.data.order.orderId) || 
                      (orderResponse.data.data && orderResponse.data.data.orderId) || 
                      'Unknown';

      // Prepare success message
      let message = `Your order #${orderId} has been placed successfully!\n\n`;

      if (useWalletAmount && getWalletDeduction() > 0) {
        message += `✅ Wallet Deducted: ₹${getWalletDeduction().toFixed(2)}\n`;
        const remainingAmount = calculateTotal();
        if (remainingAmount > 0) {
          message += `💵 Cash on Delivery: ₹${remainingAmount.toFixed(2)}`;
        } else {
          message += `🎉 Fully paid from wallet! No cash required.`;
        }
      } else {
        message += `💵 Total (Cash on Delivery): ₹${calculateTotal().toFixed(2)}`;
      }

      Alert.alert(
        'Order Confirmed! 🎉',
        message,
        [
          {
            text: 'View Orders',
            onPress: () => {
              AsyncStorage.removeItem('ordersCache');
              fetchWalletBalance(); // Refresh wallet balance
              navigation.navigate('EnhancedMyOrders');
            }
          },
          {
            text: 'Continue Shopping',
            style: 'cancel',
            onPress: () => {
              fetchWalletBalance(); // Refresh wallet balance
              navigation.reset({
                index: 0,
                routes: [{ name: 'Screen1' }],
              });
            }
          }
        ]
      );
    } else {
      throw new Error(orderResponse.data.error || 'Failed to place order');
    }
  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error response status:', error.response?.status);
    console.error('❌ Full error object:', JSON.stringify(error.response?.data, null, 2));

    let errorMessage = 'Failed to place order. Please try again.';

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      console.error('❌ Backend error message:', errorMessage);
    } else if (error.response?.data?.details) {
      errorMessage = error.response.data.details;
      console.error('❌ Backend error details:', errorMessage);
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Order service not found. Please contact support.';
    }

    Alert.alert('Order Failed', errorMessage);
  } finally {
    setLoading(false);
  }
};




const checkUserData = async () => {
  try {
    const userProfile = await AsyncStorage.getItem('userProfile');
    const userToken = await AsyncStorage.getItem('userToken');
    const authToken = await AsyncStorage.getItem('authToken');
    const token = await AsyncStorage.getItem('token');
    
    console.log('🔍 DEBUG - User Profile:', userProfile ? JSON.parse(userProfile) : 'No profile');
    console.log('🔍 DEBUG - Tokens:', {
      userToken: userToken ? 'Exists' : 'Missing',
      authToken: authToken ? 'Exists' : 'Missing',
      token: token ? 'Exists' : 'Missing'
    });
    
    if (userProfile) {
      const parsed = JSON.parse(userProfile);
      console.log('🔍 DEBUG - Parsed Profile Structure:', {
        hasCustomerId: !!parsed.customerId,
        customerId: parsed.customerId,
        has_id: !!parsed._id,
        _id: parsed._id,
        allKeys: Object.keys(parsed)
      });
    }
  } catch (error) {
    console.error('Debug check error:', error);
  }
};

// Call this function when component mounts
useEffect(() => {
  checkUserData();
}, []);



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
    const grandTotal = subtotal + shipping + tax;

    // If wallet is being used, deduct wallet balance
    if (useWalletAmount) {
      const walletDeduction = Math.min(walletBalance, grandTotal);
      return Math.max(0, grandTotal - walletDeduction);
    }

    return grandTotal;
  };

  const getWalletDeduction = () => {
    if (!useWalletAmount) return 0;
    const grandTotal = calculateSubtotal() + calculateShipping() + calculateTax();
    return Math.min(walletBalance, grandTotal);
  };

  const getFinalTotal = () => {
    return calculateTotal();
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getExpectedDeliveryDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 2); // 2 days from now
    return today.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <Image
        source={{ 
          uri: item.images && item.images.length > 0 
            ? getImageUrl(item.images[0]) 
            : 'https://via.placeholder.com/100' 
        }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.deliveryDate}>
          Expected delivery: {getExpectedDeliveryDate()}
        </Text>
        <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
        
        <View style={styles.itemActions}>
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
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => navigation.navigate('EnhancedBuying', { product: item })}
            >
              <MaterialIcons name="store" size={16} color="#4caf50" />
              <Text style={styles.shopButtonText}>Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleRemoveItem(item._id)}
            >
              <MaterialIcons name="delete" size={16} color="#e53935" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
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
        <Text style={styles.headerTitle}>My Cart ({calculateTotalItems()} items)</Text>
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
            style={styles.shopButtonLarge} 
            onPress={() => navigation.navigate('Screen1')}
          >
            <Text style={styles.shopButtonLargeText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList}>
            {/* Cart Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cart Items</Text>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({calculateTotalItems()} items)</Text>
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

              {useWalletAmount && walletBalance > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#4caf50' }]}>
                    Wallet Deduction
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
                    -₹{getWalletDeduction().toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>
                  {useWalletAmount ? 'Amount Payable' : 'Total Amount'}
                </Text>
                <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
              </View>

              {useWalletAmount && calculateTotal() === 0 && (
                <View style={styles.freeOrderBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#4caf50" />
                  <Text style={styles.freeOrderText}>
                    Order fully paid from wallet! No cash required on delivery.
                  </Text>
                </View>
              )}
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AddressManagement')}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>
                    {defaultAddress ? 'Edit' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
              {defaultAddress ? (
                <View style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{defaultAddress.name}</Text>
                    {defaultAddress.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
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

            {/* Wallet Balance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet Balance</Text>

              <View style={styles.walletCard}>
                <MaterialIcons name="account-balance-wallet" size={32} color="#4caf50" />
                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Available Balance</Text>
                  <Text style={styles.walletBalance}>₹{walletBalance.toFixed(2)}</Text>
                </View>
              </View>

              {walletBalance > 0 && (
                <TouchableOpacity
                  style={styles.useWalletCard}
                  onPress={() => setUseWalletAmount(!useWalletAmount)}
                >
                  <View style={styles.useWalletLeft}>
                    <MaterialIcons
                      name={useWalletAmount ? "check-box" : "check-box-outline-blank"}
                      size={24}
                      color={useWalletAmount ? "#4caf50" : "#999"}
                    />
                    <View style={styles.useWalletInfo}>
                      <Text style={styles.useWalletTitle}>Use Wallet Balance</Text>
                      <Text style={styles.useWalletSubtitle}>
                        {useWalletAmount
                          ? `₹${getWalletDeduction().toFixed(2)} will be deducted`
                          : 'Tap to use your wallet balance'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              <View style={[styles.paymentCard, styles.selectedPaymentCard]}>
                <MaterialIcons name="local-atm" size={24} color="#ff9800" />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                  <Text style={styles.paymentSubtitle}>Pay when your order is delivered</Text>
                </View>
                <MaterialIcons name="check-circle" size={20} color="#4caf50" />
              </View>

              {useWalletAmount && (
                <View style={styles.walletInfoBox}>
                  <MaterialIcons name="info-outline" size={16} color="#2196f3" />
                  <Text style={styles.walletInfoText}>
                    Wallet balance will be deducted, remaining amount payable on delivery
                  </Text>
                </View>
              )}
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
              disabled={loading || !defaultAddress}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  {!defaultAddress ? 'Add Address First' : `Proceed to Checkout (${calculateTotalItems()} items)`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
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
  section: {
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
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  deliveryDate: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  shopButtonText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    textAlign: 'right',
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
  shopButtonLarge: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  shopButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5e1a5',
    marginBottom: 12,
  },
  walletInfo: {
    marginLeft: 15,
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
  },
  useWalletCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  useWalletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  useWalletInfo: {
    marginLeft: 12,
    flex: 1,
  },
  useWalletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  useWalletSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  walletInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  walletInfoText: {
    fontSize: 13,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
  freeOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  freeOrderText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
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

export default BuyNow;