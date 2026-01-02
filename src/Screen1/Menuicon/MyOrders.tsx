import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getImageUrl, getBackendUrl } from '../../../src/util/backendConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Define Order interface
interface Order {
  _id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  products: Array<{
    _id?: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    images: string[];
    category?: string;
  }>;
  deliveryAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  paymentMethod: string;
  orderDate: string;
  createdAt: string;
}

const MyOrders = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Order status filters
  const orderFilters = [
    { id: 'all', label: 'All Orders' },
    { id: 'order_confirmed', label: 'Order Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userData) {
        loadOrders();
      }
    }, [userData])
  );



// In loadUserData function, update to:
const loadUserData = async () => {
  try {
    const userProfile = await AsyncStorage.getItem('userProfile');
    if (userProfile) {
      const user = JSON.parse(userProfile);
      console.log('👤 User data loaded for orders:', {
        userId: user._id || user.id, // Add this
        customerId: user.customerId,
        name: user.name,
        phoneNumber: user.phoneNumber
      });
      setUserData(user);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
};

// In loadOrders function, modify the API call to:
const loadOrders = async () => {
  try {
    setLoading(true);
    
    if (!userData) {
      console.error('❌ User data not available');
      setLoading(false);
      return;
    }

    const BASE_URL = getBackendUrl();
    let ordersData = [];
    
    // Try multiple endpoints to find orders
    try {
      // First try: Use customerId (numeric)
      const customerId = userData.customerId;
      if (customerId) {
        console.log(`🔗 Fetching orders for customer ID: ${customerId}`);
        
        const response = await axios.get(
          `${BASE_URL}/api/orders/customer-id/${customerId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        if (response.data.success) {
          ordersData = response.data.data || [];
          console.log(`✅ Found ${ordersData.length} orders using customerId`);
        }
      }
    } catch (customerIdError) {
      console.log('⚠️ Customer ID endpoint failed, trying userId...');
      
      // Second try: Use userId (MongoDB ObjectId)
      const userId = userData._id || userData.id;
      if (userId) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/orders/customer/${userId}`,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          if (response.data.success) {
            ordersData = response.data.data || [];
            console.log(`✅ Found ${ordersData.length} orders using userId`);
          }
        } catch (userIdError) {
          console.error('❌ Both endpoints failed:', userIdError);
        }
      }
    }
    
    if (ordersData.length > 0) {
      // Transform orders to ensure consistent structure
      const transformedOrders = ordersData.map((order: any) => ({
        _id: order._id,
        orderId: order.orderId || order._id,
        status: order.status || 'order_confirmed',
        totalAmount: order.totalAmount || 0,
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        tax: order.tax || 0,
        products: order.products?.map((product: any) => ({
          _id: product._id || product.productId,
          productId: product.productId || product._id,
          name: product.name || 'Unknown Product',
          price: product.price || 0,
          quantity: product.quantity || 1,
          images: Array.isArray(product.images) ? product.images : [],
          category: product.category || 'General'
        })) || [],
        deliveryAddress: order.deliveryAddress || {
          name: order.customerName || userData.name,
          phone: order.customerPhone || userData.phoneNumber,
          addressLine1: order.customerAddress || userData.address || '',
          city: 'Unknown City',
          state: 'Unknown State',
          pincode: '000000'
        },
        paymentMethod: order.paymentMethod || 'card',
        orderDate: order.orderDate || order.createdAt,
        createdAt: order.createdAt
      }));

      setOrders(transformedOrders);
    } else {
      console.log('📭 No orders found for user');
      setOrders([]);
    }

  } catch (error: any) {
    console.error('❌ Error loading orders:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};




  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': '#f59e0b',
      'order_confirmed': '#3b82f6',
      'processing': '#f59e0b',
      'preparing': '#8b5cf6',
      'packed': '#8b5cf6',
      'shipped': '#06b6d4',
      'out_for_delivery': '#f97316',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'returned': '#f97316',
      'refunded': '#84cc16'
    };
    return statusColors[status] || '#666';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'pending': 'Pending',
      'order_confirmed': 'Order Confirmed',
      'processing': 'Processing',
      'preparing': 'Preparing',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned',
      'refunded': 'Refunded'
    };
    return statusTexts[status] || status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, string> = {
      'order_confirmed': 'check-circle',
      'processing': 'refresh',
      'shipped': 'local-shipping',
      'out_for_delivery': 'local-shipping',
      'delivered': 'check-circle',
      'cancelled': 'cancel',
      'returned': 'refresh',
      'refunded': 'monetization-on'
    };
    return statusIcons[status] || 'receipt';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleReorder = (order: Order) => {
    Alert.alert(
      'Reorder',
      'Would you like to add these items to your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Cart', 
          onPress: async () => {
            try {
              // Add each product to cart
              order.products.forEach(product => {
                // You'll need to import your cart context and add items
                // For now, show success message
              });
              
              Alert.alert('Success', 'Items added to cart!');
              navigation.navigate('Shopping');
            } catch (error) {
              Alert.alert('Error', 'Failed to add items to cart');
            }
          }
        }
      ]
    );
  };

  const handleTrackOrder = (orderId: string) => {
    Alert.alert(
      'Track Order', 
      `Tracking order #${orderId}\n\nYou can track your order in real-time. We'll notify you of any updates.`,
      [{ text: 'OK' }]
    );
  };

  const handleViewDetails = (order: Order) => {
    // Navigate to order details screen
    navigation.navigate('OrderDetails', { 
      orderId: order.orderId,
      order: order 
    });
  };

  const handleContactSupport = (orderId: string) => {
    Alert.alert(
      'Contact Support',
      `Need help with order #${orderId}?\n\nCall: 1800-123-4567\nEmail: support@eazygo.com`,
      [{ text: 'OK' }]
    );
  };

  const getFilteredOrders = () => {
    if (selectedFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === selectedFilter);
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const totalItems = item.products.reduce((sum, product) => sum + product.quantity, 0);
    
    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>Order #{item.orderId}</Text>
            <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <MaterialIcons 
              name={getStatusIcon(item.status) as any} 
              size={14} 
              color={statusColor} 
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Order Items Preview */}
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.itemsScrollView}
          >
            {item.products.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <Image
                  source={{ 
                    uri: product.images && product.images.length > 0 
                      ? getImageUrl(product.images[0])
                      : 'https://via.placeholder.com/80'
                  }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                  <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items Total</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(item.subtotal || item.totalAmount)}
            </Text>
          </View>
          
          {item.shipping !== undefined && item.shipping > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {item.shipping === 0 ? 'FREE' : formatCurrency(item.shipping)}
              </Text>
            </View>
          )}
          
          {item.tax !== undefined && item.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(item.tax)}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText} numberOfLines={2}>
            {item.deliveryAddress.name}, {item.deliveryAddress.addressLine1}
          </Text>
          <Text style={styles.addressDetails}>
            {item.deliveryAddress.city}, {item.deliveryAddress.state} - {item.deliveryAddress.pincode}
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <MaterialIcons 
              name={item.paymentMethod === 'cod' ? 'money' : 
                    item.paymentMethod === 'upi' ? 'account-balance-wallet' : 
                    'credit-card'} 
              size={16} 
              color="#666" 
            />
            <Text style={styles.paymentTitle}>Payment</Text>
          </View>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod === 'cod' ? 'Cash on Delivery' : 
             item.paymentMethod === 'upi' ? 'UPI Payment' : 
             item.paymentMethod === 'card' ? 'Card Payment' : 
             item.paymentMethod === 'wallet' ? 'Wallet Payment' : 
             item.paymentMethod}
          </Text>
        </View>

        {/* Order Actions */}
        <View style={styles.orderActions}>
          {item.status === 'delivered' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reorderButton]}
              onPress={() => handleReorder(item)}
            >
              <MaterialIcons name="replay" size={16} color="#4CAF50" />
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
          
          {['processing', 'packed', 'shipped', 'out_for_delivery'].includes(item.status) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => handleTrackOrder(item.orderId)}
            >
              <MaterialIcons name="local-shipping" size={16} color="#2196F3" />
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => handleViewDetails(item)}
          >
            <MaterialIcons name="visibility" size={16} color="#666" />
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.supportButton]}
            onPress={() => handleContactSupport(item.orderId)}
          >
            <MaterialIcons name="headset-mic" size={16} color="#FF9800" />
            <Text style={styles.supportButtonText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterItem = ({ item }: { item: { id: string, label: string } }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === item.id && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === item.id && styles.filterButtonTextActive
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <MaterialIcons 
            name="refresh" 
            size={24} 
            color={refreshing ? '#CCC' : '#333'} 
          />
        </TouchableOpacity>
      </View>

      {/* Order Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {orders.filter(o => o.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {orders.filter(o => ['processing', 'shipped', 'out_for_delivery'].includes(o.status)).length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {/* Order Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={orderFilters}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'all' 
              ? "No orders yet" 
              : `No ${orderFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()}`
            }
          </Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your order history here!"
              : `You don't have any ${orderFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()} orders.`
            }
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Shopping')}
          >
            <MaterialIcons name="shopping-cart" size={20} color="#FFF" />
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListHeaderComponent={
            <Text style={styles.ordersCount}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} Found
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersList: {
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  ordersList: {
    padding: 15,
    paddingBottom: 30,
  },
  ordersCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  itemsScrollView: {
    marginHorizontal: -5,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    width: 200,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
  orderSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  addressSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 13,
    color: '#888',
  },
  paymentSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  reorderButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  trackButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  detailsButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  supportButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  reorderButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trackButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  supportButtonText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MyOrders;



// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   RefreshControl,
//   ActivityIndicator,
//   Alert,
//   ScrollView
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { getImageUrl, getBackendUrl } from '../../../src/util/backendConfig';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const MyOrders = () => {
//   const navigation = useNavigation();
//   const [orders, setOrders] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [userData, setUserData] = useState(null);

//   useEffect(() => {
//     loadUserData();
//   }, []);

//   useFocusEffect(
//     React.useCallback(() => {
//       if (userData) {
//         loadOrders();
//       }
//     }, [userData])
//   );

//   const loadUserData = async () => {
//     try {
//       const userProfile = await AsyncStorage.getItem('userProfile');
//       if (userProfile) {
//         const user = JSON.parse(userProfile);
//         setUserData(user);
//         console.log('👤 User data loaded:', user._id);
//       }
//     } catch (error) {
//       console.error('Error loading user data:', error);
//     }
//   };



//   const loadOrders = async () => {
//   try {
//     setLoading(true);
//     console.log('📦 Fetching orders from backend...');
    
//     if (!userData) {
//       console.error('❌ User data not available');
//       setLoading(false);
//       return;
//     }

//     const BASE_URL = getBackendUrl();
//     const token = await AsyncStorage.getItem('userToken') || 
//                  await AsyncStorage.getItem('authToken') || 
//                  await AsyncStorage.getItem('token');

//     if (!token) {
//       throw new Error('User not authenticated');
//     }

//     console.log('👤 User data:', {
//       userId: userData._id,
//       customerId: userData.customerId,
//       name: userData.name
//     });

//     // ✅ FIX: Try multiple endpoints to find orders
//     let ordersData = [];
    
//     // First try: Get orders by customerId (numeric)
//     if (userData.customerId) {
//       try {
//         console.log(`🔗 Attempt 1: Fetching by customerId: ${userData.customerId}`);
//         const response1 = await axios.get(
//           `${BASE_URL}/api/orders/customer-id/${userData.customerId}`,
//           {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             timeout: 5000
//           }
//         );
        
//         if (response1.data.success && response1.data.data.length > 0) {
//           ordersData = response1.data.data;
//           console.log(`✅ Found ${ordersData.length} orders by customerId`);
//         }
//       } catch (error) {
//         console.log('❌ No orders found by customerId, trying user ID...');
//       }
//     }

//     // Second try: Get orders by userId (MongoDB ObjectId)
//     if (ordersData.length === 0 && userData._id) {
//       try {
//         console.log(`🔗 Attempt 2: Fetching by userId: ${userData._id}`);
//         const response2 = await axios.get(
//           `${BASE_URL}/api/orders/customer/${userData._id}`,
//           {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             timeout: 5000
//           }
//         );
        
//         if (response2.data.success) {
//           ordersData = response2.data.data || [];
//           console.log(`✅ Found ${ordersData.length} orders by userId`);
//         }
//       } catch (error) {
//         console.log('❌ No orders found by userId either');
//       }
//     }

//     console.log(`📊 Total orders loaded: ${ordersData.length}`);
    
//     // ✅ FIX: Ensure products array exists for each order
//     const ordersWithValidProducts = ordersData.map((order: any) => ({
//       ...order,
//       products: order.products || [] // Ensure products array exists
//     }));
    
//     setOrders(ordersWithValidProducts);

//   } catch (error: any) {
//     console.error('❌ Error loading orders:', error);
    
//     let errorMessage = 'Failed to load orders';
    
//     if (error.code === 'ECONNABORTED') {
//       errorMessage = 'Request timeout. Please check your connection.';
//     } else if (error.response?.status === 404) {
//       errorMessage = 'No orders found. Start shopping!';
//     } else if (error.response?.status === 500) {
//       errorMessage = 'Server error. Please try again later.';
//     } else if (error.response?.data?.error) {
//       errorMessage = error.response.data.error;
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     console.log('🔄 Setting empty orders due to error');
//     setOrders([]); // Always set empty array on error
    
//     // Only show alert for non-404 errors
//     if (error.response?.status !== 404) {
//       Alert.alert('Error', errorMessage);
//     }
//   } finally {
//     setLoading(false);
//   }
// };


//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadOrders();
//     setRefreshing(false);
//   };

//   const getStatusColor = (status: string) => {
//     const statusColors = {
//       'pending': '#f59e0b',
//       'order_confirmed': '#6366f1',
//       'processing': '#8b5cf6',
//       'preparing': '#8b5cf6',
//       'packed': '#06b6d4',
//       'shipped': '#06b6d4',
//       'out_for_delivery': '#f97316',
//       'delivered': '#10b981',
//       'cancelled': '#ef4444',
//       'returned': '#f97316',
//       'refunded': '#84cc16'
//     };
//     return statusColors[status] || '#666';
//   };

//   const getStatusText = (status: string) => {
//     const statusTexts = {
//       'pending': 'Pending',
//       'order_confirmed': 'Order Confirmed',
//       'processing': 'Processing',
//       'preparing': 'Preparing',
//       'packed': 'Packed',
//       'shipped': 'Shipped',
//       'out_for_delivery': 'Out for Delivery',
//       'delivered': 'Delivered',
//       'cancelled': 'Cancelled',
//       'returned': 'Returned',
//       'refunded': 'Refunded'
//     };
//     return statusTexts[status] || status;
//   };

//   const getStatusTimeline = (status: string) => {
//     const timeline = [
//       { status: 'order_confirmed', label: 'Order Confirmed', completed: true },
//       { status: 'processing', label: 'Processing', completed: ['processing', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status) },
//       { status: 'preparing', label: 'Preparing', completed: ['preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status) },
//       { status: 'packed', label: 'Packed', completed: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status) },
//       { status: 'out_for_delivery', label: 'Out for Delivery', completed: ['out_for_delivery', 'delivered'].includes(status) },
//       { status: 'delivered', label: 'Delivered', completed: status === 'delivered' }
//     ];

//     // For cancelled/returned/refunded orders, show appropriate timeline
//     if (['cancelled', 'returned', 'refunded'].includes(status)) {
//       return [
//         { status: 'order_confirmed', label: 'Order Confirmed', completed: true },
//         { status: 'cancelled', label: getStatusText(status), completed: true, isFinal: true }
//       ];
//     }

//     return timeline;
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-IN', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleReorder = (order: any) => {
//     Alert.alert(
//       'Reorder',
//       'Would you like to add these items to your cart?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Add to Cart', 
//           onPress: () => {
//             Alert.alert('Success', 'Items added to cart!');
//             navigation.navigate('Shopping');
//           }
//         }
//       ]
//     );
//   };

//   const handleTrackOrder = (orderId: string) => {
//     Alert.alert('Track Order', `Tracking order ${orderId}. You'll be notified with live updates.`);
//   };

//   const handleViewDetails = (order: any) => {
//     navigation.navigate('OrderDetails', { order });
//   };

//   const renderOrderItem = ({ item }: { item: any }) => {
//     const timeline = getStatusTimeline(item.status);
    
//     return (
//       <View style={styles.orderCard}>
//         {/* Order Header */}
//         <View style={styles.orderHeader}>
//           <View>
//             <Text style={styles.orderId}>Order #{item.orderId}</Text>
//             <Text style={styles.orderDate}>{formatDate(item.orderDate || item.createdAt)}</Text>
//           </View>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
//             <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
//               {getStatusText(item.status)}
//             </Text>
//           </View>
//         </View>

//         {/* Status Timeline */}
//         <View style={styles.timelineContainer}>
//           {timeline.map((step, index) => (
//             <View key={step.status} style={styles.timelineStep}>
//               <View style={styles.timelineContent}>
//                 <View style={[
//                   styles.timelineDot,
//                   { backgroundColor: step.completed ? getStatusColor(item.status) : '#e2e8f0' }
//                 ]}>
//                   {step.completed && (
//                     <MaterialIcons name="check" size={12} color="#fff" />
//                   )}
//                 </View>
//                 <Text style={[
//                   styles.timelineLabel,
//                   { color: step.completed ? getStatusColor(item.status) : '#94a3b8' }
//                 ]}>
//                   {step.label}
//                 </Text>
//               </View>
//               {index < timeline.length - 1 && (
//                 <View style={[
//                   styles.timelineConnector,
//                   { backgroundColor: step.completed ? getStatusColor(item.status) : '#e2e8f0' }
//                 ]} />
//               )}
//             </View>
//           ))}
//         </View>

//         {/* Order Items */}
//         <ScrollView 
//           horizontal 
//           showsHorizontalScrollIndicator={false}
//           style={styles.itemsScrollView}
//         >
//           {item.products?.map((product: any, index: number) => (
//             <View key={index} style={styles.productCard}>
//               <Image
//                 source={{ 
//                   uri: product.images && product.images.length > 0 
//                     ? getImageUrl(product.images[0]) 
//                     : 'https://via.placeholder.com/80'
//                 }}
//                 style={styles.productImage}
//               />
//               <View style={styles.productInfo}>
//                 <Text style={styles.productName} numberOfLines={2}>
//                   {product.name}
//                 </Text>
//                 <Text style={styles.productPrice}>₹{product.price?.toFixed(2)}</Text>
//                 <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
//               </View>
//             </View>
//           ))}
//         </ScrollView>

//         {/* Order Summary */}
//         <View style={styles.orderSummary}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Items Total</Text>
//             <Text style={styles.summaryValue}>
//               ₹{item.products?.reduce((total: number, product: any) => 
//                 total + (product.price * product.quantity), 0)?.toFixed(2) || '0.00'}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Shipping</Text>
//             <Text style={styles.summaryValue}>
//               {item.shipping === 0 ? 'FREE' : `₹${item.shipping?.toFixed(2) || '0.00'}`}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Tax</Text>
//             <Text style={styles.summaryValue}>₹{item.tax?.toFixed(2) || '0.00'}</Text>
//           </View>
//           <View style={[styles.summaryRow, styles.totalRow]}>
//             <Text style={styles.totalLabel}>Order Total</Text>
//             <Text style={styles.totalValue}>₹{item.totalAmount?.toFixed(2) || '0.00'}</Text>
//           </View>
//         </View>

//         {/* Order Actions */}
//         <View style={styles.orderActions}>
//           {item.status === 'delivered' && (
//             <TouchableOpacity 
//               style={[styles.actionButton, styles.reorderButton]}
//               onPress={() => handleReorder(item)}
//             >
//               <MaterialIcons name="replay" size={16} color="#4caf50" />
//               <Text style={styles.reorderButtonText}>Reorder</Text>
//             </TouchableOpacity>
//           )}
          
//           {['processing', 'preparing', 'packed', 'shipped', 'out_for_delivery'].includes(item.status) && (
//             <TouchableOpacity 
//               style={[styles.actionButton, styles.trackButton]}
//               onPress={() => handleTrackOrder(item.orderId)}
//             >
//               <MaterialIcons name="local-shipping" size={16} color="#2196f3" />
//               <Text style={styles.trackButtonText}>Track Order</Text>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity 
//             style={[styles.actionButton, styles.detailsButton]}
//             onPress={() => handleViewDetails(item)}
//           >
//             <Text style={styles.detailsButtonText}>View Details</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4caf50" />
//         <Text style={styles.loadingText}>Loading your orders...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <MaterialIcons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Orders</Text>
//         <View style={styles.headerRight} />
//       </View>

//       {orders.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <MaterialIcons name="receipt" size={80} color="#ddd" />
//           <Text style={styles.emptyTitle}>No orders yet</Text>
//           <Text style={styles.emptyText}>
//             You haven't placed any orders. Start shopping to see your orders here!
//           </Text>
//           <TouchableOpacity 
//             style={styles.shopButton}
//             onPress={() => navigation.navigate('Shopping')}
//           >
//             <Text style={styles.shopButtonText}>Start Shopping</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={orders}
//           renderItem={renderOrderItem}
//           keyExtractor={(item) => item.orderId || item._id}
//           contentContainerStyle={styles.ordersList}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//     elevation: 2,
//   },
//   backButton: {
//     padding: 5,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   headerRight: {
//     width: 34,
//   },
//   ordersList: {
//     padding: 15,
//   },
//   orderCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   orderHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   orderId: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   orderDate: {
//     fontSize: 14,
//     color: '#666',
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   timelineContainer: {
//     marginBottom: 15,
//   },
//   timelineStep: {
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   timelineContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//   },
//   timelineDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   timelineLabel: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   timelineConnector: {
//     width: 2,
//     height: 20,
//     marginLeft: 9,
//     marginVertical: 2,
//   },
//   itemsScrollView: {
//     marginBottom: 15,
//   },
//   productCard: {
//     flexDirection: 'row',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 10,
//     marginRight: 10,
//     width: 200,
//   },
//   productImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//     marginRight: 10,
//   },
//   productInfo: {
//     flex: 1,
//   },
//   productName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   productPrice: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#4caf50',
//     marginBottom: 2,
//   },
//   productQuantity: {
//     fontSize: 12,
//     color: '#666',
//   },
//   orderSummary: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: '#666',
//   },
//   summaryValue: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '500',
//   },
//   totalRow: {
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     paddingTop: 8,
//     marginTop: 4,
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   totalValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#4caf50',
//   },
//   orderActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     marginTop: 10,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 6,
//     marginLeft: 8,
//   },
//   reorderButton: {
//     backgroundColor: '#f1f8e9',
//     borderWidth: 1,
//     borderColor: '#4caf50',
//   },
//   trackButton: {
//     backgroundColor: '#e3f2fd',
//     borderWidth: 1,
//     borderColor: '#2196f3',
//   },
//   detailsButton: {
//     backgroundColor: '#f5f5f5',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   reorderButtonText: {
//     color: '#4caf50',
//     fontSize: 12,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   trackButtonText: {
//     color: '#2196f3',
//     fontSize: 12,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   detailsButtonText: {
//     color: '#666',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 30,
//   },
//   shopButton: {
//     backgroundColor: '#4caf50',
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//   },
//   shopButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default MyOrders;