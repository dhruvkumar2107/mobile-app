import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import { getDiscountPercent } from '../utils/helpers';

const OfferBadge = ({ mrp, price, style }) => {
  const discount = getDiscountPercent(mrp, price);
  if (discount <= 0) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{discount}% OFF</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.white,
    fontSize: SIZES.font.xs,
    fontWeight: '800',
  },
});

export default OfferBadge;
