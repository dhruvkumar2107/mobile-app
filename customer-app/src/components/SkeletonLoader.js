import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const SkeletonLoader = ({ width, height, borderRadius = SIZES.radiusSm, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

const ProductCardSkeleton = ({ width: customWidth }) => (
  <View style={[styles.card, customWidth && { width: customWidth }]}>
    <SkeletonLoader width="100%" height={180} borderRadius={SIZES.radius} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="60%" height={12} />
      <SkeletonLoader width="90%" height={12} style={{ marginTop: 6 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginTop: 8 }} />
    </View>
  </View>
);

const CategorySkeleton = () => (
  <View style={styles.categoryItem}>
    <SkeletonLoader width={72} height={72} borderRadius={36} />
    <SkeletonLoader width={50} height={10} style={{ marginTop: 8 }} />
  </View>
);

const BannerSkeleton = () => {
  const { width } = useWindowDimensions();
  return <SkeletonLoader width={width - 32} height={180} borderRadius={SIZES.radiusLg} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.gray200,
  },
  card: {
    width: 160,
    marginRight: SIZES.md,
    marginBottom: SIZES.sm,
  },
  cardContent: {
    padding: SIZES.sm,
  },
  categoryItem: {
    alignItems: 'center',
    width: 90,
    marginRight: SIZES.md,
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: SIZES.lg,
  },
});

const ProductDetailSkeleton = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.detailContainer}>
      <SkeletonLoader width={width} height={320} borderRadius={0} />
      <View style={styles.detailContent}>
        <SkeletonLoader width="70%" height={22} />
        <SkeletonLoader width="40%" height={18} style={{ marginTop: 10 }} />
        <SkeletonLoader width="100%" height={12} style={{ marginTop: 16 }} />
        <SkeletonLoader width="100%" height={12} style={{ marginTop: 6 }} />
        <SkeletonLoader width="60%" height={12} style={{ marginTop: 6 }} />
        <SkeletonLoader width="45%" height={40} borderRadius={SIZES.radiusMd} style={{ marginTop: 20 }} />
      </View>
    </View>
  );
};

export { SkeletonLoader, ProductCardSkeleton, CategorySkeleton, BannerSkeleton, ProductDetailSkeleton };
export default SkeletonLoader;
