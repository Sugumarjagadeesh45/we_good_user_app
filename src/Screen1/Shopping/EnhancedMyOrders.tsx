// /Users/webasebrandings/Documents/new-main/src/Screen1/Shopping/EnhancedMyOrders.tsx
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import io from 'socket.io-client';

const { width } = Dimensions.get('window');

const BASE_URL = 'https://backend-besafe.onrender.com';

const getImageUrl = (imagePath: string | undefined) => {
  if (!imagePath) return 'https://via.placeholder.com/150';
  
  // Fix localhost URLs coming from database
  if (imagePath.includes('localhost') || imagePath.includes('10.0.2.2')) {
    return imagePath.replace(/https?:\/\/(localhost|10\.0\.2\.2)(:\d+)?/i, BASE_URL);
  }
  
  if (imagePath.startsWith('http')) return imagePath;
  
  // Handle paths that might already contain 'uploads/' to prevent double slash
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  if (cleanPath.startsWith('uploads/')) {
    return `${BASE_URL}/${cleanPath}`;
  }
  return `${BASE_URL}/uploads/${cleanPath}`;
};

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

const EnhancedMyOrders = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [socket, setSocket] = useState<any>(null);

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
    setupSocket();
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userData) {
        loadOrders();
      }
    }, [userData])
  );

  const setupSocket = () => {
    const newSocket = io(BASE_URL);
    
    newSocket.on('connect', () => {
      console.log('🔌 Connected to socket for order updates');
    });
    
    newSocket.on('orderStatusUpdate', (data) => {
      console.log('🔄 Received order status update:', data);
      
      // Update the specific order status
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === data.orderId 
            ? { ...order, status: data.status }
            : order
        )
      );
      
      // Show notification for status change
      if (data.status !== 'order_confirmed') {
        Alert.alert(
          'Order Update',
          `Order #${data.orderId} is now ${getStatusText(data.status)}`
        );
      }
    });
    
    setSocket(newSocket);
  };

  const loadUserData = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const user = JSON.parse(userProfile);
        console.log('👤 Enhanced: User data loaded:', {
          customerId: user.customerId,
          userId: user._id
        });
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      if (!userData) {
        setLoading(false);
        return;
      }

      let ordersData = [];
      let success = false;

      // Strategy 1: Try customerId first
      if (userData.customerId) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/orders/customer-id/${userData.customerId}`,
            { timeout: 8000 }
          );
          
          if (response.data.success) {
            ordersData = response.data.data || [];
            success = true;
            console.log(`✅ Enhanced: Found ${ordersData.length} orders via customerId`);
          }
        } catch (error) {
          console.log('⚠️ CustomerId endpoint failed');
        }
      }

      // Strategy 2: Try userId if customerId failed
      if (!success && userData._id) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/orders/customer/${userData._id}`,
            { timeout: 8000 }
          );
          
          if (response.data.success) {
            ordersData = response.data.data || [];
            success = true;
            console.log(`✅ Enhanced: Found ${ordersData.length} orders via userId`);
          }
        } catch (error) {
          console.log('⚠️ UserId endpoint failed');
        }
      }

      // Strategy 3: Try direct endpoint as fallback
      if (!success) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/orders/customer-id/${userData.customerId || 'test'}`,
            { timeout: 8000 }
          );
          
          if (response.data.success) {
            ordersData = response.data.data || [];
            console.log(`✅ Enhanced: Found ${ordersData.length} orders via fallback`);
          }
        } catch (error) {
          console.log('⚠️ All endpoints failed');
        }
      }

      // Transform orders
      const transformedOrders = ordersData.map((order: any) => ({
        _id: order._id,
        orderId: order.orderId,
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

    } catch (error) {
      console.error('❌ Enhanced: Error loading orders:', error);
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.orderDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <Text style={styles.orderTotal}>₹{item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.paymentMethod}>{item.paymentMethod.toUpperCase()}</Text>
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>
            {item.products.length} {item.products.length === 1 ? 'item' : 'items'}
          </Text>
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {orderFilters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.id && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all' 
              ? "You haven't placed any orders yet"
              : `No ${orderFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()} orders`
            }
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Shopping')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  filters: { paddingHorizontal: 20, marginVertical: 10 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: { backgroundColor: '#4CAF50' },
  filterButtonText: { color: '#666', fontSize: 14 },
  filterButtonTextActive: { color: '#FFF', fontWeight: '600' },
  ordersList: { padding: 20 },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  orderDate: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderTotal: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  paymentMethod: { fontSize: 14, color: '#666' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  itemCount: { fontSize: 14, color: '#666' },
  trackButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default EnhancedMyOrders;