import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { getImageUrl } from '../utils/helpers';

const Banner = ({ banners, onBannerPress }) => {
  const { width } = useWindowDimensions();
  const BANNER_WIDTH = width - 32;
  const BANNER_HEIGHT = 200;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToOffset({ offset: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [banners?.length]);

  if (!banners || banners.length === 0) {
    return (
      <View style={[styles.placeholder, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}>
        <Text style={styles.placeholderText}>LUXE</Text>
        <View style={styles.placeholderLine} />
        <Text style={styles.placeholderSubtext}>Premium Fashion & Lifestyle</Text>
      </View>
    );
  }

  const renderBanner = ({ item, index }) => {
    if (item.image) {
      return (
        <TouchableOpacity
          style={[styles.bannerItem, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}
          onPress={() => onBannerPress?.(item)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: getImageUrl(item.image) }} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerContent}>
              {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
              {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
              {item.buttonText && (
                <View style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>{item.buttonText}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const gradients = [
      { bg: COLORS.primary, accent: COLORS.secondary },
      { bg: '#1A1A2E', accent: '#E8D5B5' },
      { bg: '#0F3460', accent: COLORS.secondary },
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <TouchableOpacity
        style={[styles.bannerItem, { width: BANNER_WIDTH, height: BANNER_HEIGHT, backgroundColor: gradient.bg }]}
        onPress={() => onBannerPress?.(item)}
        activeOpacity={0.9}
      >
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
            {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
            {item.buttonText && (
              <View style={[styles.bannerButton, { backgroundColor: gradient.accent }]}>
                <Text style={styles.bannerButtonText}>{item.buttonText}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item, index) => `banner-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
          setActiveIndex(index);
        }}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
      />
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  bannerItem: {
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginRight: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,46,0.45)',
    justifyContent: 'flex-end',
  },
  bannerContent: {
    padding: SIZES.lg,
  },
  bannerTitle: {
    fontSize: SIZES.font.xxl,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: SIZES.font.md,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SIZES.sm,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  bannerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.secondary,
  },
  placeholder: {
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 8,
  },
  placeholderLine: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: SIZES.font.md,
    color: COLORS.accent,
    letterSpacing: 2,
  },
});

export default Banner;
