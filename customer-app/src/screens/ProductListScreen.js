import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, useWindowDimensions, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { productsAPI, categoriesAPI, searchAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popularity', apiSort: '-rating' },
  { value: 'price_low', label: 'Price: Low to High', apiSort: 'price' },
  { value: 'price_high', label: 'Price: High to Low', apiSort: '-price' },
  { value: 'rating', label: 'Rating', apiSort: '-rating' },
  { value: 'newest', label: 'Newest First', apiSort: '-createdAt' },
];

const ProductListScreen = ({ route, navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const { categoryId, categoryName, sortBy: defaultSort, query: searchQuery } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState(defaultSort || 'popular');
  const [showSortModal, setShowSortModal] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  const productItemWidth = (windowWidth - 36) / 2;

  useEffect(() => {
    navigation.setOptions({
      title: categoryName || 'Products',
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.headerBtn}>
            <Ionicons name="swap-vertical" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [categoryName, sortBy]);

  useEffect(() => { fetchProducts(true); }, [categoryId, sortBy, searchQuery]);

  const fetchProducts = async (reset = false, overridePage = null) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const currentPage = reset ? 1 : (overridePage || page);
      const sortOption = SORT_OPTIONS.find((o) => o.value === sortBy);
      const apiSort = sortOption?.apiSort || '-rating';

      let productList = [];
      let total = 0;

      if (searchQuery) {
        const res = await searchAPI.search({ q: searchQuery, page: currentPage, limit: 20, sort: apiSort });
        const data = res?.data || res || {};
        productList = Array.isArray(data) ? data : (data.results || data.products || []);
        total = data.total || productList.length;
      } else {
        const params = { page: currentPage, limit: 20, sort: apiSort };
        if (categoryId) params.category = categoryId;
        const res = await productsAPI.getAll(params);
        const data = res?.data || res || {};
        productList = Array.isArray(data) ? data : (data.items || data.products || []);
        total = data.total || productList.length;
      }

      setProducts((prev) => reset ? productList : [...prev, ...productList]);
      setTotalProducts(total);
      setHasMore(productList.length === 20);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setPage((prev) => {
        const nextPage = prev + 1;
        setTimeout(() => fetchProducts(false, nextPage), 0);
        return nextPage;
      });
    }
  }, [loadingMore, hasMore, loading, sortBy, categoryId, searchQuery]);

  const renderProduct = ({ item, index }) => (
    <View style={{ width: productItemWidth, marginBottom: SIZES.sm }}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={COLORS.secondary} style={styles.footerLoader} />;
  };

  const renderSortModal = () => (
    <Modal visible={showSortModal} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSortModal(false)} activeOpacity={1}>
        <View style={styles.sortModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Sort By</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortOption, sortBy === option.value && styles.sortOptionActive]}
              onPress={() => { setSortBy(option.value); setShowSortModal(false); }}
            >
              <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextActive]}>
                {option.label}
              </Text>
              {sortBy === option.value && <Ionicons name="checkmark" size={20} color={COLORS.secondary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      {!loading && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>{totalProducts} Products</Text>
          <TouchableOpacity onPress={() => setShowSortModal(true)}>
            <Text style={styles.sortText}>Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <View style={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={{ width: productItemWidth, marginBottom: SIZES.sm }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : products.length === 0 ? (
        <EmptyState icon="bag-outline" title="No Products Found" message="We couldn't find any products matching your criteria" buttonText="Go Home" onButtonPress={() => navigation.navigate('HomeTab')} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item._id || item.id)}
          numColumns={2}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerActions: { flexDirection: 'row' },
  headerBtn: { paddingHorizontal: SIZES.md },
  resultsBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  resultsText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  sortText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  productGrid: { padding: SIZES.sm },
  row: { justifyContent: 'space-between', paddingHorizontal: 2 },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: SIZES.sm },
  footerLoader: { paddingVertical: SIZES.xl },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sortModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding, paddingBottom: 40, paddingTop: SIZES.sm,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray300, alignSelf: 'center', marginBottom: SIZES.lg },
  modalTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sortOptionActive: {},
  sortOptionText: { fontSize: SIZES.font.md, color: COLORS.textPrimary },
  sortOptionTextActive: { color: COLORS.secondary, fontWeight: '700' },
});

export default ProductListScreen;
