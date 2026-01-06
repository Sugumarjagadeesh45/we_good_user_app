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
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getImageUrl, getBackendUrl } from '../../../src/util/backendConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scrollY] = useState(new Animated.Value(0));

  const orderFilters = [
    { id: 'all', label: 'All', icon: 'grid-view' },
    { id: 'order_confirmed', label: 'Confirmed', icon: 'check-circle', color: '#007AFF' },
    { id: 'processing', label: 'Processing', icon: 'autorenew', color: '#5856D6' },
    { id: 'shipped', label: 'Shipped', icon: 'local-shipping', color: '#34C759' },
    { id: 'delivered', label: 'Delivered', icon: 'done-all', color: '#32D74B' },
    { id: 'cancelled', label: 'Cancelled', icon: 'close', color: '#FF3B30' }
  ];

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userData) {
        loadOrders();
      }
    }, [userData])
  );

  const loadUserData = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const user = JSON.parse(userProfile);
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

      const BASE_URL = getBackendUrl();
      let ordersData = [];

      try {
        const customerId = userData.customerId;
        if (customerId) {
          const response = await axios.get(
            `${BASE_URL}/api/orders/customer-id/${customerId}`,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }
          );

          if (response.data.success) {
            ordersData = response.data.data || [];
          }
        }
      } catch (customerIdError) {
        const userId = userData._id || userData.id;
        if (userId) {
          try {
            const response = await axios.get(
              `${BASE_URL}/api/orders/customer/${userId}`,
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
              }
            );

            if (response.data.success) {
              ordersData = response.data.data || [];
            }
          } catch (userIdError) {
            console.error('Both endpoints failed:', userIdError);
          }
        }
      }

      if (ordersData.length > 0) {
        const transformedOrders = ordersData.map((order: any) => ({
          _id: order._id,
          orderId: order.orderId || `ORD${order._id.slice(-8).toUpperCase()}`,
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

        // Sort by date (newest first)
        transformedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }

    } catch (error: any) {
      console.error('Error loading orders:', error);
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
      'pending': '#FF9500',
      'order_confirmed': '#007AFF',
      'processing': '#5856D6',
      'preparing': '#AF52DE',
      'packed': '#5AC8FA',
      'shipped': '#34C759',
      'out_for_delivery': '#FF9500',
      'delivered': '#32D74B',
      'cancelled': '#FF3B30',
      'returned': '#FF9500',
      'refunded': '#FF9500'
    };
    return statusColors[status] || '#8E8E93';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'pending': 'Pending',
      'order_confirmed': 'Confirmed',
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

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      'cod': 'Cash on Delivery',
      'upi': 'UPI',
      'card': 'Credit/Debit Card',
      'wallet': 'Digital Wallet',
      'netbanking': 'Net Banking'
    };
    return methods[method] || method;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleReorder = (order: Order) => {
    Alert.alert(
      'Reorder',
      'Add all items from this order to your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            // Implement reorder logic here
            Alert.alert('Success', 'Items added to cart');
            navigation.navigate('Cart');
          }
        }
      ]
    );
  };

  const handleTrackOrder = (order: Order) => {
    navigation.navigate('OrderTracking', { orderId: order.orderId });
  };

  const handleViewDetails = (order: Order) => {
    navigation.navigate('OrderDetails', {
      orderId: order.orderId,
      order: order
    });
  };

  const handleContactSupport = (orderId: string) => {
    Alert.alert(
      'Support',
      `Need help with order ${orderId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => {/* Call support */} },
        { text: 'Email Support', onPress: () => {/* Email support */} }
      ]
    );
  };

  const getFilteredOrders = () => {
    if (selectedFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === selectedFilter);
  };

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    const statusColor = getStatusColor(item.status);
    const totalItems = item.products.reduce((sum, product) => sum + product.quantity, 0);

    return (
      <Animated.View 
        style={[
          styles.orderCard,
          { 
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIdContainer}>
              <MaterialIcons name="receipt" size={16} color="#8E8E93" />
              <Text style={styles.orderId}>Order #{item.orderId.slice(-6)}</Text>
            </View>
            <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Products Preview */}
        <View style={styles.productsContainer}>
          {item.products.slice(0, 3).map((product, idx) => (
            <View key={idx} style={styles.productPreview}>
              <Image
                source={{
                  uri: product.images && product.images.length > 0
                    ? getImageUrl(product.images[0])
                    : 'https://via.placeholder.com/60'
                }}
                style={styles.productImage}
              />
              {product.quantity > 1 && (
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>×{product.quantity}</Text>
                </View>
              )}
            </View>
          ))}
          {item.products.length > 3 && (
            <View style={styles.moreItems}>
              <Text style={styles.moreItemsText}>+{item.products.length - 3}</Text>
            </View>
          )}
          <View style={styles.itemsInfo}>
            <Text style={styles.itemsCount}>{totalItems} items</Text>
            <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryInfo}>
          <MaterialIcons name="location-on" size={14} color="#8E8E93" />
          <Text style={styles.deliveryText} numberOfLines={1}>
            {item.deliveryAddress.city}, {item.deliveryAddress.state}
          </Text>
          <View style={styles.paymentMethod}>
            <MaterialIcons 
              name={
                item.paymentMethod === 'cod' ? 'payments' :
                item.paymentMethod === 'upi' ? 'account-balance-wallet' :
                'credit-card'
              } 
              size={14} 
              color="#8E8E93" 
            />
            <Text style={styles.paymentText}>{getPaymentMethodText(item.paymentMethod)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {item.status === 'delivered' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => handleReorder(item)}
            >
              <MaterialIcons name="replay" size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
          
          {['shipped', 'out_for_delivery'].includes(item.status) && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => handleTrackOrder(item)}
            >
              <MaterialIcons name="track-changes" size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderFilterItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === item.id && { backgroundColor: item.color || '#007AFF' }
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <MaterialIcons 
        name={item.icon as any} 
        size={16} 
        color={selectedFilter === item.id ? '#FFF' : '#8E8E93'} 
      />
      <Text style={[
        styles.filterChipText,
        selectedFilter === item.id && styles.filterChipTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredOrders();
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 100],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onRefresh} 
              style={styles.headerIconButton}
              disabled={refreshing}
            >
              <MaterialIcons 
                name="refresh" 
                size={22} 
                color="#FFF" 
                style={{ opacity: refreshing ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>
            {orders.filter(o => ['processing', 'shipped', 'out_for_delivery'].includes(o.status)).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#32D74B' }]}>
            {orders.filter(o => o.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {orderFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && { backgroundColor: filter.color || '#007AFF' }
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <MaterialIcons 
                name={filter.icon as any} 
                size={16} 
                color={selectedFilter === filter.id ? '#FFF' : '#8E8E93'} 
              />
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <MaterialIcons name="receipt-long" size={80} color="#E5E5EA" />
          </View>
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'all' ? 'No orders yet' : 'No orders found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter === 'all' 
              ? 'Your orders will appear here' 
              : `You don't have any ${selectedFilter.replace('_', ' ')} orders`
            }
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Shopping')}
          >
            <Text style={styles.ctaButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
              progressViewOffset={160}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 120,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 20,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    marginTop: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  ordersList: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  orderDate: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: -12,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  moreItems: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  itemsInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemsCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  deliveryText: {
    flex: 1,
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '500',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
//   ScrollView,
//   Dimensions,
//   Animated
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { getImageUrl, getBackendUrl } from '../../../src/util/backendConfig';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const { width } = Dimensions.get('window');

// // Define Order interface
// interface Order {
//   _id: string;
//   orderId: string;
//   status: string;
//   totalAmount: number;
//   subtotal?: number;
//   shipping?: number;
//   tax?: number;
//   products: Array<{
//     _id?: string;
//     productId?: string;
//     name: string;
//     price: number;
//     quantity: number;
//     images: string[];
//     category?: string;
//   }>;
//   deliveryAddress: {
//     name: string;
//     phone: string;
//     addressLine1: string;
//     city: string;
//     state: string;
//     pincode: string;
//     country?: string;
//   };
//   paymentMethod: string;
//   orderDate: string;
//   createdAt: string;
// }

// const MyOrders = () => {
//   const navigation = useNavigation();
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [userData, setUserData] = useState<any>(null);
//   const [selectedFilter, setSelectedFilter] = useState('all');
//   const [fadeAnim] = useState(new Animated.Value(0));

//   // Order status filters
//   const orderFilters = [
//     { id: 'all', label: 'All', icon: 'list-alt' },
//     { id: 'order_confirmed', label: 'Confirmed', icon: 'check-circle' },
//     { id: 'processing', label: 'Processing', icon: 'autorenew' },
//     { id: 'shipped', label: 'Shipped', icon: 'local-shipping' },
//     { id: 'out_for_delivery', label: 'On The Way', icon: 'near-me' },
//     { id: 'delivered', label: 'Delivered', icon: 'done-all' },
//     { id: 'cancelled', label: 'Cancelled', icon: 'cancel' }
//   ];

//   useEffect(() => {
//     loadUserData();
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
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
//       }
//     } catch (error) {
//       console.error('Error loading user data:', error);
//     }
//   };

//   const loadOrders = async () => {
//     try {
//       setLoading(true);

//       if (!userData) {
//         setLoading(false);
//         return;
//       }

//       const BASE_URL = getBackendUrl();
//       let ordersData = [];

//       try {
//         const customerId = userData.customerId;
//         if (customerId) {
//           const response = await axios.get(
//             `${BASE_URL}/api/orders/customer-id/${customerId}`,
//             {
//               headers: { 'Content-Type': 'application/json' },
//               timeout: 10000
//             }
//           );

//           if (response.data.success) {
//             ordersData = response.data.data || [];
//           }
//         }
//       } catch (customerIdError) {
//         const userId = userData._id || userData.id;
//         if (userId) {
//           try {
//             const response = await axios.get(
//               `${BASE_URL}/api/orders/customer/${userId}`,
//               {
//                 headers: { 'Content-Type': 'application/json' },
//                 timeout: 10000
//               }
//             );

//             if (response.data.success) {
//               ordersData = response.data.data || [];
//             }
//           } catch (userIdError) {
//             console.error('Both endpoints failed:', userIdError);
//           }
//         }
//       }

//       if (ordersData.length > 0) {
//         const transformedOrders = ordersData.map((order: any) => ({
//           _id: order._id,
//           orderId: order.orderId || order._id,
//           status: order.status || 'order_confirmed',
//           totalAmount: order.totalAmount || 0,
//           subtotal: order.subtotal || 0,
//           shipping: order.shipping || 0,
//           tax: order.tax || 0,
//           products: order.products?.map((product: any) => ({
//             _id: product._id || product.productId,
//             productId: product.productId || product._id,
//             name: product.name || 'Unknown Product',
//             price: product.price || 0,
//             quantity: product.quantity || 1,
//             images: Array.isArray(product.images) ? product.images : [],
//             category: product.category || 'General'
//           })) || [],
//           deliveryAddress: order.deliveryAddress || {
//             name: order.customerName || userData.name,
//             phone: order.customerPhone || userData.phoneNumber,
//             addressLine1: order.customerAddress || userData.address || '',
//             city: 'Unknown City',
//             state: 'Unknown State',
//             pincode: '000000'
//           },
//           paymentMethod: order.paymentMethod || 'card',
//           orderDate: order.orderDate || order.createdAt,
//           createdAt: order.createdAt
//         }));

//         setOrders(transformedOrders);
//       } else {
//         setOrders([]);
//       }

//     } catch (error: any) {
//       console.error('Error loading orders:', error);
//       setOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadOrders();
//     setRefreshing(false);
//   };

//   const getStatusColor = (status: string) => {
//     const statusColors: Record<string, string> = {
//       'pending': '#F59E0B',
//       'order_confirmed': '#3B82F6',
//       'processing': '#8B5CF6',
//       'preparing': '#8B5CF6',
//       'packed': '#06B6D4',
//       'shipped': '#10B981',
//       'out_for_delivery': '#F97316',
//       'delivered': '#22C55E',
//       'cancelled': '#EF4444',
//       'returned': '#F97316',
//       'refunded': '#84CC16'
//     };
//     return statusColors[status] || '#6B7280';
//   };

//   const getStatusGradient = (status: string) => {
//     const gradients: Record<string, string[]> = {
//       'pending': ['#FEF3C7', '#FDE68A'],
//       'order_confirmed': ['#DBEAFE', '#BFDBFE'],
//       'processing': ['#EDE9FE', '#DDD6FE'],
//       'shipped': ['#D1FAE5', '#A7F3D0'],
//       'out_for_delivery': ['#FFEDD5', '#FED7AA'],
//       'delivered': ['#D1FAE5', '#A7F3D0'],
//       'cancelled': ['#FEE2E2', '#FECACA']
//     };
//     return gradients[status] || ['#F3F4F6', '#E5E7EB'];
//   };

//   const getStatusText = (status: string) => {
//     const statusTexts: Record<string, string> = {
//       'pending': 'Pending',
//       'order_confirmed': 'Confirmed',
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
//     return statusTexts[status] || status.replace(/_/g, ' ').toUpperCase();
//   };

//   const getStatusIcon = (status: string) => {
//     const statusIcons: Record<string, string> = {
//       'order_confirmed': 'verified',
//       'processing': 'autorenew',
//       'shipped': 'local-shipping',
//       'out_for_delivery': 'delivery-dining',
//       'delivered': 'task-alt',
//       'cancelled': 'cancel',
//       'returned': 'keyboard-return',
//       'refunded': 'account-balance-wallet'
//     };
//     return statusIcons[status] || 'receipt';
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-IN', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (error) {
//       return 'Date not available';
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0
//     }).format(amount);
//   };

//   const handleReorder = (order: Order) => {
//     Alert.alert(
//       '🛒 Reorder Items',
//       'Would you like to add these items to your cart again?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Add to Cart',
//           onPress: () => {
//             Alert.alert('Success!', 'Items have been added to your cart');
//             navigation.navigate('Shopping');
//           }
//         }
//       ]
//     );
//   };

//   const handleTrackOrder = (orderId: string) => {
//     Alert.alert(
//       '📍 Track Order',
//       `Track your order #${orderId}\n\nYou can view real-time updates about your delivery status.`,
//       [{ text: 'OK' }]
//     );
//   };

//   const handleViewDetails = (order: Order) => {
//     navigation.navigate('OrderDetails', {
//       orderId: order.orderId,
//       order: order
//     });
//   };

//   const handleContactSupport = (orderId: string) => {
//     Alert.alert(
//       '💬 Contact Support',
//       `Need help with order #${orderId}?\n\n📞 Call: 1800-123-4567\n📧 Email: support@eazygo.com\n\nOur support team is available 24/7.`,
//       [{ text: 'OK' }]
//     );
//   };

//   const getFilteredOrders = () => {
//     if (selectedFilter === 'all') {
//       return orders;
//     }
//     return orders.filter(order => order.status === selectedFilter);
//   };

//   const renderOrderItem = ({ item }: { item: Order }) => {
//     const statusColor = getStatusColor(item.status);
//     const statusGradient = getStatusGradient(item.status);
//     const totalItems = item.products.reduce((sum, product) => sum + product.quantity, 0);

//     return (
//       <Animated.View style={{ opacity: fadeAnim }}>
//         <View style={styles.orderCard}>
//           {/* Premium Header with Gradient */}
//           <LinearGradient
//             colors={statusGradient}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.orderHeaderGradient}
//           >
//             <View style={styles.orderHeaderContent}>
//               <View style={styles.orderHeaderLeft}>
//                 <View style={styles.orderIdRow}>
//                   <MaterialIcons name="receipt-long" size={18} color="#1F2937" />
//                   <Text style={styles.orderId}>#{item.orderId.slice(-8)}</Text>
//                 </View>
//                 <View style={styles.orderDateRow}>
//                   <MaterialIcons name="schedule" size={14} color="#6B7280" />
//                   <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
//                 </View>
//               </View>
//               <View style={[styles.statusBadgePremium, { backgroundColor: statusColor }]}>
//                 <MaterialIcons
//                   name={getStatusIcon(item.status) as any}
//                   size={14}
//                   color="#FFF"
//                 />
//                 <Text style={styles.statusTextPremium}>
//                   {getStatusText(item.status)}
//                 </Text>
//               </View>
//             </View>
//           </LinearGradient>

//           {/* Items Summary */}
//           <View style={styles.itemsSummary}>
//             <View style={styles.itemsSummaryHeader}>
//               <MaterialIcons name="inventory-2" size={18} color="#6B7280" />
//               <Text style={styles.itemsSummaryTitle}>
//                 {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
//               </Text>
//               <View style={styles.totalAmountBadge}>
//                 <Text style={styles.totalAmountText}>{formatCurrency(item.totalAmount)}</Text>
//               </View>
//             </View>
//           </View>

//           {/* Product Cards - Horizontal Scroll */}
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             style={styles.productsScrollView}
//             contentContainerStyle={styles.productsScrollContent}
//           >
//             {item.products.map((product, index) => (
//               <View key={index} style={styles.productCardPremium}>
//                 <View style={styles.productImageContainer}>
//                   <Image
//                     source={{
//                       uri: product.images && product.images.length > 0
//                         ? getImageUrl(product.images[0])
//                         : 'https://via.placeholder.com/80'
//                     }}
//                     style={styles.productImagePremium}
//                   />
//                   <View style={styles.quantityBadge}>
//                     <Text style={styles.quantityText}>×{product.quantity}</Text>
//                   </View>
//                 </View>
//                 <View style={styles.productInfoPremium}>
//                   <Text style={styles.productNamePremium} numberOfLines={2}>
//                     {product.name}
//                   </Text>
//                   <Text style={styles.productPricePremium}>
//                     {formatCurrency(product.price)}
//                   </Text>
//                 </View>
//               </View>
//             ))}
//           </ScrollView>

//           {/* Delivery Info Card */}
//           <View style={styles.deliveryCard}>
//             <View style={styles.deliveryHeader}>
//               <View style={styles.deliveryIconContainer}>
//                 <MaterialIcons name="location-on" size={16} color="#EF4444" />
//               </View>
//               <Text style={styles.deliveryTitle}>Delivery Address</Text>
//             </View>
//             <Text style={styles.deliveryName}>{item.deliveryAddress.name}</Text>
//             <Text style={styles.deliveryAddress} numberOfLines={2}>
//               {item.deliveryAddress.addressLine1}, {item.deliveryAddress.city}
//             </Text>
//             <Text style={styles.deliveryPincode}>
//               {item.deliveryAddress.state} - {item.deliveryAddress.pincode}
//             </Text>
//           </View>

//           {/* Payment Info */}
//           <View style={styles.paymentCard}>
//             <View style={styles.paymentIconContainer}>
//               <MaterialIcons
//                 name={item.paymentMethod === 'cod' ? 'payments' :
//                       item.paymentMethod === 'upi' ? 'account-balance-wallet' :
//                       'credit-card'}
//                 size={16}
//                 color="#10B981"
//               />
//             </View>
//             <Text style={styles.paymentText}>
//               {item.paymentMethod === 'cod' ? 'Cash on Delivery' :
//                item.paymentMethod === 'upi' ? 'UPI Payment' :
//                item.paymentMethod === 'card' ? 'Card Payment' :
//                item.paymentMethod === 'wallet' ? 'Wallet Payment' :
//                item.paymentMethod}
//             </Text>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionButtonsContainer}>
//             {item.status === 'delivered' && (
//               <TouchableOpacity
//                 style={[styles.actionButtonPremium, styles.reorderButtonPremium]}
//                 onPress={() => handleReorder(item)}
//               >
//                 <LinearGradient
//                   colors={['#10B981', '#059669']}
//                   style={styles.actionButtonGradient}
//                 >
//                   <MaterialIcons name="replay" size={16} color="#FFF" />
//                   <Text style={styles.actionButtonTextPremium}>Reorder</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )}

//             {['processing', 'packed', 'shipped', 'out_for_delivery'].includes(item.status) && (
//               <TouchableOpacity
//                 style={[styles.actionButtonPremium, styles.trackButtonPremium]}
//                 onPress={() => handleTrackOrder(item.orderId)}
//               >
//                 <LinearGradient
//                   colors={['#3B82F6', '#2563EB']}
//                   style={styles.actionButtonGradient}
//                 >
//                   <MaterialIcons name="local-shipping" size={16} color="#FFF" />
//                   <Text style={styles.actionButtonTextPremium}>Track</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )}

//             <TouchableOpacity
//               style={[styles.actionButtonPremium, styles.detailsButtonPremium]}
//               onPress={() => handleViewDetails(item)}
//             >
//               <MaterialIcons name="visibility" size={16} color="#6B7280" />
//               <Text style={[styles.actionButtonTextPremium, { color: '#6B7280' }]}>Details</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.actionButtonPremium, styles.supportButtonPremium]}
//               onPress={() => handleContactSupport(item.orderId)}
//             >
//               <MaterialIcons name="headset-mic" size={16} color="#F59E0B" />
//               <Text style={[styles.actionButtonTextPremium, { color: '#F59E0B' }]}>Help</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Animated.View>
//     );
//   };

//   const renderFilterItem = ({ item }: { item: any }) => (
//     <TouchableOpacity
//       style={[
//         styles.filterChip,
//         selectedFilter === item.id && styles.filterChipActive
//       ]}
//       onPress={() => setSelectedFilter(item.id)}
//     >
//       {selectedFilter === item.id ? (
//         <LinearGradient
//           colors={['#10B981', '#059669']}
//           style={styles.filterChipGradient}
//         >
//           <MaterialIcons name={item.icon as any} size={14} color="#FFF" />
//           <Text style={styles.filterChipTextActive}>{item.label}</Text>
//         </LinearGradient>
//       ) : (
//         <>
//           <MaterialIcons name={item.icon as any} size={14} color="#6B7280" />
//           <Text style={styles.filterChipText}>{item.label}</Text>
//         </>
//       )}
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LinearGradient
//           colors={['#10B981', '#059669']}
//           style={styles.loadingGradient}
//         >
//           <ActivityIndicator size="large" color="#FFF" />
//           <Text style={styles.loadingTextPremium}>Loading your orders...</Text>
//         </LinearGradient>
//       </View>
//     );
//   }

//   const filteredOrders = getFilteredOrders();

//   return (
//     <View style={styles.container}>
//       {/* Premium Header */}
//       <LinearGradient
//         colors={['#10B981', '#059669']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.headerGradient}
//       >
//         <View style={styles.headerContent}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <MaterialIcons name="arrow-back" size={24} color="#FFF" />
//           </TouchableOpacity>
//           <View style={styles.headerTitleContainer}>
//             <Text style={styles.headerTitle}>My Orders</Text>
//             <Text style={styles.headerSubtitle}>{orders.length} orders placed</Text>
//           </View>
//           <TouchableOpacity
//             onPress={onRefresh}
//             style={styles.refreshButton}
//             disabled={refreshing}
//           >
//             <MaterialIcons
//               name="refresh"
//               size={24}
//               color="#FFF"
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Stats Cards */}
//         <View style={styles.statsContainerPremium}>
//           <View style={styles.statCardPremium}>
//             <View style={styles.statIconContainer}>
//               <MaterialIcons name="shopping-bag" size={20} color="#10B981" />
//             </View>
//             <Text style={styles.statNumberPremium}>{orders.length}</Text>
//             <Text style={styles.statLabelPremium}>Total</Text>
//           </View>
//           <View style={styles.statCardPremium}>
//             <View style={styles.statIconContainer}>
//               <MaterialIcons name="local-shipping" size={20} color="#3B82F6" />
//             </View>
//             <Text style={styles.statNumberPremium}>
//               {orders.filter(o => ['processing', 'shipped', 'out_for_delivery'].includes(o.status)).length}
//             </Text>
//             <Text style={styles.statLabelPremium}>In Transit</Text>
//           </View>
//           <View style={styles.statCardPremium}>
//             <View style={styles.statIconContainer}>
//               <MaterialIcons name="task-alt" size={20} color="#22C55E" />
//             </View>
//             <Text style={styles.statNumberPremium}>
//               {orders.filter(o => o.status === 'delivered').length}
//             </Text>
//             <Text style={styles.statLabelPremium}>Delivered</Text>
//           </View>
//         </View>
//       </LinearGradient>

//       {/* Filters */}
//       <View style={styles.filtersSection}>
//         <FlatList
//           data={orderFilters}
//           renderItem={renderFilterItem}
//           keyExtractor={(item) => item.id}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.filtersContent}
//         />
//       </View>

//       {/* Orders List or Empty State */}
//       {filteredOrders.length === 0 ? (
//         <View style={styles.emptyStatePremium}>
//           <LinearGradient
//             colors={['#F9FAFB', '#F3F4F6']}
//             style={styles.emptyStateGradient}
//           >
//             <View style={styles.emptyIconContainer}>
//               <MaterialIcons name="receipt-long" size={64} color="#D1D5DB" />
//             </View>
//             <Text style={styles.emptyTitlePremium}>
//               {selectedFilter === 'all'
//                 ? "No orders yet"
//                 : `No ${orderFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()} orders`
//               }
//             </Text>
//             <Text style={styles.emptyTextPremium}>
//               {selectedFilter === 'all'
//                 ? "Start shopping to see your orders here!"
//                 : `You don't have any ${orderFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()} orders.`
//               }
//             </Text>
//             <TouchableOpacity
//               style={styles.shopButtonPremium}
//               onPress={() => navigation.navigate('Shopping')}
//             >
//               <LinearGradient
//                 colors={['#10B981', '#059669']}
//                 style={styles.shopButtonGradient}
//               >
//                 <MaterialIcons name="shopping-cart" size={20} color="#FFF" />
//                 <Text style={styles.shopButtonText}>Start Shopping</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </LinearGradient>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredOrders}
//           renderItem={renderOrderItem}
//           keyExtractor={(item) => item.orderId}
//           contentContainerStyle={styles.ordersList}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#10B981']}
//               tintColor="#10B981"
//             />
//           }
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F9FAFB',
//   },
//   loadingGradient: {
//     paddingVertical: 40,
//     paddingHorizontal: 60,
//     borderRadius: 20,
//     alignItems: 'center',
//   },
//   loadingTextPremium: {
//     marginTop: 16,
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFF',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     elevation: 8,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   backButton: {
//     padding: 8,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   headerTitleContainer: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#FFF',
//     letterSpacing: 0.5,
//   },
//   headerSubtitle: {
//     fontSize: 13,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 2,
//   },
//   refreshButton: {
//     padding: 8,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   statsContainerPremium: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     gap: 12,
//   },
//   statCardPremium: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   statIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statNumberPremium: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   statLabelPremium: {
//     fontSize: 11,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   filtersSection: {
//     backgroundColor: '#FFF',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   filtersContent: {
//     paddingHorizontal: 20,
//   },
//   filterChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 20,
//     backgroundColor: '#F3F4F6',
//     marginRight: 10,
//     gap: 6,
//   },
//   filterChipActive: {
//     backgroundColor: 'transparent',
//     padding: 0,
//   },
//   filterChipGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 20,
//     gap: 6,
//   },
//   filterChipText: {
//     fontSize: 13,
//     color: '#6B7280',
//     fontWeight: '600',
//   },
//   filterChipTextActive: {
//     fontSize: 13,
//     color: '#FFF',
//     fontWeight: '600',
//   },
//   ordersList: {
//     padding: 16,
//     paddingBottom: 30,
//   },
//   orderCard: {
//     backgroundColor: '#FFF',
//     borderRadius: 20,
//     marginBottom: 16,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     overflow: 'hidden',
//   },
//   orderHeaderGradient: {
//     padding: 16,
//   },
//   orderHeaderContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   orderHeaderLeft: {
//     flex: 1,
//   },
//   orderIdRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 4,
//   },
//   orderId: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1F2937',
//     letterSpacing: 0.5,
//   },
//   orderDateRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   orderDate: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   statusBadgePremium: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     gap: 4,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   statusTextPremium: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#FFF',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   itemsSummary: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   itemsSummaryHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   itemsSummaryTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     flex: 1,
//   },
//   totalAmountBadge: {
//     backgroundColor: '#ECFDF5',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   totalAmountText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#10B981',
//   },
//   productsScrollView: {
//     paddingVertical: 12,
//   },
//   productsScrollContent: {
//     paddingHorizontal: 16,
//     gap: 12,
//   },
//   productCardPremium: {
//     width: 140,
//     marginRight: 12,
//   },
//   productImageContainer: {
//     position: 'relative',
//     marginBottom: 8,
//   },
//   productImagePremium: {
//     width: 140,
//     height: 140,
//     borderRadius: 12,
//     backgroundColor: '#F3F4F6',
//   },
//   quantityBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: '#1F2937',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   quantityText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#FFF',
//   },
//   productInfoPremium: {
//     gap: 4,
//   },
//   productNamePremium: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#374151',
//     lineHeight: 18,
//   },
//   productPricePremium: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#10B981',
//   },
//   deliveryCard: {
//     margin: 16,
//     marginBottom: 12,
//     padding: 16,
//     backgroundColor: '#FEF3C7',
//     borderRadius: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: '#EF4444',
//   },
//   deliveryHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//     gap: 8,
//   },
//   deliveryIconContainer: {
//     width: 28,
//     height: 28,
//     borderRadius: 8,
//     backgroundColor: '#FFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   deliveryTitle: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#92400E',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   deliveryName: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   deliveryAddress: {
//     fontSize: 14,
//     color: '#4B5563',
//     lineHeight: 20,
//   },
//   deliveryPincode: {
//     fontSize: 13,
//     color: '#6B7280',
//     fontWeight: '600',
//     marginTop: 2,
//   },
//   paymentCard: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 14,
//     backgroundColor: '#ECFDF5',
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   paymentIconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     backgroundColor: '#FFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   paymentText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#065F46',
//     flex: 1,
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   actionButtonPremium: {
//     flex: 1,
//     minWidth: 80,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   actionButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     gap: 6,
//   },
//   reorderButtonPremium: {
//     backgroundColor: 'transparent',
//   },
//   trackButtonPremium: {
//     backgroundColor: 'transparent',
//   },
//   detailsButtonPremium: {
//     backgroundColor: '#F3F4F6',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     gap: 6,
//   },
//   supportButtonPremium: {
//     backgroundColor: '#FEF3C7',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     gap: 6,
//   },
//   actionButtonTextPremium: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#FFF',
//   },
//   emptyStatePremium: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyStateGradient: {
//     width: '100%',
//     alignItems: 'center',
//     paddingVertical: 60,
//     borderRadius: 24,
//   },
//   emptyIconContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#FFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   emptyTitlePremium: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 12,
//   },
//   emptyTextPremium: {
//     fontSize: 15,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//     paddingHorizontal: 20,
//   },
//   shopButtonPremium: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     elevation: 4,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   shopButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 32,
//     gap: 10,
//   },
//   shopButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
// });

// export default MyOrders;
