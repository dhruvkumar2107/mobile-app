import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, Alert, Platform, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addressesAPI, ordersAPI } from '../api/client';
import { formatPrice, getImageUrl } from '../utils/helpers';
import Toast from '../components/Toast';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'phone-portrait-outline', description: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline', description: 'Visa, MasterCard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: 'business-outline', description: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline', description: 'Pay when you receive' },
];

const CheckoutScreen = ({ navigation }) => {
  const { items, getSubtotal, getMRP, getDiscount, getDelivery, getTax, getTotal, coupon, getCouponDiscount } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [orderError, setOrderError] = useState(null);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await addressesAPI.get();
      const addr = res?.data || res || [];
      const addrList = Array.isArray(addr) ? addr : (addr.addresses || []);
      setAddresses(addrList);
      const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
      setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setToast({ visible: true, message: 'Please fill all required fields', type: 'error' });
      return;
    }
    try {
      await addressesAPI.create(newAddress);
      setShowAddAddress(false);
      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
      fetchAddresses();
      setToast({ visible: true, message: 'Address added', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: error.message || 'Failed to add address', type: 'error' });
    }
  };

  const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setToast({ visible: true, message: 'Please select a delivery address', type: 'warning' });
      return;
    }
    setOrderError(null);
    setPlacing(true);
    try {
      const orderData = {
        shippingAddressId: selectedAddress._id || selectedAddress.id,
        paymentMethod: selectedPayment,
        couponCode: coupon?.code || couponCode || undefined,
      };
      const res = await ordersAPI.create(orderData);
      const orderId = res?.data?._id || res?._id;
      if (!orderId) {
        throw new Error('Invalid response from server');
      }
      navigation.replace('OrderConfirmation', { orderId, paymentMethod: selectedPayment });
    } catch (error) {
      const msg = error?.message || error?.error || 'Failed to place order';
      let userMessage = msg;
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connection')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('unavailable')) {
        userMessage = 'Some items in your cart are no longer available.';
      } else if (msg.toLowerCase().includes('payment') || msg.toLowerCase().includes('transaction')) {
        userMessage = 'Payment processing failed. Please try a different payment method.';
      } else if (msg.toLowerCase().includes('address')) {
        userMessage = 'Please check your delivery address.';
      }
      setOrderError(userMessage);
      setToast({ visible: true, message: userMessage, type: 'error' });
    } finally {
      setPlacing(false);
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              {step > s ? (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {s === 1 ? 'Address' : s === 2 ? 'Payment' : 'Confirm'}
            </Text>
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Delivery Address</Text>
      {addresses.length === 0 && !showAddAddress ? (
        <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowAddAddress(true)}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.addAddressText}>Add New Address</Text>
        </TouchableOpacity>
      ) : (
        <>
          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr._id || addr.id}
              style={[styles.addressCard, selectedAddress?._id === addr._id && styles.addressCardActive]}
              onPress={() => setSelectedAddress(addr)}
            >
              <View style={styles.addressRadio}>
                <View style={[styles.radioOuter, selectedAddress?._id === addr._id && styles.radioOuterActive]}>
                  {selectedAddress?._id === addr._id && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{addr.name || user?.name}</Text>
                <Text style={styles.addressText} numberOfLines={2}>{addr.street || addr.address}</Text>
                <Text style={styles.addressText}>{addr.city}, {addr.state} - {addr.pincode || addr.zip}</Text>
                {addr.phone && <Text style={styles.addressPhone}>Phone: {addr.phone}</Text>}
              </View>
            </TouchableOpacity>
          ))}
          {!showAddAddress && (
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowAddAddress(true)}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {showAddAddress && (
        <View style={styles.newAddressForm}>
          <Text style={styles.formTitle}>New Address</Text>
          <TextInput style={styles.input} value={newAddress.name} onChangeText={(t) => setNewAddress({ ...newAddress, name: t })} placeholder="Full Name" placeholderTextColor={COLORS.gray400} />
          <TextInput style={styles.input} value={newAddress.phone} onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })} placeholder="Phone" keyboardType="phone-pad" placeholderTextColor={COLORS.gray400} />
          <TextInput style={styles.input} value={newAddress.street} onChangeText={(t) => setNewAddress({ ...newAddress, street: t })} placeholder="Street Address" multiline placeholderTextColor={COLORS.gray400} />
          <TextInput style={styles.input} value={newAddress.city} onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} placeholder="City" placeholderTextColor={COLORS.gray400} />
          <TextInput style={styles.input} value={newAddress.state} onChangeText={(t) => setNewAddress({ ...newAddress, state: t })} placeholder="State" placeholderTextColor={COLORS.gray400} />
          <TextInput style={styles.input} value={newAddress.pincode} onChangeText={(t) => setNewAddress({ ...newAddress, pincode: t })} placeholder="Pincode" keyboardType="number-pad" placeholderTextColor={COLORS.gray400} />
          <View style={styles.formBtnRow}>
            <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setShowAddAddress(false)}>
              <Text style={styles.cancelFormText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveFormBtn} onPress={handleAddAddress}>
              <Text style={styles.saveFormText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.nextBtn} onPress={() => {
        if (!selectedAddress && addresses.length > 0) setSelectedAddress(addresses[0]);
        setStep(2);
      }}>
        <Text style={styles.nextBtnText}>CONTINUE TO PAYMENT</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment Method</Text>
      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.paymentCard, selectedPayment === method.id && styles.paymentCardActive]}
          onPress={() => setSelectedPayment(method.id)}
        >
          <View style={styles.paymentRadio}>
            <View style={[styles.radioOuter, selectedPayment === method.id && styles.radioOuterActive]}>
              {selectedPayment === method.id && <View style={styles.radioInner} />}
            </View>
          </View>
          <Ionicons name={method.icon} size={24} color={selectedPayment === method.id ? COLORS.secondary : COLORS.gray400} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>{method.label}</Text>
            <Text style={styles.paymentDesc}>{method.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
          <Text style={styles.nextBtnText}>REVIEW ORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Order Summary</Text>

      {selectedAddress && (
        <View style={styles.confirmCard}>
          <View style={styles.confirmHeader}>
            <Ionicons name="location" size={18} color={COLORS.secondary} />
            <Text style={styles.confirmLabel}>Delivery Address</Text>
          </View>
          <Text style={styles.confirmText}>{selectedAddress.name || user?.name}</Text>
          <Text style={styles.confirmText}>{selectedAddress.street || selectedAddress.address}</Text>
          <Text style={styles.confirmText}>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode || selectedAddress.zip}</Text>
        </View>
      )}

      <View style={styles.confirmCard}>
        <View style={styles.confirmHeader}>
          <Ionicons name="card" size={18} color={COLORS.secondary} />
          <Text style={styles.confirmLabel}>Payment Method</Text>
        </View>
        <Text style={styles.confirmText}>{PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}</Text>
      </View>

      <View style={styles.confirmCard}>
        <View style={styles.confirmHeader}>
          <Ionicons name="bag" size={18} color={COLORS.secondary} />
          <Text style={styles.confirmLabel}>Items ({items.length})</Text>
        </View>
        {items.map((item) => {
          const itemId = item.product?._id || item.productId || item._id || item.id;
          const itemName = item.name || item.product?.name || '';
          const itemImage = item.image || item.product?.images?.[0] || '';
          const itemPrice = item.price || item.product?.price || 0;
          return (
            <View key={itemId} style={styles.orderItem}>
              <Image source={{ uri: getImageUrl(itemImage) }} style={styles.orderItemImage} resizeMode="cover" />
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={1}>{itemName}</Text>
                <Text style={styles.orderItemQty}>Qty: {item.quantity || 1}</Text>
              </View>
              <Text style={styles.orderItemPrice}>{formatPrice(itemPrice * (item.quantity || 1))}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.deliveryEstimateCard}>
        <View style={styles.deliveryEstimateRow}>
          <Ionicons name="car-outline" size={20} color={COLORS.secondary} />
          <View style={{ flex: 1, marginLeft: SIZES.sm }}>
            <Text style={styles.deliveryEstimateLabel}>Estimated Delivery</Text>
            <Text style={styles.deliveryEstimateDate}>{getDeliveryDate()}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </View>
      </View>

      <View style={styles.confirmCard}>
        <View style={styles.priceSummaryRow}>
          <Text style={styles.priceSummaryLabel}>Subtotal</Text>
          <Text style={styles.priceSummaryValue}>{formatPrice(getSubtotal())}</Text>
        </View>
        {getDiscount() > 0 && (
          <View style={styles.priceSummaryRow}>
            <Text style={styles.priceSummaryLabel}>Discount</Text>
            <Text style={[styles.priceSummaryValue, { color: COLORS.success }]}>-{formatPrice(getDiscount())}</Text>
          </View>
        )}
        {getCouponDiscount() > 0 && (
          <View style={styles.priceSummaryRow}>
            <Text style={styles.priceSummaryLabel}>Coupon</Text>
            <Text style={[styles.priceSummaryValue, { color: COLORS.success }]}>-{formatPrice(getCouponDiscount())}</Text>
          </View>
        )}
        <View style={styles.priceSummaryRow}>
          <Text style={styles.priceSummaryLabel}>Delivery</Text>
          <Text style={[styles.priceSummaryValue, getDelivery() === 0 && { color: COLORS.success }]}>{getDelivery() === 0 ? 'FREE' : formatPrice(getDelivery())}</Text>
        </View>
        <View style={styles.priceSummaryRow}>
          <Text style={styles.priceSummaryLabel}>Tax</Text>
          <Text style={styles.priceSummaryValue}>{formatPrice(getTax())}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.priceSummaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
        </View>
      </View>

      {orderError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
          <Text style={styles.errorBannerText}>{orderError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.placeOrderFullBtn, placing && styles.btnDisabled]}
        onPress={handlePlaceOrder}
        disabled={placing}
      >
        {placing ? (
          <View style={styles.placingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.placingText}>Placing your order...</Text>
          </View>
        ) : (
          <Text style={styles.placeOrderFullText}>PLACE ORDER - {formatPrice(getTotal())}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtnCenter} onPress={() => setStep(2)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.secondary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtnHeader}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <StepIndicator />
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && renderAddressStep()}
        {step === 2 && renderPaymentStep()}
        {step === 3 && renderConfirmStep()}
      </ScrollView>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: SIZES.padding, paddingBottom: SIZES.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SIZES.md,
  },
  backBtnHeader: { padding: 4 },
  headerTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary },
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SIZES.lg, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray200,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.secondary },
  stepNumber: { fontSize: SIZES.font.sm, color: COLORS.gray500, fontWeight: '700' },
  stepNumberActive: { color: COLORS.white },
  stepLabel: { fontSize: SIZES.font.xs, color: COLORS.gray400, marginTop: 4, fontWeight: '500' },
  stepLabelActive: { color: COLORS.secondary, fontWeight: '700' },
  stepLine: { width: 30, height: 2, backgroundColor: COLORS.gray200, marginBottom: 18 },
  stepLineActive: { backgroundColor: COLORS.secondary },
  scrollContent: { flex: 1 },
  stepContent: { padding: SIZES.padding },
  stepTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.lg },
  addAddressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: SIZES.xl, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.secondary,
    borderRadius: SIZES.radius, gap: SIZES.sm,
  },
  addAddressText: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '600' },
  addressCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 2, borderColor: COLORS.border, gap: SIZES.md,
  },
  addressCardActive: { borderColor: COLORS.secondary },
  addressRadio: { justifyContent: 'center' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.gray300, justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: COLORS.secondary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.secondary },
  addressInfo: { flex: 1 },
  addressName: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  addressText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  addressPhone: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 4 },
  newAddressForm: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.md, ...SHADOWS.small },
  formTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  input: {
    backgroundColor: COLORS.gray50, borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm, fontSize: SIZES.font.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.sm,
  },
  formBtnRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
  cancelFormBtn: { flex: 1, height: 40, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  cancelFormText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, fontWeight: '600' },
  saveFormBtn: { flex: 1, height: 40, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  saveFormText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '700' },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm,
    borderWidth: 2, borderColor: COLORS.border, gap: SIZES.md,
  },
  paymentCardActive: { borderColor: COLORS.secondary },
  paymentRadio: {},
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: SIZES.font.md, fontWeight: '600', color: COLORS.textPrimary },
  paymentDesc: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 2 },
  nextBtn: {
    backgroundColor: COLORS.primary, height: 50, borderRadius: SIZES.radiusMd,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.xl, ...SHADOWS.medium,
  },
  nextBtnText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
  backBtn: { padding: SIZES.md, marginTop: SIZES.xl },
  backBtnCenter: { alignItems: 'center', padding: SIZES.md },
  backBtnText: { fontSize: SIZES.font.md, color: COLORS.textSecondary, fontWeight: '600' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.md, ...SHADOWS.small,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.sm },
  confirmLabel: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  confirmText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, lineHeight: 20 },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SIZES.sm,
  },
  orderItemImage: { width: 48, height: 48, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.gray100 },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: SIZES.font.sm, color: COLORS.textPrimary, fontWeight: '500' },
  orderItemQty: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 2 },
  orderItemPrice: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceSummaryLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  priceSummaryValue: { fontSize: SIZES.font.sm, color: COLORS.textPrimary, fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  totalLabel: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.textPrimary },
  placeOrderFullBtn: {
    height: 52, backgroundColor: COLORS.secondary, borderRadius: SIZES.radiusMd,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.lg, ...SHADOWS.gold,
  },
  placeOrderFullText: { color: COLORS.primary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
  btnDisabled: { opacity: 0.7 },
  placingRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  placingText: { color: COLORS.primary, fontSize: SIZES.font.md, fontWeight: '700' },
  deliveryEstimateCard: {
    backgroundColor: COLORS.secondary + '10', borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.md,
  },
  deliveryEstimateRow: { flexDirection: 'row', alignItems: 'center' },
  deliveryEstimateLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  deliveryEstimateDate: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.error + '10',
    padding: SIZES.md, borderRadius: SIZES.radiusSm, marginBottom: SIZES.md, gap: SIZES.sm,
  },
  errorBannerText: { flex: 1, fontSize: SIZES.font.sm, color: COLORS.error, fontWeight: '500' },
});

export default CheckoutScreen;
