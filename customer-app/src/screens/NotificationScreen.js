import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { notificationsAPI } from '../api/client';
import EmptyState from '../components/EmptyState';
import { getTimeAgo } from '../utils/helpers';

const iconMap = {
  order: 'receipt-outline',
  offer: 'pricetag-outline',
  delivery: 'car-outline',
  payment: 'card-outline',
  general: 'notifications-outline',
  promo: 'gift-outline',
};

const iconColorMap = {
  order: '#3B82F6',
  offer: COLORS.secondary,
  delivery: '#10B981',
  payment: '#8B5CF6',
  general: COLORS.primary,
  promo: '#EF4444',
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      const data = res?.data || res || [];
      setNotifications(Array.isArray(data) ? data : (data.notifications || data.items || []));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.read(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.isRead && !n.read).map((n) => n._id || n.id);
      await Promise.all(unreadIds.map((id) => notificationsAPI.read(id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const renderNotification = ({ item }) => {
    const iconName = iconMap[item.type] || 'notifications-outline';
    const iconColor = iconColorMap[item.type] || COLORS.secondary;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !(item.isRead || item.read) && styles.unreadCard]}
        onPress={() => markAsRead(item._id || item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.notifInfo}>
          <Text style={[styles.notifTitle, !(item.isRead || item.read) && styles.unreadTitle]}>{item.title}</Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message || item.body}</Text>
          <Text style={styles.notifTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        {!(item.isRead || item.read) && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const hasUnread = notifications.some((n) => !n.isRead && !n.read);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications-outline" title="No Notifications" message="You're all caught up!" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary },
  markAllText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SIZES.padding },
  notifCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.sm, alignItems: 'center', gap: SIZES.md, ...SHADOWS.small,
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: COLORS.secondary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: SIZES.font.md, fontWeight: '600', color: COLORS.textPrimary },
  unreadTitle: { fontWeight: '700' },
  notifMessage: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: SIZES.font.xs, color: COLORS.gray400, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
});

export default NotificationScreen;
