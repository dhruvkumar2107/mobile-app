import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions,
  Image, FlatList, ActivityIndicator, StatusBar, Animated, Share, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { productsAPI, wishlistAPI, reviewsAPI, variantsAPI } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Price from '../components/Price';
import Rating from '../components/Rating';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import { formatPrice, getDiscountPercent, getImageUrl } from '../utils/helpers';

const VariantSelector = ({ variants, selectedVariant, onSelect, productId, navigation, onToast }) => {
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [notifyLoading, setNotifyLoading] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const attrMap = {};
    variants.forEach((v) => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, value]) => {
          if (!attrMap[key]) attrMap[key] = new Set();
          attrMap[key].add(typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
      }
    });

    const attrs = Object.entries(attrMap).map(([key, values]) => ({
      name: key,
      values: Array.from(values).map((v) => {
        try { return JSON.parse(v); } catch { return v; }
      }),
    }));
    setAttributes(attrs);

    const defaults = {};
    attrs.forEach((attr) => {
      if (attr.values.length > 0) defaults[attr.name] = attr.values[0];
    });
    setSelectedAttributes(defaults);
  }, [variants]);

  const findMatchingVariant = useCallback((attrs) => {
    if (!variants || variants.length === 0) return null;
    return variants.find((v) => {
      if (!v.attributes) return false;
      return Object.entries(attrs).every(([key, value]) => {
        const vAttr = v.attributes[key];
        if (vAttr === undefined) return false;
        const vStr = typeof vAttr === 'object' ? JSON.stringify(vAttr) : String(vAttr);
        const selStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return vStr === selStr;
      });
    });
  }, [variants]);

  useEffect(() => {
    const match = findMatchingVariant(selectedAttributes);
    if (match) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      onSelect(match);
    }
  }, [selectedAttributes, variants]);

  const handleAttributeSelect = (attrName, value) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }));
  };

  const handleNotify = async (variant) => {
    try {
      setNotifyLoading(variant._id || variant.id);
      await variantsAPI.notifyWhenAvailable(variant._id || variant.id);
      if (onToast) onToast({ visible: true, message: "You'll be notified when available!", type: 'success' });
    } catch {
      if (onToast) onToast({ visible: true, message: 'Failed to set notification', type: 'error' });
    } finally {
      setNotifyLoading(null);
    }
  };

  const currentVariant = findMatchingVariant(selectedAttributes);

  const isColorAttribute = (name) => {
    const colorNames = ['color', 'colour', 'shade', 'tone'];
    return colorNames.some((c) => name.toLowerCase().includes(c));
  };

  const getHexForColor = (value) => {
    const colorMap = {
      black: '#000000', white: '#FFFFFF', red: '#DC2626', blue: '#3B82F6',
      green: '#059669', yellow: '#EAB308', orange: '#F97316', purple: '#8B5CF6',
      pink: '#EC4899', grey: '#6B7280', gray: '#6B7280', silver: '#C0C0C0',
      gold: '#C9A961', rose: '#F43F5E', navy: '#1E3A5F', brown: '#92400E',
      beige: '#D4C5A9', cream: '#FFFDD0', coral: '#FF6F61', teal: '#14B8A6',
      maroon: '#7F1D1D',
    };
    const lower = String(value).toLowerCase();
    if (lower.startsWith('#')) return lower;
    return colorMap[lower] || '#9CA3AF';
  };

  if (!variants || variants.length === 0 || attributes.length === 0) return null;

  const isCurrentVariantAvailable = currentVariant && (currentVariant.stock > 0 || currentVariant.inStock !== false);

  return (
    <View style={variantStyles.container}>
      <View style={variantStyles.headerRow}>
        <Text style={variantStyles.sectionTitle}>Select Variant</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('VariantCompare', {
            variantIds: variants.slice(0, 3).map((v) => v._id || v.id),
            productId,
          })}
        >
          <Text style={variantStyles.compareText}>Compare</Text>
        </TouchableOpacity>
      </View>

      {attributes.map((attr) => (
        <View key={attr.name} style={variantStyles.attributeSection}>
          <Text style={variantStyles.attributeLabel}>
            {attr.name}: <Text style={variantStyles.attributeSelected}>{String(selectedAttributes[attr.name])}</Text>
          </Text>
          <View style={variantStyles.attributeOptions}>
            {attr.values.map((value, idx) => {
              const isSelected = String(selectedAttributes[attr.name]) === String(value);
              const testAttrs = { ...selectedAttributes, [attr.name]: value };
              const matchingVariant = findMatchingVariant(testAttrs);
              const isAvailable = matchingVariant && (matchingVariant.stock > 0 || matchingVariant.inStock !== false);

              if (isColorAttribute(attr.name)) {
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      variantStyles.colorSwatch,
                      isSelected && variantStyles.colorSwatchActive,
                      !isAvailable && variantStyles.colorSwatchUnavailable,
                    ]}
                    onPress={() => handleAttributeSelect(attr.name, value)}
                    activeOpacity={0.7}
                  >
                    <View style={[variantStyles.colorInner, { backgroundColor: getHexForColor(value) }]} />
                    {isSelected && <Ionicons name="checkmark" size={12} color={COLORS.white} style={variantStyles.colorCheck} />}
                    {!isAvailable && <View style={variantStyles.oosOverlay} />}
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    variantStyles.pillBtn,
                    isSelected && variantStyles.pillBtnActive,
                    !isAvailable && variantStyles.pillBtnUnavailable,
                  ]}
                  onPress={() => handleAttributeSelect(attr.name, value)}
                  activeOpacity={0.7}
                >
                  <Text style={[variantStyles.pillText, isSelected && variantStyles.pillTextActive, !isAvailable && variantStyles.pillTextUnavailable]}>
                    {String(value)}
                  </Text>
                  {!isAvailable && (
                    <View style={variantStyles.oosBadge}>
                      <Text style={variantStyles.oosBadgeText}>OOS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {currentVariant && !isCurrentVariantAvailable && (
        <View style={variantStyles.unavailableBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
          <Text style={variantStyles.unavailableText}>This variant is currently out of stock</Text>
          <TouchableOpacity
            style={variantStyles.notifyBtn}
            onPress={() => handleNotify(currentVariant)}
            disabled={notifyLoading === (currentVariant._id || currentVariant.id)}
          >
            {notifyLoading === (currentVariant._id || currentVariant.id) ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={variantStyles.notifyBtnText}>Notify Me</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {currentVariant && isCurrentVariantAvailable && (
        <View style={variantStyles.stockInfo}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={variantStyles.stockText}>In Stock{currentVariant.stock ? ` (${currentVariant.stock} available)` : ''}</Text>
        </View>
      )}

      <Animated.View style={{ opacity: fadeAnim }}>
        {currentVariant && currentVariant.images && currentVariant.images.length > 0 && (
          <TouchableOpacity
            style={variantStyles.viewImagesBtn}
            onPress={() => {
              if (navigation) {
                navigation.setParams({ variantImages: currentVariant.images });
              }
            }}
          >
            <Ionicons name="images-outline" size={16} color={COLORS.secondary} />
            <Text style={variantStyles.viewImagesText}>View variant images ({currentVariant.images.length})</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const variantStyles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.font.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  compareText: {
    fontSize: SIZES.font.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  attributeSection: {
    marginBottom: SIZES.md,
  },
  attributeLabel: {
    fontSize: SIZES.font.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  attributeSelected: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  attributeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorSwatchActive: {
    borderColor: COLORS.secondary,
    borderWidth: 3,
  },
  colorSwatchUnavailable: {
    opacity: 0.5,
  },
  colorInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorCheck: {
    position: 'absolute',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 18,
  },
  pillBtn: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillBtnActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '10',
  },
  pillBtnUnavailable: {
    opacity: 0.6,
  },
  pillText: {
    fontSize: SIZES.font.sm,
    color: COLORS.textPrimary,
  },
  pillTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  pillTextUnavailable: {
    color: COLORS.gray400,
  },
  oosBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  oosBadgeText: {
    fontSize: 8,
    color: COLORS.error,
    fontWeight: '700',
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '08',
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    gap: SIZES.sm,
    marginTop: SIZES.sm,
  },
  unavailableText: {
    flex: 1,
    fontSize: SIZES.font.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  notifyBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs + 2,
    borderRadius: SIZES.radiusSm,
  },
  notifyBtnText: {
    color: COLORS.white,
    fontSize: SIZES.font.sm,
    fontWeight: '700',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SIZES.sm,
  },
  stockText: {
    fontSize: SIZES.font.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  viewImagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SIZES.sm,
  },
  viewImagesText: {
    fontSize: SIZES.font.sm,
    color: COLORS.secondary,
    fontWeight: '500',
  },
});

const ProductDetailScreen = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const scrollY = useRef(new Animated.Value(0)).current;
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const MAX_QUANTITY = 10;

  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => { fetchProduct(); }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const [prodRes, reviewsRes, relatedRes, variantsRes] = await Promise.allSettled([
        productsAPI.getById(productId),
        reviewsAPI.getProductReviews(productId),
        productsAPI.getRelated(productId),
        variantsAPI.getByProduct(productId),
      ]);
      if (prodRes.status === 'fulfilled') {
        const data = prodRes.value?.data || prodRes.value;
        setProduct(data);
        setIsWishlisted(data.isWishlisted || false);
      }
      if (reviewsRes.status === 'fulfilled') {
        const revData = reviewsRes.value?.data || reviewsRes.value || [];
        setReviews(Array.isArray(revData) ? revData : (revData.reviews || []));
      }
      if (relatedRes.status === 'fulfilled') {
        const relData = relatedRes.value?.data || relatedRes.value || [];
        setRelatedProducts(Array.isArray(relData) ? relData : (relData.items || relData.products || []));
      }
      if (variantsRes.status === 'fulfilled') {
        const varData = variantsRes.value?.data || variantsRes.value || [];
        setVariants(Array.isArray(varData) ? varData : (varData.variants || []));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEffectivePrice = () => {
    if (selectedVariant) {
      return selectedVariant.effectivePrice || selectedVariant.price || product?.price || 0;
    }
    return product?.price || 0;
  };

  const getEffectiveMrp = () => {
    if (selectedVariant) {
      return selectedVariant.mrp || product?.mrp || 0;
    }
    return product?.mrp || 0;
  };

  const getEffectiveImages = () => {
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    return product?.images && product?.images.length > 0 ? product.images : [product?.image];
  };

  const getEffectiveStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock ?? null;
    }
    return null;
  };

  const isCurrentVariantOutOfStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock !== undefined && selectedVariant.stock <= 0;
    }
    return false;
  };

  const getEffectiveSpecs = () => {
    if (selectedVariant && selectedVariant.specifications) {
      return selectedVariant.specifications;
    }
    return product?.specifications;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigation.navigate('Auth'); return; }
    if (isCurrentVariantOutOfStock()) {
      setToast({ visible: true, message: 'Selected variant is out of stock', type: 'error' });
      return;
    }
    setAddingToCart(true);
    const payload = selectedVariant
      ? { productId: product._id || product.id, variantId: selectedVariant._id || selectedVariant.id, quantity }
      : { productId: product._id || product.id, quantity };
    const result = await addToCart(payload.productId || payload, quantity);
    setAddingToCart(false);
    if (result.success) {
      setToast({ visible: true, message: 'Added to cart', type: 'success' });
    } else {
      setToast({ visible: true, message: result.message || 'Failed to add to cart', type: 'error' });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigation.navigate('Cart');
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) { navigation.navigate('Auth'); return; }
    setIsWishlisted(!isWishlisted);
    try {
      if (isWishlisted) await wishlistAPI.remove(productId);
      else await wishlistAPI.add(productId);
    } catch (error) {
      setIsWishlisted(isWishlisted);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `Check out this product on LUXE: ${product.name} - ${formatPrice(getEffectivePrice())}`,
    });
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  const effectivePrice = getEffectivePrice();
  const effectiveMrp = getEffectiveMrp();
  const images = getEffectiveImages();
  const discount = getDiscountPercent(effectiveMrp, effectivePrice);
  const effectiveSpecs = getEffectiveSpecs();

  const getStarDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (dist[star] !== undefined) dist[star]++;
    });
    return dist;
  };

  const starDist = getStarDistribution();
  const totalReviews = reviews.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={[styles.imageGallery, { width, height: width * 0.9 }]}>
          <FlatList
            horizontal
            pagingEnabled
            data={images}
            renderItem={({ item }) => (
              <Image source={{ uri: getImageUrl(item) }} style={[styles.mainImage, { width, height: width * 0.9 }]} resizeMode="cover" />
            )}
            keyExtractor={(item, index) => `img-${index}`}
            onMomentumScrollEnd={(e) => setSelectedImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            showsHorizontalScrollIndicator={false}
          />
          {images.length > 1 && (
            <View style={styles.imageIndicator}>
              {images.map((_, index) => (
                <View key={index} style={[styles.indicatorDot, selectedImage === index && styles.activeIndicator]} />
              ))}
            </View>
          )}
          <View style={styles.floatingButtons}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.floatRight}>
              <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatBtn} onPress={toggleWishlist}>
                <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? COLORS.error : COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {images.length > 1 && (
          <View style={styles.thumbnailStrip}>
            {images.slice(0, 5).map((img, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.thumbnail, selectedImage === index && styles.activeThumbnail]}
                onPress={() => setSelectedImage(index)}
              >
                <Image source={{ uri: getImageUrl(img) }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.content}>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Rating rating={product.rating || 0} count={product.numReviews || 0} />
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <Price price={effectivePrice} mrp={effectiveMrp} size="lg" />
            <Text style={styles.inclusiveText}>Inclusive of all taxes</Text>
            {discount > 0 && (
              <View style={styles.savingsRow}>
                <Ionicons name="pricetag" size={14} color={COLORS.success} />
                <Text style={styles.savingsText}>You save {formatPrice(effectiveMrp - effectivePrice)} ({discount}% off)</Text>
              </View>
            )}
            {selectedVariant && selectedVariant.effectivePrice && selectedVariant.effectivePrice !== product.price && (
              <View style={styles.priceNote}>
                <Text style={styles.priceNoteText}>Variant price differs from base price ({formatPrice(product.price)})</Text>
              </View>
            )}
          </View>

          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedVariant={selectedVariant}
              onSelect={handleVariantSelect}
              productId={productId}
              navigation={navigation}
              onToast={setToast}
            />
          )}

          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantLabel}>Size</Text>
              <View style={styles.variantOptions}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.variantBtn, selectedSize === size && styles.variantBtnActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.variantText, selectedSize === size && styles.variantTextActive]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {product.colors && product.colors.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantLabel}>Color</Text>
              <View style={styles.variantOptions}>
                {product.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorBtn, selectedColor === color && styles.colorBtnActive]}
                    onPress={() => setSelectedColor(color)}
                  >
                    <Text style={[styles.variantText, selectedColor === color && styles.variantTextActive]}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.quantitySection}>
            <Text style={styles.variantLabel}>Quantity</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.min(MAX_QUANTITY, quantity + 1))} disabled={quantity >= MAX_QUANTITY}>
                <Ionicons name="add" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {getEffectiveStock() !== null && getEffectiveStock() !== undefined && (
            <View style={styles.stockBadgeContainer}>
              <View style={[styles.stockBadge, getEffectiveStock() > 0 ? styles.stockBadgeIn : styles.stockBadgeOut]}>
                <Text style={[styles.stockBadgeText, getEffectiveStock() > 0 ? styles.stockBadgeTextIn : styles.stockBadgeTextOut]}>
                  {getEffectiveStock() > 0 ? `In Stock (${getEffectiveStock()})` : 'Out of Stock'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.tabs}>
            {['description', 'specifications', 'reviews'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'description' && (
            <View style={styles.tabContent}>
              <Text style={styles.descriptionText}>{product.description || 'No description available.'}</Text>
            </View>
          )}

          {activeTab === 'specifications' && (
            <View style={styles.tabContent}>
              {effectiveSpecs ? (
                Object.entries(effectiveSpecs).map(([key, value], index) => (
                  <View key={key} style={[styles.specRow, index % 2 === 0 && styles.specRowAlt]}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{String(value)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.descriptionText}>No specifications available.</Text>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
                <TouchableOpacity onPress={() => {
                  if (!isAuthenticated) { navigation.navigate('Auth'); return; }
                  navigation.navigate('Review', { productId });
                }}>
                  <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
              </View>

              {totalReviews > 0 && (
                <View style={styles.starDistribution}>
                  <View style={styles.avgRatingBlock}>
                    <Text style={styles.avgRatingNumber}>{Number(product.rating || 0).toFixed(1)}</Text>
                    <Rating rating={product.rating || 0} showText={false} size={14} />
                    <Text style={styles.totalReviewsText}>{totalReviews} reviews</Text>
                  </View>
                  <View style={styles.starBars}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <View key={star} style={styles.starBarRow}>
                        <Text style={styles.starBarLabel}>{star}</Text>
                        <Ionicons name="star" size={12} color={COLORS.secondary} />
                        <View style={styles.starBarTrack}>
                          <View style={[styles.starBarFill, { width: totalReviews > 0 ? `${(starDist[star] / totalReviews) * 100}%` : '0%' }]} />
                        </View>
                        <Text style={styles.starBarCount}>{starDist[star]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {reviews.length === 0 ? (
                <Text style={styles.descriptionText}>No reviews yet. Be the first to review!</Text>
              ) : (
                reviews.map((review) => (
                  <View key={review._id || review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Text style={styles.avatarInitial}>{(review.userName || review.user?.name || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>{review.userName || review.user?.name || 'Anonymous'}</Text>
                          <Rating rating={review.rating} showText={false} size={12} />
                        </View>
                      </View>
                    </View>
                    {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                    <Text style={styles.reviewComment}>{review.body || review.comment || review.review}</Text>
                    <Text style={styles.reviewDate}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : ''}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>You May Also Like</Text>
              <FlatList
                horizontal
                data={relatedProducts}
                renderItem={({ item }) => (
                  <View style={styles.relatedItem}>
                    <ProductCard
                      product={item}
                      onPress={() => navigation.push('ProductDetail', { productId: item._id || item.id })}
                    />
                  </View>
                )}
                keyExtractor={(item) => `rel-${item._id || item.id}`}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow} activeOpacity={0.8}>
          <Text style={styles.buyNowText}>BUY NOW</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addToCartBtn, (addingToCart || isCurrentVariantOutOfStock()) && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart || isCurrentVariantOutOfStock()}
          activeOpacity={0.8}
        >
          {addingToCart ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : isCurrentVariantOutOfStock() ? (
            <Text style={styles.addToCartText}>OUT OF STOCK</Text>
          ) : (
            <Text style={styles.addToCartText}>ADD TO BAG</Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  imageGallery: { backgroundColor: COLORS.gray100 },
  mainImage: {},
  imageIndicator: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 16, left: 0, right: 0 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', marginHorizontal: 3 },
  activeIndicator: { backgroundColor: COLORS.secondary, width: 18 },
  floatingButtons: { position: 'absolute', top: Platform.OS === 'ios' ? 48 : 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIZES.md },
  floatRight: { flexDirection: 'row', gap: SIZES.sm },
  floatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
  thumbnailStrip: { flexDirection: 'row', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, gap: SIZES.sm, backgroundColor: COLORS.surface },
  thumbnail: { width: 48, height: 48, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden' },
  activeThumbnail: { borderColor: COLORS.secondary },
  thumbnailImage: { width: '100%', height: '100%' },
  content: { padding: SIZES.padding, backgroundColor: COLORS.surface },
  brand: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productName: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4, lineHeight: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm, gap: SIZES.md },
  discountBadge: { backgroundColor: COLORS.error + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  discountText: { color: COLORS.error, fontSize: SIZES.font.sm, fontWeight: '700' },
  priceSection: { marginTop: SIZES.lg, paddingBottom: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  inclusiveText: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 4 },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.sm },
  savingsText: { fontSize: SIZES.font.sm, color: COLORS.success, fontWeight: '600' },
  priceNote: { marginTop: SIZES.sm },
  priceNoteText: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, fontStyle: 'italic' },
  variantSection: { paddingVertical: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  variantLabel: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  variantBtn: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  variantBtnActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary + '10' },
  variantText: { fontSize: SIZES.font.sm, color: COLORS.textPrimary },
  variantTextActive: { color: COLORS.secondary, fontWeight: '700' },
  colorBtn: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border },
  colorBtnActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary + '10' },
  quantitySection: { paddingVertical: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: SIZES.lg, marginTop: SIZES.sm },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  stockBadgeContainer: { paddingVertical: SIZES.sm },
  stockBadge: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusSm, alignSelf: 'flex-start' },
  stockBadgeIn: { backgroundColor: COLORS.success + '15' },
  stockBadgeOut: { backgroundColor: COLORS.error + '15' },
  stockBadgeText: { fontSize: SIZES.font.sm, fontWeight: '600' },
  stockBadgeTextIn: { color: COLORS.success },
  stockBadgeTextOut: { color: COLORS.error },
  tabs: { flexDirection: 'row', marginTop: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SIZES.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.secondary },
  tabText: { fontSize: SIZES.font.md, color: COLORS.textSecondary, fontWeight: '500' },
  activeTabText: { color: COLORS.secondary, fontWeight: '700' },
  tabContent: { paddingVertical: SIZES.lg },
  descriptionText: { fontSize: SIZES.font.md, color: COLORS.textSecondary, lineHeight: 24 },
  specRow: { flexDirection: 'row', paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  specRowAlt: { backgroundColor: COLORS.gray50 },
  specKey: { width: 120, fontSize: SIZES.font.md, color: COLORS.textSecondary, fontWeight: '500' },
  specValue: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  reviewsSectionTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  writeReviewText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  starDistribution: { flexDirection: 'row', marginBottom: SIZES.lg, gap: SIZES.lg },
  avgRatingBlock: { alignItems: 'center', gap: 4 },
  avgRatingNumber: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary },
  totalReviewsText: { fontSize: SIZES.font.xs, color: COLORS.textSecondary },
  starBars: { flex: 1, gap: 4 },
  starBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starBarLabel: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, width: 12, textAlign: 'right' },
  starBarTrack: { flex: 1, height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, overflow: 'hidden' },
  starBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
  starBarCount: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, width: 20, textAlign: 'right' },
  reviewCard: { paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xs },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: COLORS.secondary, fontSize: SIZES.font.sm, fontWeight: '700' },
  reviewerName: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  reviewTitle: { fontSize: SIZES.font.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  reviewComment: { fontSize: SIZES.font.md, color: COLORS.textSecondary, lineHeight: 22 },
  reviewDate: { fontSize: SIZES.font.xs, color: COLORS.gray400, marginTop: SIZES.xs },
  relatedSection: { marginTop: SIZES.xl, paddingTop: SIZES.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  relatedTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  relatedItem: { width: 160, marginRight: SIZES.md },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    backgroundColor: COLORS.surface, paddingHorizontal: SIZES.padding, paddingVertical: SIZES.md,
    paddingBottom: 30, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SIZES.sm,
    ...SHADOWS.medium,
  },
  buyNowBtn: {
    flex: 1, height: 48, borderRadius: SIZES.radiusMd, borderWidth: 2, borderColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  buyNowText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
  addToCartBtn: {
    flex: 1, height: 48, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  addToCartText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
});

export default ProductDetailScreen;
