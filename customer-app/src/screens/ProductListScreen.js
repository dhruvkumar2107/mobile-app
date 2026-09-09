import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, useWindowDimensions, Modal, Platform, ScrollView, RefreshControl,
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

const PRICE_BRACKETS = [
  { value: 'under500', label: 'Under ₹500', min: 0, max: 500 },
  { value: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { value: '1000-5000', label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { value: '5000-10000', label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { value: 'above10000', label: 'Above ₹10,000', min: 10000, max: Infinity },
];

const RATING_FILTERS = [
  { value: 4, label: '4★ & above' },
  { value: 3, label: '3★ & above' },
  { value: 2, label: '2★ & above' },
  { value: 1, label: '1★ & above' },
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriceBracket, setSelectedPriceBracket] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

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
      if (reset) extractBrands(productList);
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
  }, [loadingMore, hasMore, loading, sortBy, categoryId, searchQuery, selectedPriceBracket, selectedRating, selectedBrand]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(true);
    setRefreshing(false);
  }, [categoryId, sortBy, searchQuery, selectedPriceBracket, selectedRating, selectedBrand]);

  const extractBrands = useCallback((productList) => {
    const brandSet = new Set();
    productList.forEach((p) => {
      if (p.brand) brandSet.add(p.brand);
    });
    setBrands(Array.from(brandSet).sort());
  }, []);

  const applyFilters = useCallback((productList) => {
    let filtered = [...productList];
    if (selectedPriceBracket) {
      const bracket = PRICE_BRACKETS.find((b) => b.value === selectedPriceBracket);
      if (bracket) {
        filtered = filtered.filter((p) => {
          const price = p.price || 0;
          return price >= bracket.min && price < bracket.max;
        });
      }
    }
    if (selectedRating) {
      filtered = filtered.filter((p) => (p.rating || 0) >= selectedRating);
    }
    if (selectedBrand) {
      filtered = filtered.filter((p) => p.brand === selectedBrand);
    }
    return filtered;
  }, [selectedPriceBracket, selectedRating, selectedBrand]);

  const clearFilters = () => {
    setSelectedPriceBracket(null);
    setSelectedRating(null);
    setSelectedBrand(null);
  };

  const hasActiveFilters = selectedPriceBracket || selectedRating || selectedBrand;

  const renderProduct = ({ item, index }) => (
    <View style={{ width: productItemWidth, marginBottom: SIZES.sm }}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
      />
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, showFilterModal && styles.filterChipActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={14} color={hasActiveFilters ? COLORS.white : COLORS.textPrimary} />
          <Text style={[styles.filterChipText, hasActiveFilters && styles.filterChipTextActive]}>Filters</Text>
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
        {PRICE_BRACKETS.slice(0, 3).map((bracket) => (
          <TouchableOpacity
            key={bracket.value}
            style={[styles.filterChip, selectedPriceBracket === bracket.value && styles.filterChipActive]}
            onPress={() => setSelectedPriceBracket(selectedPriceBracket === bracket.value ? null : bracket.value)}
          >
            <Text style={[styles.filterChipText, selectedPriceBracket === bracket.value && styles.filterChipTextActive]}>
              {bracket.label}
            </Text>
          </TouchableOpacity>
        ))}
        {RATING_FILTERS.slice(0, 2).map((rf) => (
          <TouchableOpacity
            key={rf.value}
            style={[styles.filterChip, selectedRating === rf.value && styles.filterChipActive]}
            onPress={() => setSelectedRating(selectedRating === rf.value ? null : rf.value)}
          >
            <Text style={[styles.filterChipText, selectedRating === rf.value && styles.filterChipTextActive]}>
              {rf.label}
            </Text>
          </TouchableOpacity>
        ))}
        {brands.slice(0, 4).map((brand) => (
          <TouchableOpacity
            key={brand}
            style={[styles.filterChip, selectedBrand === brand && styles.filterChipActive]}
            onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
          >
            <Text style={[styles.filterChipText, selectedBrand === brand && styles.filterChipTextActive]}>
              {brand}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilterModal = () => (
    <Modal visible={showFilterModal} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFilterModal(false)} activeOpacity={1}>
        <View style={styles.filterModal}>
          <View style={styles.modalHandle} />
          <View style={styles.filterModalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalContent}>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.filterOptionsGrid}>
              {PRICE_BRACKETS.map((bracket) => (
                <TouchableOpacity
                  key={bracket.value}
                  style={[styles.filterOption, selectedPriceBracket === bracket.value && styles.filterOptionActive]}
                  onPress={() => setSelectedPriceBracket(selectedPriceBracket === bracket.value ? null : bracket.value)}
                >
                  <Text style={[styles.filterOptionText, selectedPriceBracket === bracket.value && styles.filterOptionTextActive]}>
                    {bracket.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Rating</Text>
            <View style={styles.filterOptionsGrid}>
              {RATING_FILTERS.map((rf) => (
                <TouchableOpacity
                  key={rf.value}
                  style={[styles.filterOption, selectedRating === rf.value && styles.filterOptionActive]}
                  onPress={() => setSelectedRating(selectedRating === rf.value ? null : rf.value)}
                >
                  <Text style={[styles.filterOptionText, selectedRating === rf.value && styles.filterOptionTextActive]}>
                    {rf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {brands.length > 0 && (
              <>
                <Text style={styles.filterSectionTitle}>Brand</Text>
                <View style={styles.filterOptionsGrid}>
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.filterOption, selectedBrand === brand && styles.filterOptionActive]}
                      onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    >
                      <Text style={[styles.filterOptionText, selectedBrand === brand && styles.filterOptionTextActive]}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.applyFiltersBtn} onPress={() => setShowFilterModal(false)}>
            <Text style={styles.applyFiltersText}>SHOW RESULTS</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
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

  const filteredProducts = applyFilters(products);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      {!loading && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>{filteredProducts.length} Products</Text>
          <TouchableOpacity onPress={() => setShowSortModal(true)}>
            <Text style={styles.sortText}>Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</Text>
          </TouchableOpacity>
        </View>
      )}
      {renderFilterBar()}
      {loading ? (
        <View style={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={{ width: productItemWidth, marginBottom: SIZES.sm }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="bag-outline"
          title="No Products Found"
          message={hasActiveFilters ? "No products match your filters. Try adjusting your criteria." : "We couldn't find any products matching your criteria"}
          buttonText={hasActiveFilters ? "Clear Filters" : "Go Home"}
          onButtonPress={hasActiveFilters ? clearFilters : () => navigation.navigate('HomeTab')}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item._id || item.id)}
          numColumns={2}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.secondary]}
              tintColor={COLORS.secondary}
            />
          }
        />
      )}
      {renderSortModal()}
      {renderFilterModal()}
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
  filterBarContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBar: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: SIZES.font.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.secondary,
  },
  filterBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  productGrid: { padding: SIZES.sm },
  row: { justifyContent: 'space-between', paddingHorizontal: 2 },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: SIZES.sm },
  footerLoader: { paddingVertical: SIZES.xl },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sortModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding, paddingBottom: 40, paddingTop: SIZES.sm,
  },
  filterModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
    paddingTop: SIZES.sm,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  filterModalContent: { flex: 1 },
  clearFiltersText: {
    fontSize: SIZES.font.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  filterSectionTitle: {
    fontSize: SIZES.font.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  filterOption: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterOptionActive: {
    backgroundColor: COLORS.secondary + '15',
    borderColor: COLORS.secondary,
  },
  filterOptionText: {
    fontSize: SIZES.font.sm,
    color: COLORS.textPrimary,
  },
  filterOptionTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  applyFiltersBtn: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.lg,
    ...SHADOWS.medium,
  },
  applyFiltersText: {
    color: COLORS.secondary,
    fontSize: SIZES.font.md,
    fontWeight: '800',
    letterSpacing: 1,
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
