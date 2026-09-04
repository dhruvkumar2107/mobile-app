import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { getImageUrl } from '../utils/helpers';

const iconMap = {
  men: 'man',
  women: 'woman',
  kids: 'child',
  electronics: 'laptop',
  shoes: 'walk',
  bags: 'bag',
  jewelry: 'diamond',
  watches: 'watch',
  accessories: 'glasses',
  beauty: 'color-palette',
  home: 'home',
  sports: 'football',
};

const CategoryCard = ({ category, onPress, horizontal }) => {
  const iconName = iconMap[category.name?.toLowerCase()] || 'grid';

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalContainer} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.horizontalImageWrap}>
          {category.image ? (
            <Image source={{ uri: getImageUrl(category.image) }} style={styles.horizontalImage} resizeMode="cover" />
          ) : (
            <View style={styles.horizontalIconWrap}>
              <Ionicons name={iconName} size={28} color={COLORS.secondary} />
            </View>
          )}
        </View>
        <Text style={styles.horizontalName} numberOfLines={2}>{category.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageWrap}>
        {category.image ? (
          <Image source={{ uri: getImageUrl(category.image) }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={32} color={COLORS.secondary} />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 90,
    marginRight: SIZES.md,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gray100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGold,
    ...SHADOWS.shadowSm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
  },
  name: {
    fontSize: SIZES.font.xs,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SIZES.xs,
    fontWeight: '500',
  },
  horizontalContainer: {
    alignItems: 'center',
    width: 80,
    marginRight: SIZES.lg,
  },
  horizontalImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalIconWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
  },
  horizontalName: {
    fontSize: SIZES.font.xs,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SIZES.xs,
    fontWeight: '500',
  },
});

export default CategoryCard;
