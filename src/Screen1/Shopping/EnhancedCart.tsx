import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from './ShoppingContent';
import { getImageUrl } from '../../../src/util/backendConfig';

const EnhancedCart = () => {
  const navigation = useNavigation();
  const { cartItems, removeFromCart, clearCart, updateQuantity } = useContext(CartContext);

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

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some products to proceed.');
      return;
    }
    navigation.navigate('BuyNow');
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
              onPress={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
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
            onPress={() => navigation.navigate('Shopping')}
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
             
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Proceed to Checkout Button */}
          <View style={styles.checkoutContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
              <Text style={styles.totalLabel}>Total Amount</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleProceedToCheckout}
            >
              <Text style={styles.checkoutButtonText}>
                Proceed to Checkout ({calculateTotalItems()} items)
              </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedCart;

