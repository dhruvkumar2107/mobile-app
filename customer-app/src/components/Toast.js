import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

const Toast = ({ visible, message, type = 'success', onDismiss }) => {
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -60, duration: 300, useNativeDriver: true }),
        ]).start(() => onDismiss?.());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const iconMap = {
    success: { name: 'checkmark-circle', color: COLORS.success, bg: COLORS.success + '15' },
    error: { name: 'close-circle', color: COLORS.error, bg: COLORS.error + '15' },
    warning: { name: 'warning', color: COLORS.warning, bg: COLORS.warning + '15' },
    info: { name: 'information-circle', color: COLORS.info, bg: COLORS.info + '15' },
  };

  const icon = iconMap[type] || iconMap.info;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }], width: width - 32 }]}>
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    zIndex: 9999,
    ...SHADOWS.medium,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: SIZES.font.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

export default Toast;
