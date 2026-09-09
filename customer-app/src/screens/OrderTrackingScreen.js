import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Platform, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { ordersAPI } from '../api/client';
import OrderTimeline from '../components/OrderTimeline';
import { formatDate, formatPrice, getStatusColor } from '../utils/helpers';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchOrder(); }, []);

  const fetchOrder = async () => {
    try {
      const [orderRes, trackRes] = await Promise.allSettled([
        ordersAPI.getById(orderId),
        ordersAPI.track(orderId),
      ]);
      if (orderRes.status === 'fulfilled') {
        setOrder(orderRes.value?.data || orderRes.value);
      }
      if (trackRes.status === 'fulfilled') {
        const trackData = trackRes.value?.data || trackRes.value;
        setTracking(trackData);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await ordersAPI.cancel(orderId);
              Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
              fetchOrder();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to cancel order. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.secondary} /></View>;
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="receipt-outline" size={48} color={COLORS.gray300} />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const steps = tracking?.steps || tracking?.timeline || order.trackingSteps || order.timeline || [
    { title: 'Order Placed', description: 'Your order has been placed', date: order.createdAt, completed: true },
    { title: 'Processing', description: 'Order is being processed', date: order.processedAt, completed: order.status !== 'pending', active: order.status === 'processing' },
    { title: 'Shipped', description: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Order has been shipped', date: order.shippedAt, completed: ['shipped', 'out for delivery', 'delivered'].includes(order.status), active: order.status === 'shipped' },
    { title: 'Out for Delivery', description: 'Your order is on the way', date: order.outForDeliveryAt, completed: order.status === 'delivered', active: order.status === 'out for delivery' },
    { title: 'Delivered', description: 'Order has been delivered', date: order.deliveredAt, completed: order.status === 'delivered', active: order.status === 'delivered' },
  ];

  const statusColor = getStatusColor(order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor + '15' }]}>
          <View style={[styles.statusDotLarge, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusTextLarge, { color: statusColor }]}>{order.status?.toUpperCase()}</Text>
        </View>
        <Text style={styles.orderId}>Order #{(order._id || order.id)?.slice(-8)}</Text>
      </View>

      <View style={styles.deliveryCard}>
        <View style={styles.deliveryIconWrap}>
          <Ionicons name={isDelivered ? 'checkmark-circle' : 'time-outline'} size={28} color={isDelivered ? COLORS.success : COLORS.secondary} />
        </View>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryLabel}>{isDelivered ? 'Delivered on' : 'Estimated Delivery'}</Text>
          <Text style={styles.deliveryDate}>
            {isDelivered && order.deliveredAt
              ? formatDate(order.deliveredAt)
              : order.estimatedDelivery
                ? formatDate(order.estimatedDelivery)
                : formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Progress</Text>
        <View style={styles.timelineCard}>
          <OrderTimeline steps={steps} />
        </View>
      </View>

      {(order.trackingNumber || tracking?.trackingNumber) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Details</Text>
          <View style={styles.trackingCard}>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Courier</Text>
              <Text style={styles.trackingValue}>{order.courierName || tracking?.courierName || 'BlueDart'}</Text>
            </View>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingValue}>{order.trackingNumber || tracking?.trackingNumber}</Text>
            </View>
          </View>
        </View>
      )}

      {['pending', 'confirmed'].includes(order.status) && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            onPress={handleCancelOrder}
            disabled={cancelling}
            activeOpacity={0.7}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.itemsCard}>
          {(order.items || []).map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name || item.product?.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice((item.price || 0) * (item.quantity || 1))}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total || order.totalAmount)}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  errorText: { fontSize: SIZES.font.md, color: COLORS.textSecondary },
  goBackText: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '600', marginTop: SIZES.sm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary },
  statusSection: { alignItems: 'center', paddingVertical: SIZES.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusBadgeLarge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, gap: SIZES.sm },
  statusDotLarge: { width: 10, height: 10, borderRadius: 5 },
  statusTextLarge: { fontSize: SIZES.font.sm, fontWeight: '800', letterSpacing: 1 },
  orderId: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: SIZES.sm },
  deliveryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SIZES.padding, padding: SIZES.lg, borderRadius: SIZES.radiusMd, gap: SIZES.md,
    ...SHADOWS.small,
  },
  deliveryIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  deliveryInfo: { flex: 1 },
  deliveryLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  deliveryDate: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  section: { paddingHorizontal: SIZES.padding, marginBottom: SIZES.md },
  sectionTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  timelineCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.lg, ...SHADOWS.small },
  trackingCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.lg, ...SHADOWS.small },
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SIZES.xs },
  trackingLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  trackingValue: { fontSize: SIZES.font.sm, color: COLORS.textPrimary, fontWeight: '600' },
  itemsCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.lg, ...SHADOWS.small },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SIZES.sm },
  itemInfo: { flex: 1, marginRight: SIZES.md },
  itemName: { fontSize: SIZES.font.md, color: COLORS.textPrimary, fontWeight: '500' },
  itemQty: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SIZES.sm },
  totalLabel: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.primary },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.error },
});

export default OrderTrackingScreen;
