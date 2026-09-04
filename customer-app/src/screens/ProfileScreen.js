import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders', color: '#3B82F6' },
  { icon: 'heart-outline', label: 'My Wishlist', screen: 'Wishlist', color: '#EF4444' },
  { icon: 'location-outline', label: 'Saved Addresses', screen: 'Address', color: '#10B981' },
  { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#8B5CF6' },
  { icon: 'pricetag-outline', label: 'Coupons & Offers', screen: 'Coupons', color: COLORS.secondary },
  { icon: 'chatbubble-outline', label: 'Customer Support', screen: 'Support', color: '#06B6D4' },
  { icon: 'settings-outline', label: 'Settings', screen: 'Settings', color: '#6B7280' },
];

const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {isAuthenticated ? (user?.name?.charAt(0) || 'G') : '?'}
              </Text>
            </View>
            {isAuthenticated && <View style={styles.avatarBadge}><Ionicons name="checkmark" size={12} color={COLORS.white} /></View>}
          </View>
          {isAuthenticated ? (
            <>
              <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
            </>
          ) : (
            <>
              <Text style={styles.userName}>Welcome, Guest</Text>
              <Text style={styles.userEmail}>Sign in to access your account</Text>
              <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Auth')}>
                <Text style={styles.signInBtnText}>SIGN IN / SIGN UP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index === MENU_ITEMS.length - 1 && styles.menuItemLast]}
              onPress={() => {
                if (!isAuthenticated) { navigation.navigate('Auth'); return; }
                navigation.navigate(item.screen);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />
            </TouchableOpacity>
          ))}
        </View>

        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>LUXE v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: SIZES.xxl, paddingHorizontal: SIZES.padding, alignItems: 'center',
  },
  avatarContainer: { marginBottom: SIZES.md, position: 'relative' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.secondary,
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
    borderRadius: 12, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.secondary },
  userName: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.white },
  userEmail: { fontSize: SIZES.font.sm, color: COLORS.accent, marginTop: 4 },
  userPhone: { fontSize: SIZES.font.sm, color: COLORS.accent, marginTop: 2 },
  signInBtn: {
    marginTop: SIZES.md, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.secondary,
  },
  signInBtnText: { color: COLORS.secondary, fontSize: SIZES.font.sm, fontWeight: '700', letterSpacing: 1 },
  menuContainer: {
    backgroundColor: COLORS.surface, margin: SIZES.padding, borderRadius: SIZES.radiusMd,
    overflow: 'hidden', ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary, fontWeight: '500', marginLeft: SIZES.md },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: SIZES.padding, paddingVertical: SIZES.lg, gap: SIZES.sm,
    marginTop: SIZES.md, backgroundColor: COLORS.error + '10', borderRadius: SIZES.radiusMd,
  },
  logoutText: { fontSize: SIZES.font.md, color: COLORS.error, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: SIZES.font.xs, color: COLORS.gray400, marginTop: SIZES.xl, paddingBottom: 40 },
});

export default ProfileScreen;
