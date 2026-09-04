import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { couponsAPI } from '../api/client';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { formatPrice } from '../utils/helpers';

const CouponScreen = ({ navigation }) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setToast({ visible: true, message: 'Please enter a coupon code', type: 'warning' });
      return;
    }
    setValidating(true);
    try {
      const res = await couponsAPI.validate(couponCode.trim());
      const coupon = res?.data || res;
      setValidatedCoupon(coupon);
    } catch (error) {
      setToast({ visible: true, message: error.message || 'Invalid coupon code', type: 'error' });
      setValidatedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const applyCoupon = () => {
    if (!validatedCoupon) return;
    Alert.alert('Apply Coupon', `Use code "${validatedCoupon.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => {
        navigation.navigate('Cart', { appliedCoupon: validatedCoupon.code });
        setToast({ visible: true, message: `Coupon ${validatedCoupon.code} applied`, type: 'success' });
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coupons & Offers</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Have a coupon code?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.couponInput}
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Enter coupon code"
              placeholderTextColor={COLORS.gray400}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.validateBtn, validating && styles.btnDisabled]}
              onPress={validateCoupon}
              disabled={validating}
            >
              {validating ? (
                <ActivityIndicator color={COLORS.secondary} size="small" />
              ) : (
                <Text style={styles.validateBtnText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {validatedCoupon && (
          <View style={styles.couponResult}>
            <View style={styles.couponResultLeft}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <View style={styles.couponResultInfo}>
                <Text style={styles.couponResultCode}>{validatedCoupon.code}</Text>
                <Text style={styles.couponResultDesc}>
                  {validatedCoupon.type === 'percentage'
                    ? `${validatedCoupon.value || validatedCoupon.discount || validatedCoupon.discountPercent}% OFF`
                    : `${formatPrice(validatedCoupon.value || validatedCoupon.discount || validatedCoupon.discountAmount)} OFF`
                  }
                  {validatedCoupon.minOrder ? ` (Min order: ${formatPrice(validatedCoupon.minOrder)})` : ''}
                </Text>
                {validatedCoupon.maxDiscount && (
                  <Text style={styles.couponResultMax}>Max discount: {formatPrice(validatedCoupon.maxDiscount)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
              <Text style={styles.applyBtnText}>APPLY</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How to use coupons?</Text>
          <View style={styles.infoStep}>
            <View style={styles.infoStepDot}><Text style={styles.infoStepNum}>1</Text></View>
            <Text style={styles.infoStepText}>Enter your coupon code above</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepDot}><Text style={styles.infoStepNum}>2</Text></View>
            <Text style={styles.infoStepText}>Check the coupon details and validity</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepDot}><Text style={styles.infoStepNum}>3</Text></View>
            <Text style={styles.infoStepText}>Apply during checkout to get discount</Text>
          </View>
        </View>
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary },
  content: { padding: SIZES.padding },
  inputSection: { marginBottom: SIZES.xl },
  inputLabel: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  inputRow: { flexDirection: 'row', gap: SIZES.sm },
  couponInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.md, height: 48, fontSize: SIZES.font.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, letterSpacing: 1,
  },
  validateBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl, borderRadius: SIZES.radiusSm,
    justifyContent: 'center', alignItems: 'center', minWidth: 80,
  },
  btnDisabled: { opacity: 0.7 },
  validateBtnText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '700' },
  couponResult: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.success + '10', borderRadius: SIZES.radius, padding: SIZES.md,
    marginBottom: SIZES.xl, borderWidth: 1, borderColor: COLORS.success + '30',
  },
  couponResultLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SIZES.sm },
  couponResultInfo: { flex: 1 },
  couponResultCode: { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.textPrimary },
  couponResultDesc: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 2 },
  couponResultMax: { fontSize: SIZES.font.xs, color: COLORS.gray400, marginTop: 2 },
  applyBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  applyBtnText: { color: COLORS.primary, fontSize: SIZES.font.sm, fontWeight: '800' },
  infoSection: { marginTop: SIZES.lg },
  infoTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md, marginBottom: SIZES.md },
  infoStepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  infoStepNum: { color: COLORS.primary, fontSize: SIZES.font.sm, fontWeight: '700' },
  infoStepText: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textSecondary, lineHeight: 22 },
});

export default CouponScreen;
