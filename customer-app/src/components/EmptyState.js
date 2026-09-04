import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

const EmptyState = ({ icon = 'cart-outline', title, message, buttonText, onButtonPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={COLORS.secondary} />
      </View>
      <Text style={styles.title}>{title || 'Nothing here yet'}</Text>
      <Text style={styles.message}>{message || 'Start exploring and add items you love'}</Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xxxl,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: SIZES.font.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  message: {
    fontSize: SIZES.font.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xxl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: SIZES.font.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default EmptyState;
