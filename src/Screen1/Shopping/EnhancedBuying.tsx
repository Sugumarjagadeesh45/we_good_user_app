// /Users/webasebrandings/Downloads/new-main/src/Screen1/Shopping/EnhancedBuying.tsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Dimensions, 
  FlatList,
  Animated
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from './ShoppingContent';
import { getImageUrl } from '../../../src/util/backendConfig';

const { width } = Dimensions.get('window');

const EnhancedBuying = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params as any;
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Calculate discount percentage
  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const discountPercentage = calculateDiscount(product.originalPrice, product.price);

  // Auto-slide images every 8 seconds
  useEffect(() => {
    if (product.images && product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => 
          prev === product.images.length - 1 ? 0 : prev + 1
        );
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [product.images]);

  // Animate scroll when image index changes
  useEffect(() => {
    if (flatListRef.current && product.images) {
      flatListRef.current.scrollToIndex({
        index: currentImageIndex,
        animated: true
      });
    }
  }, [currentImageIndex]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    Alert.alert('Success', `${product.name} (${quantity}) added to cart`);
  };

  const handleBuyNow = () => {
    Alert.alert('Order Placed', `Your order for ${product.name} (${quantity}) has been placed successfully!`);
    navigation.navigate('BuyNow');
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => {
    const imageUrl = getImageUrl(item);

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderSimilarProduct = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.images?.[0]);
    const itemDiscount = calculateDiscount(item.originalPrice, item.price);

    return (
      <TouchableOpacity 
        style={styles.similarProductCard}
        onPress={() => navigation.replace('EnhancedBuying', { product: item })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.similarProductImage}
        />
        <Text style={styles.similarProductName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.similarProductPrice}>
          <Text style={styles.similarCurrentPrice}>₹{item.price.toFixed(2)}</Text>
          {item.originalPrice > item.price && (
            <Text style={styles.similarOriginalPrice}>₹{item.originalPrice.toFixed(2)}</Text>
          )}
        </View>
        {itemDiscount > 0 && (
          <View style={styles.similarDiscountBadge}>
            <Text style={styles.similarDiscountText}>{itemDiscount}% OFF</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Mock similar products data (in real app, fetch from API)
  const similarProducts = [product, product, product]; // Replace with actual similar products

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          <FlatList
            ref={flatListRef}
            data={product.images || []}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          />
          
          {/* Image Indicator */}
          {product.images && product.images.length > 1 && (
            <View style={styles.imageIndicator}>
              {product.images.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === currentImageIndex ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <MaterialIcons name="arrow-downward" size={16} color="#fff" />
              <Text style={styles.discountBadgeText}>{discountPercentage}% OFF</Text>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Price Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {discountPercentage > 0 && (
                <View style={styles.discountContainer}>
                  <Text style={styles.discountPercentage}>{discountPercentage}% OFF</Text>
                </View>
              )}
              {product.originalPrice > product.price && (
                <Text style={styles.originalPrice}>₹{product.originalPrice.toFixed(2)}</Text>
              )}
              <Text style={styles.currentPrice}>₹{product.price.toFixed(2)}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>4.5 (120 reviews)</Text>
            </View>
          </View>

          {/* Description with Expand/Collapse */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text 
              style={styles.productDescription} 
              numberOfLines={descriptionExpanded ? undefined : 5}
            >
              {product.description}
            </Text>
            {product.description.length > 150 && (
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {descriptionExpanded ? 'Show Less' : 'Read More'}
                </Text>
                <MaterialIcons 
                  name={descriptionExpanded ? 'expand-less' : 'expand-more'} 
                  size={16} 
                  color="#4caf50" 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Delivery Details */}
          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.deliveryInfo}>
              <MaterialIcons name="local-shipping" size={20} color="#4caf50" />
              <View style={styles.deliveryText}>
                <Text style={styles.deliveryTitle}>Free Delivery</Text>
                <Text style={styles.deliverySubtitle}>Order above ₹499</Text>
              </View>
            </View>
            <View style={styles.deliveryInfo}>
              <MaterialIcons name="schedule" size={20} color="#4caf50" />
              <View style={styles.deliveryText}>
                <Text style={styles.deliveryTitle}>Delivery by Tomorrow</Text>
                <Text style={styles.deliverySubtitle}>If ordered before 6 PM</Text>
              </View>
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                onPress={decreaseQuantity}
                disabled={quantity === 1}
              >
                <MaterialIcons name="remove" size={20} color={quantity === 1 ? '#ccc' : '#333'} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                <MaterialIcons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₹{(product.price * quantity).toFixed(2)}</Text>
          </View>

          {/* Similar Products */}
          <View style={styles.similarProductsSection}>
            <View style={styles.similarProductsHeader}>
              <Text style={styles.sectionTitle}>Similar Products</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#4caf50" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={similarProducts}
              renderItem={renderSimilarProduct}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarProductsList}
            />
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
          <MaterialIcons name="add-shopping-cart" size={20} color="#4caf50" />
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
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
  shareButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  imageSliderContainer: {
    height: 350,
    position: 'relative',
  },
  imageContainer: {
    width: width,
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4caf50',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  discountPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e53935',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4caf50',
    marginLeft: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  expandButtonText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  deliverySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityButtonDisabled: {
    backgroundColor: '#fafafa',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
  },
  similarProductsSection: {
    marginBottom: 100,
  },
  similarProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewAllText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  similarProductsList: {
    paddingRight: 20,
  },
  similarProductCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  similarProductImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    height: 40,
  },
  similarProductPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarCurrentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginRight: 8,
  },
  similarOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  similarDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarDiscountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 15,
    marginRight: 10,
  },
  cartButtonText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedBuying;