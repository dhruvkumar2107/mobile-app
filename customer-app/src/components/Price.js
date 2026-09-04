import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import { formatPrice, getDiscountPercent } from '../utils/helpers';

const Price = ({ price, mrp, size = 'md', showDiscount = true }) => {
  const discount = getDiscountPercent(mrp, price);
  const sizes = {
    sm: { price: SIZES.font.md, mrp: SIZES.font.sm },
    md: { price: SIZES.font.lg, mrp: SIZES.font.md },
    lg: { price: SIZES.font.xxl, mrp: SIZES.font.lg },
  };

  const s = sizes[size] || sizes.md;

  return (
    <View style={styles.container}>
      <Text style={[styles.price, { fontSize: s.price }]}>{formatPrice(price)}</Text>
      {mrp && mrp > price && (
        <Text style={[styles.mrp, { fontSize: s.mrp }]}>{formatPrice(mrp)}</Text>
      )}
      {showDiscount && discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% off</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  mrp: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.success,
    fontSize: SIZES.font.xs,
    fontWeight: '700',
  },
});

export default Price;
