import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { variantsAPI } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { formatPrice, getImageUrl } from '../utils/helpers';

const VariantCompareScreen = ({ route, navigation }) => {
  const { variantIds, productId } = route.params || {};
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchVariants();
  }, [variantIds]);

  const fetchVariants = async () => {
    if (!variantIds || variantIds.length === 0) {
      setError('No variants to compare');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await variantsAPI.compare(variantIds);
      const data = res?.data || res || [];
      setVariants(Array.isArray(data) ? data : (data.variants || []));
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError(err?.message || 'Failed to load variant data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variant) => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    const variantId = variant._id || variant.id;
    setAddingToCartId(variantId);
    try {
      const result = await addToCart(productId || variant.productId, 1);
      if (result.success) {
        setToast({ visible: true, message: `${variant.name || 'Variant'} added to cart`, type: 'success' });
      } else {
        setToast({ visible: true, message: result.message || 'Failed to add to cart', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Failed to add to cart', type: 'error' });
    } finally {
      setAddingToCartId(null);
    }
  };

  const getLowestPrice = () => {
    if (variants.length === 0) return 0;
    return Math.min(...variants.map((v) => v.effectivePrice || v.price || Infinity));
  };

  const getHighestPrice = () => {
    if (variants.length === 0) return 0;
    return Math.max(...variants.map((v) => v.effectivePrice || v.price || 0));
  };

  const getPriceDifference = () => {
    return getHighestPrice() - getLowestPrice();
  };

  const getAllSpecKeys = () => {
    const keys = new Set();
    variants.forEach((v) => {
      const specs = v.specifications || {};
      Object.keys(specs).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading comparison...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchVariants}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (variants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Ionicons name="file-tray-outline" size={48} color={COLORS.gray400} />
        <Text style={styles.errorText}>No variants available for comparison</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const specKeys = getAllSpecKeys();
  const priceDiff = getPriceDifference();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Variants</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {priceDiff > 0 && (
          <View style={styles.priceDiffBanner}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.priceDiffText}>
              Price difference: {formatPrice(priceDiff)} between variants
            </Text>
          </View>
        )}

        <View style={styles.compareCards}>
          {variants.map((variant, index) => {
            const variantId = variant._id || variant.id;
            const price = variant.effectivePrice || variant.price || 0;
            const mrp = variant.mrp || 0;
            const isLowestPrice = price === getLowestPrice() && priceDiff > 0;
            const isOutOfStock = variant.stock !== undefined && variant.stock <= 0;
            const isAdding = addingToCartId === variantId;

            return (
              <View key={variantId || index} style={styles.variantCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.variantName} numberOfLines={2}>
                    {variant.name || `Variant ${index + 1}`}
                  </Text>
                  {isLowestPrice && (
                    <View style={styles.bestPriceBadge}>
                      <Text style={styles.bestPriceText}>BEST PRICE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: getImageUrl(variant.images?.[0] || variant.image) }}
                    style={styles.variantImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.variantPrice}>{formatPrice(price)}</Text>
                  {mrp > price && (
                    <Text style={styles.variantMrp}>{formatPrice(mrp)}</Text>
                  )}
                </View>

                <View style={styles.stockRow}>
                  <View style={[styles.stockDot, isOutOfStock ? styles.stockDotOut : styles.stockDotIn]} />
                  <Text style={[styles.stockLabel, isOutOfStock ? styles.stockLabelOut : styles.stockLabelIn]}>
                    {isOutOfStock ? 'Out of Stock' : variant.stock ? `${variant.stock} in stock` : 'In Stock'}
                  </Text>
                </View>

                {variant.attributes && (
                  <View style={styles.attributesSection}>
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <View key={key} style={styles.attrRow}>
                        <Text style={styles.attrKey}>{key}</Text>
                        <Text style={styles.attrValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {variant.specifications && Object.keys(variant.specifications).length > 0 && (
                  <View style={styles.specsSection}>
                    <Text style={styles.specsTitle}>Specifications</Text>
                    {Object.entries(variant.specifications).map(([key, value]) => (
                      <View key={key} style={styles.specRow}>
                        <Text style={styles.specKey}>{key}</Text>
                        <Text style={styles.specValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.addCartBtn, (isOutOfStock || isAdding) && styles.addCartBtnDisabled]}
                  onPress={() => handleAddToCart(variant)}
                  disabled={isOutOfStock || isAdding}
                  activeOpacity={0.8}
                >
                  {isAdding ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : isOutOfStock ? (
                    <Text style={styles.addCartBtnText}>Out of Stock</Text>
                  ) : (
                    <>
                      <Ionicons name="bag-add-outline" size={16} color={COLORS.white} />
                      <Text style={styles.addCartBtnText}>Add to Cart</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {specKeys.length > 0 && (
          <View style={styles.comparisonTable}>
            <Text style={styles.tableTitle}>Full Specification Comparison</Text>
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderCellName}>
                <Text style={styles.tableHeaderText}>Specification</Text>
              </View>
              {variants.map((variant, index) => (
                <View key={variant._id || variant.id || index} style={styles.tableHeaderCell}>
                  <Text style={styles.tableHeaderText} numberOfLines={1}>
                    {variant.name || `V${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCellName}>
                <Text style={styles.tableCellTextName}>Price</Text>
              </View>
              {variants.map((variant, index) => (
                <View key={variant._id || variant.id || index} style={styles.tableCell}>
                  <Text style={styles.tableCellText}>
                    {formatPrice(variant.effectivePrice || variant.price || 0)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCellName}>
                <Text style={styles.tableCellTextName}>Stock</Text>
              </View>
              {variants.map((variant, index) => (
                <View key={variant._id || variant.id || index} style={styles.tableCell}>
                  <Text style={[styles.tableCellText, variant.stock <= 0 && { color: COLORS.error }]}>
                    {variant.stock !== undefined ? variant.stock : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>

            {specKeys.map((key, idx) => (
              <View key={key} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <View style={styles.tableCellName}>
                  <Text style={styles.tableCellTextName}>{key}</Text>
                </View>
                {variants.map((variant, index) => {
                  const specs = variant.specifications || {};
                  return (
                    <View key={variant._id || variant.id || index} style={styles.tableCell}>
                      <Text style={styles.tableCellText}>
                        {specs[key] !== undefined ? String(specs[key]) : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: SIZES.sm,
  },
  loadingText: {
    fontSize: SIZES.font.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: SIZES.font.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  retryBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.md,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: SIZES.font.md,
    fontWeight: '700',
  },
  backBtn: {
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.font.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.font.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  priceDiffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '10',
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  priceDiffText: {
    flex: 1,
    fontSize: SIZES.font.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  compareCards: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  variantCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardHeader: {
    padding: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  variantName: {
    fontSize: SIZES.font.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bestPriceBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: SIZES.xs,
    alignSelf: 'flex-start',
  },
  bestPriceText: {
    fontSize: 9,
    color: COLORS.success,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.gray50,
  },
  variantImage: {
    width: '100%',
    height: '100%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
  },
  variantPrice: {
    fontSize: SIZES.font.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  variantMrp: {
    fontSize: SIZES.font.sm,
    color: COLORS.gray400,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xs,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockDotIn: {
    backgroundColor: COLORS.success,
  },
  stockDotOut: {
    backgroundColor: COLORS.error,
  },
  stockLabel: {
    fontSize: SIZES.font.xs,
    fontWeight: '600',
  },
  stockLabelIn: {
    color: COLORS.success,
  },
  stockLabelOut: {
    color: COLORS.error,
  },
  attributesSection: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  attrKey: {
    fontSize: SIZES.font.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  attrValue: {
    fontSize: SIZES.font.xs,
    color: COLORS.textPrimary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  specsSection: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
  },
  specsTitle: {
    fontSize: SIZES.font.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  specKey: {
    fontSize: SIZES.font.xs,
    color: COLORS.textSecondary,
  },
  specValue: {
    fontSize: SIZES.font.xs,
    color: COLORS.textPrimary,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    margin: SIZES.md,
    marginTop: SIZES.sm,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusSm,
  },
  addCartBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  addCartBtnText: {
    color: COLORS.white,
    fontSize: SIZES.font.sm,
    fontWeight: '700',
  },
  comparisonTable: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SIZES.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  tableTitle: {
    fontSize: SIZES.font.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    padding: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderCellName: {
    flex: 1.2,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tableHeaderCell: {
    flex: 1,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: SIZES.font.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  tableRowAlt: {
    backgroundColor: COLORS.gray50,
  },
  tableCellName: {
    flex: 1.2,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
  },
  tableCell: {
    flex: 1,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
  },
  tableCellTextName: {
    fontSize: SIZES.font.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tableCellText: {
    fontSize: SIZES.font.sm,
    color: COLORS.textPrimary,
  },
});

export default VariantCompareScreen;
