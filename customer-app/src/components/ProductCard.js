import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { formatPrice, getDiscountPercent, truncateText, getImageUrl } from '../utils/helpers';

const ProductCard = ({ product, onPress, onWishlistPress, isWishlisted, compact }) => {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - 48) / 2;
  const discount = getDiscountPercent(product.mrp, product.price);
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.container, { width: CARD_WIDTH }, compact && styles.compact, pressed && styles.pressed]}
      onPress={onPress}
      activeOpacity={0.8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={[styles.imageContainer, { height: CARD_WIDTH * 1.2 }]}>
        <Image source={{ uri: getImageUrl(product.images?.[0] || product.image) }} style={styles.image} resizeMode="cover" />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {product.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn} onPress={onWishlistPress} activeOpacity={0.7}>
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? COLORS.error : COLORS.gray500}
          />
        </TouchableOpacity>
        {pressed && (
          <View style={styles.quickAddOverlay}>
            <TouchableOpacity style={styles.quickAddBtn} onPress={onPress} activeOpacity={0.8}>
              <Ionicons name="bag-add-outline" size={16} color={COLORS.white} />
              <Text style={styles.quickAddText}>Quick Add</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.info}>
        {product.brand && <Text style={styles.brand}>{truncateText(product.brand, 20)}</Text>}
        <Text style={styles.name} numberOfLines={2}>{truncateText(product.name, 40)}</Text>
        {product.rating && (
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
              <Ionicons name="star" size={10} color={COLORS.white} />
            </View>
            {product.numReviews > 0 && (
              <Text style={styles.reviewCount}>({product.numReviews})</Text>
            )}
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.mrp && product.mrp > product.price && (
            <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
          )}
          {discount > 0 && (
            <Text style={styles.discountPercent}>{discount}% off</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  pressed: {
    ...SHADOWS.medium,
    transform: [{ scale: 0.98 }],
  },
  compact: {},
  imageContainer: {
    width: '100%',
    backgroundColor: COLORS.gray100,
    position: 'relative',
    borderTopLeftRadius: SIZES.radiusMd,
    borderTopRightRadius: SIZES.radiusMd,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  discountText: {
    color: COLORS.white,
    fontSize: SIZES.font.xs,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  newText: {
    color: COLORS.white,
    fontSize: SIZES.font.xs,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickAddOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SIZES.md,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    gap: 4,
  },
  quickAddText: { color: COLORS.white, fontSize: SIZES.font.sm, fontWeight: '700' },
  info: {
    padding: SIZES.sm,
  },
  brand: {
    fontSize: SIZES.font.xs,
    color: COLORS.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: SIZES.font.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  price: {
    fontSize: SIZES.font.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  mrp: {
    fontSize: SIZES.font.sm,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountPercent: {
    fontSize: SIZES.font.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default ProductCard;
