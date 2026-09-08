import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, StatusBar, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { productsAPI, categoriesAPI } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Banner from '../components/Banner';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import FlashSaleTimer from '../components/FlashSaleTimer';
import SearchBar from '../components/SearchBar';
import { ProductCardSkeleton, CategorySkeleton, BannerSkeleton } from '../components/SkeletonLoader';
import Toast from '../components/Toast';

const BANNERS = [
  { id: '1', title: 'New Season Collection', subtitle: 'Up to 40% off on luxury brands', buttonText: 'Shop Now', color: COLORS.primary },
  { id: '2', title: 'Premium Watches', subtitle: 'Timeless elegance for every occasion', buttonText: 'Explore', color: COLORS.primary },
  { id: '3', title: 'Exclusive Deals', subtitle: 'Limited time offers on designer picks', buttonText: 'Grab Now', color: COLORS.primary },
];

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, bestRes, newRes, allRes] = await Promise.allSettled([
        categoriesAPI.getAll(),
        productsAPI.getAll({ sort: '-rating', limit: 10 }),
        productsAPI.getAll({ sort: '-createdAt', limit: 10 }),
        productsAPI.getAll({ limit: 20 }),
      ]);

      const catData = catsRes.status === 'fulfilled' ? (catsRes.value?.data || catsRes.value || []) : [];
      setCategories(Array.isArray(catData) ? catData : []);

      const bestData = bestRes.status === 'fulfilled' ? (bestRes.value?.data || bestRes.value || []) : [];
      setBestSellers(Array.isArray(bestData) ? bestData : (bestData.items || bestData.products || []));

      const newData = newRes.status === 'fulfilled' ? (newRes.value?.data || newRes.value || []) : [];
      setNewArrivals(Array.isArray(newData) ? newData : (newData.items || newData.products || []));

      const allData = allRes.status === 'fulfilled' ? (allRes.value?.data || allRes.value || []) : [];
      const products = Array.isArray(allData) ? allData : (allData.items || allData.products || []);
      setAllProducts(products);

      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setRecommended(shuffled.slice(0, 10));
      setFlashSaleProducts(products.filter((p) => p.mrp && p.mrp > p.price).slice(0, 6));
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, [isAuthenticated, navigation]);

  const SectionHeader = useCallback(({ title, onSeeAll, accent }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {accent && <View style={styles.goldAccentLine} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.secondary} />
        </TouchableOpacity>
      )}
    </View>
  ), []);

  const renderProductHorizontal = useCallback(({ item }) => (
    <View style={styles.horizontalProductWrap}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
        onWishlistPress={() => toggleWishlist(item._id || item.id)}
        isWishlisted={wishlist.includes(item._id || item.id)}
      />
    </View>
  ), [navigation, toggleWishlist, wishlist]);

  const flashSaleEnd = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, []);

  const FlashSaleSection = useCallback(() => (
    <View style={styles.flashSaleContainer}>
      <View style={styles.flashSaleHeader}>
        <View style={styles.flashSaleTitleRow}>
          <Ionicons name="flash" size={20} color={COLORS.error} />
          <Text style={styles.flashSaleTitle}>Flash Sale</Text>
        </View>
        <FlashSaleTimer endTime={flashSaleEnd} />
      </View>
      <View style={styles.flashSaleBadge}>
        <Text style={styles.flashSaleBadgeText}>ENDS SOON</Text>
      </View>
      {loading ? (
        <FlatList horizontal data={[1, 2, 3]} renderItem={() => <ProductCardSkeleton />} keyExtractor={(i) => String(i)} showsHorizontalScrollIndicator={false} />
      ) : (
        <FlatList
          horizontal
          data={flashSaleProducts.slice(0, 6)}
          renderItem={renderProductHorizontal}
          keyExtractor={(item) => `flash-${item._id || item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flashSaleList}
        />
      )}
    </View>
  ), [loading, flashSaleProducts, renderProductHorizontal, flashSaleEnd]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {isAuthenticated ? (user?.name?.split(' ')[0] || 'Guest') : 'Guest'}</Text>
            <Text style={styles.headerSubtitle}>What would you like to buy?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => {
              if (!isAuthenticated) { navigation.navigate('Auth'); return; }
              navigation.navigate('Profile', { screen: 'Notifications' });
            }}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="bag-outline" size={22} color={COLORS.white} />
              {totalItems > 0 && (
                <View style={styles.cartBadge}><Text style={styles.badgeText}>{totalItems}</Text></View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
          <SearchBar editable={false} placeholder="Search for brands, products..." />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
      >
        {loading ? (
          <View style={styles.section}><BannerSkeleton /></View>
        ) : (
          <View style={styles.section}>
            <Banner banners={BANNERS} onBannerPress={() => {
              navigation.navigate('ProductList', { sortBy: 'popular' });
            }} />
          </View>
        )}

        <FlashSaleSection />

        <View style={styles.section}>
          <SectionHeader title="Shop by Category" onSeeAll={() => navigation.navigate('Categories')} accent />
          {loading ? (
            <FlatList horizontal data={[1, 2, 3, 4, 5]} renderItem={() => <CategorySkeleton />} keyExtractor={(i) => String(i)} showsHorizontalScrollIndicator={false} />
          ) : (
            <FlatList
              horizontal
              data={categories.slice(0, 10)}
              renderItem={({ item }) => (
                <CategoryCard
                  category={item}
                  onPress={() => navigation.navigate('ProductList', { categoryId: item._id || item.id, categoryName: item.name })}
                />
              )}
              keyExtractor={(item) => String(item._id || item.id)}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        {(loading || bestSellers.length > 0) && (
          <View style={styles.section}>
            <SectionHeader title="Best Sellers" onSeeAll={() => navigation.navigate('ProductList', { sortBy: 'rating' })} accent />
            {loading ? (
              <FlatList horizontal data={[1, 2, 3]} renderItem={() => <ProductCardSkeleton />} keyExtractor={(i) => String(i)} showsHorizontalScrollIndicator={false} />
            ) : (
              <FlatList
                horizontal
                data={bestSellers.slice(0, 10)}
                renderItem={renderProductHorizontal}
                keyExtractor={(item) => `best-${item._id || item.id}`}
                showsHorizontalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {(loading || newArrivals.length > 0) && (
          <View style={styles.section}>
            <SectionHeader title="New Arrivals" onSeeAll={() => navigation.navigate('ProductList', { sortBy: 'newest' })} accent />
            {loading ? (
              <View style={styles.productGrid}>{[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}</View>
            ) : (
              <View style={styles.productGrid}>
                {newArrivals.slice(0, 4).map((item) => (
                  <View key={`new-${item._id || item.id}`} style={[styles.productGridItem, { width: (width - 40) / 2 }]}>
                    <ProductCard
                      product={item}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                      onWishlistPress={() => toggleWishlist(item._id || item.id)}
                      isWishlisted={wishlist.includes(item._id || item.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {(loading || recommended.length > 0) && (
          <View style={styles.section}>
            <SectionHeader title="Recommended for You" accent />
            {loading ? (
              <FlatList horizontal data={[1, 2, 3]} renderItem={() => <ProductCardSkeleton />} keyExtractor={(i) => String(i)} showsHorizontalScrollIndicator={false} />
            ) : (
              <FlatList
                horizontal
                data={recommended.slice(0, 10)}
                renderItem={renderProductHorizontal}
                keyExtractor={(item) => `rec-${item._id || item.id}`}
                showsHorizontalScrollIndicator={false}
              />
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: SIZES.lg, paddingHorizontal: SIZES.padding },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  greeting: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: SIZES.font.sm, color: COLORS.accent, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: SIZES.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  scrollContent: { flex: 1 },
  section: { marginTop: SIZES.lg, paddingHorizontal: SIZES.padding },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  goldAccentLine: { width: 3, height: 18, backgroundColor: COLORS.secondary, borderRadius: 2 },
  sectionTitle: { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.textPrimary },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  horizontalProductWrap: { width: 160, marginRight: SIZES.md },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productGridItem: { marginBottom: SIZES.sm },
  flashSaleContainer: {
    marginTop: SIZES.lg,
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    overflow: 'hidden',
  },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  flashSaleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  flashSaleTitle: { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.white },
  flashSaleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: SIZES.md,
  },
  flashSaleBadgeText: { color: COLORS.white, fontSize: SIZES.font.xs, fontWeight: '700', letterSpacing: 1 },
  flashSaleList: { paddingVertical: SIZES.xs },
});

export default HomeScreen;
