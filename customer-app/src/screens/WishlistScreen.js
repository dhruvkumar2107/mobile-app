import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { wishlistAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

const WishlistScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();
  const { fetchCart, addToCart } = useCart();

  useEffect(() => { if (isAuthenticated) fetchWishlist(); }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.get();
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  };

  const removeItem = async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      setItems((prev) => prev.filter((item) => (item._id || item.id || item.productId) !== productId));
      setToast({ visible: true, message: 'Removed from wishlist', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to remove', type: 'error' });
    }
  };

  const moveToCart = async (item) => {
    try {
      const productId = item._id || item.id || item.productId || item.product?._id;
      await addToCart(productId, 1);
      await removeItem(productId);
      setToast({ visible: true, message: 'Moved to cart', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to move to cart', type: 'error' });
    }
  };

  const renderItem = ({ item }) => {
    const product = item.product || item;
    return (
      <View style={styles.itemWrap}>
        <ProductCard
          product={product}
          onPress={() => navigation.navigate('ProductDetail', { productId: product._id || product.id })}
          onWishlistPress={() => removeItem(product._id || product.id)}
          isWishlisted={true}
        />
        <TouchableOpacity style={styles.moveToCartBtn} onPress={() => moveToCart(item)}>
          <Ionicons name="bag-outline" size={14} color={COLORS.secondary} />
          <Text style={styles.moveToCartText}>Move to Bag</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          message="Sign in to save items you love"
          buttonText="Sign In"
          onButtonPress={() => navigation.navigate('Auth')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          message="Explore our collection and save items you love"
          buttonText="Explore Now"
          onButtonPress={() => navigation.navigate('HomeTab')}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item._id || item.id || item.productId)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} tintColor={COLORS.secondary} />}
        />
      )}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: SIZES.sm },
  row: { justifyContent: 'space-between' },
  itemWrap: { width: '48%', marginBottom: SIZES.md },
  moveToCartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary + '15', paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm, marginTop: SIZES.xs, gap: 4,
  },
  moveToCartText: { fontSize: SIZES.font.xs, color: COLORS.secondary, fontWeight: '700' },
});

export default WishlistScreen;
