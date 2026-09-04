import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim }}>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>Thank you for shopping with LUXE</Text>

          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>#{orderId?.slice(-8) || 'LX000001'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Estimated Delivery</Text>
              <Text style={styles.orderValue}>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Payment</Text>
              <Text style={styles.orderValue}>Cash on Delivery</Text>
            </View>
          </View>

          <Text style={styles.confirmationText}>
            A confirmation email has been sent to your registered email address.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.replace('OrderTracking', { orderId })}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SIZES.xxxl },
  checkCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.xxl,
  },
  title: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginTop: SIZES.xl },
  subtitle: { fontSize: SIZES.font.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm },
  orderCard: {
    width: '100%', backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.lg, marginTop: SIZES.xl, ...SHADOWS.medium,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SIZES.sm },
  orderLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  orderValue: { fontSize: SIZES.font.sm, color: COLORS.textPrimary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border },
  confirmationText: {
    fontSize: SIZES.font.sm, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SIZES.xl, lineHeight: 20,
  },
  actions: { width: '100%', marginTop: SIZES.xxl },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, height: 50, borderRadius: SIZES.radius,
    gap: SIZES.sm, marginBottom: SIZES.md,
  },
  trackBtnText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '700', letterSpacing: 0.5 },
  continueBtn: {
    height: 50, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  continueBtnText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '700' },
});

export default OrderConfirmationScreen;
