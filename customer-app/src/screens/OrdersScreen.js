import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { ordersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { formatDate, formatPrice, getStatusColor } from '../utils/helpers';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => { if (isAuthenticated) fetchOrders(); }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll();
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : (data.items || data.orders || []));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item._id || item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{(item._id || item.id)?.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.itemsPreview}>
          {(item.items || []).slice(0, 3).map((orderItem, index) => (
            <View key={index} style={styles.itemDot}>
              <Text style={styles.itemDotText} numberOfLines={1}>{orderItem.name || orderItem.product?.name}</Text>
              {index < Math.min(item.items.length, 3) - 1 && <Text style={styles.itemDotSeparator}>·</Text>}
            </View>
          ))}
          {item.items?.length > 3 && <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>}
        </View>

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.itemsCount}>{item.items?.length || 0} items</Text>
            <Text style={styles.orderTotal}>{formatPrice(item.total || item.totalAmount)}</Text>
          </View>
          <View style={styles.trackRow}>
            <Text style={styles.trackText}>Track Order</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="receipt-outline"
          title="No Orders Yet"
          message="Sign in to view your order history"
          buttonText="Sign In"
          onButtonPress={() => navigation.navigate('Auth')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Orders Yet"
          message="Your order history will appear here"
          buttonText="Start Shopping"
          onButtonPress={() => navigation.navigate('HomeTab')}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SIZES.padding },
  orderCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.lg,
    marginBottom: SIZES.md, ...SHADOWS.small,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.md },
  orderId: { fontSize: SIZES.font.sm, color: COLORS.textPrimary, fontWeight: '700' },
  orderDate: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: SIZES.font.xs, fontWeight: '700', letterSpacing: 0.5 },
  itemsPreview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: SIZES.md },
  itemDot: { flexDirection: 'row', alignItems: 'center' },
  itemDotText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  itemDotSeparator: { marginHorizontal: SIZES.xs, color: COLORS.gray300 },
  moreItems: { fontSize: SIZES.font.xs, color: COLORS.secondary, marginLeft: SIZES.xs },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SIZES.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  itemsCount: { fontSize: SIZES.font.xs, color: COLORS.textSecondary },
  orderTotal: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
});

export default OrdersScreen;
