// /Users/webasebrandings/Downloads/new-main/src/Screen1/Shopping/ProfessionalShoppingContent.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useCart } from './ShoppingContent';
import { getBackendUrl, getImageUrl } from '../../../src/util/backendConfig';

const { width } = Dimensions.get('window');

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  description: string;
  category: string;
  images: string[];
}

interface Banner {
  _id: string;
  bannerImage: string;
  targetType: 'product' | 'category' | 'custom';
  targetId?: string;
  customUrl?: string;
  title: string;
  description: string;
  isActive: boolean;
  targetProduct?: Product;
}

const ProfessionalShoppingContent = () => {
  const navigation = useNavigation();
  const { addToCart, cartItems } = useCart();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerScrollX] = useState(new Animated.Value(0));

  const BASE_URL = getBackendUrl();

  // Function to calculate discount percentage
  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enhanced auto-slide banners with smooth animation
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => {
          const nextIndex = prevIndex === banners.length - 1 ? 0 : prevIndex + 1;
          
          // Animate banner scroll
          Animated.spring(bannerScrollX, {
            toValue: nextIndex * width,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
          
          return nextIndex;
        });
      }, 6000); // Change banner every 6 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts(), fetchBanners()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/groceries/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Beauty', 'Toys']);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/groceries`);
      if (response.data.success) {
        const allProducts: Product[] = response.data.data || [];
        setProducts(allProducts);
        setFeaturedProducts(allProducts.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setFeaturedProducts([]);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/banners?activeOnly=true`);
      if (response.data.success) {
        setBanners(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleBannerPress = (banner: Banner) => {
    switch (banner.targetType) {
      case 'product':
        if (banner.targetId) {
          const product = products.find(p => p._id === banner.targetId);
          if (product) {
            navigation.navigate('Buying', { product });
          } else {
            Alert.alert('Error', 'Product not found');
          }
        }
        break;
      
      case 'category':
        if (banner.targetId) {
          setSelectedCategory(banner.targetId);
        }
        break;
      
      case 'custom':
        if (banner.customUrl) {
          Linking.openURL(banner.customUrl).catch(err => 
            Alert.alert('Error', 'Could not open URL')
          );
        }
        break;
      
      default:
        console.warn('Unknown banner target type:', banner.targetType);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }
    addToCart(product);
    Alert.alert('Success', `${product.name} added to cart`);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = searchText === '' || 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <View style={[
        styles.categoryIconContainer,
        selectedCategory === item && styles.selectedCategoryIcon
      ]}>
        <MaterialIcons 
          name={getCategoryIcon(item)} 
          size={24} 
          color={selectedCategory === item ? '#fff' : '#4caf50'} 
        />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.selectedCategoryText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'All': 'apps',
      'Electronics': 'devices',
      'Clothing': 'checkroom',
      'Food': 'restaurant',
      'Books': 'menu-book',
      'Sports': 'sports',
      'Home': 'home',
      'Beauty': 'spa',
      'Toys': 'toys',
    };
    return icons[category] || 'category';
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const discountPercentage = calculateDiscount(item.originalPrice, item.price);
    const imageUrl = getImageUrl(item.images?.[0]);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('EnhancedBuying', { product: item })}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            onError={(e) => console.log('Product image failed to load:', imageUrl)}
          />
          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={() => Alert.alert('Added to Wishlist')}
          >
            <MaterialIcons name="favorite-border" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{item.price.toFixed(2)}</Text>
            {item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>₹{item.originalPrice.toFixed(2)}</Text>
            )}
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1,2,3,4,5].map((star) => (
                <MaterialIcons key={star} name="star" size={14} color="#FFD700" />
              ))}
            </View>
            <Text style={styles.ratingText}>(4.5)</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addToCartBtn}
            onPress={() => handleAddToCart(item)}
          >
            <MaterialIcons name="add-shopping-cart" size={16} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBannerItem = ({ item, index }: { item: Banner; index: number }) => {
    const imageUrl = getImageUrl(item.bannerImage);
    
    return (
      <TouchableOpacity 
        style={styles.bannerCard}
        onPress={() => handleBannerPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.bannerImage}
          onError={(e) => console.log('Banner image error:', imageUrl)}
        />
        {(item.title || item.description) && (
          <View style={styles.bannerOverlay}>
            {item.title && (
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {item.title}
              </Text>
            )}
            {item.description && (
              <Text style={styles.bannerDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('EnhancedCart')}
          >
            <MaterialIcons name="shopping-cart" size={24} color="#333" />
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Banner Slider */}
        {banners.length > 0 && (
          <View style={styles.bannerSection}>
            <Animated.FlatList
              data={banners}
              renderItem={renderBannerItem}
              keyExtractor={(item) => item._id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: bannerScrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / width
                );
                setCurrentBannerIndex(newIndex);
              }}
            />
            
            {/* Enhanced Banner Indicator */}
            {banners.length > 1 && (
              <View style={styles.bannerIndicator}>
                {banners.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicatorDot,
                      index === currentBannerIndex ? styles.activeDot : styles.inactiveDot
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Search Results Info */}
        {searchText.length > 0 && (
          <View style={styles.searchInfo}>
            <MaterialIcons name="search" size={16} color="#1976d2" />
            <Text style={styles.searchInfoText}>
              Search results for "{searchText}" ({filteredProducts.length} items found)
            </Text>
          </View>
        )}

        {/* Enhanced Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={['All', ...categories]}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Enhanced Products Grid */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                {searchText.length > 0 && ` - Search: "${searchText}"`}
              </Text>
              <Text style={styles.productCount}>({filteredProducts.length} items)</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#4caf50" />
            </TouchableOpacity>
          </View>
          
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>
                {products.length === 0 ? 'No products available' : 'Try changing your search or category'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductCard}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productsGrid}
              columnWrapperStyle={styles.columnWrapper}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e53935',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  searchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 8,
  },
  searchInfoText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bannerSection: {
    height: 200,
    position: 'relative',
    marginTop: 10,
  },
  bannerCard: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bannerDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  bannerIndicator: {
    position: 'absolute',
    bottom: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoriesSection: {
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f8f9fa',
  },
  selectedCategoryIcon: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedCategory: {
    // Styles for selected category
  },
  selectedCategoryText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  productsSection: {
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  productsGrid: {
    paddingHorizontal: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    width: (width - 40) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 5,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 150,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e53935',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfessionalShoppingContent;
