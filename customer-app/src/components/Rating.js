import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

const Rating = ({ rating, count, size = 14, onPress, showText = true }) => {
  const renderStar = (index) => {
    let iconName = 'star-outline';
    let color = COLORS.gray300;
    if (rating >= index + 1) {
      iconName = 'star';
      color = '#FFC107';
    } else if (rating >= index + 0.5) {
      iconName = 'star-half';
      color = '#FFC107';
    }
    return (
      <Ionicons key={index} name={iconName} size={size} color={color} />
    );
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
      {showText && rating > 0 && (
        <Text style={[styles.ratingText, { fontSize: size - 2 }]}>{Number(rating).toFixed(1)}</Text>
      )}
      {count !== undefined && (
        <Text style={[styles.countText, { fontSize: size - 3 }]}>({count})</Text>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    color: '#FFC107',
    fontWeight: '700',
    marginLeft: 4,
  },
  countText: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});

export default Rating;
