import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SearchScreen from '../screens/SearchScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AddressScreen from '../screens/AddressScreen';
import CouponScreen from '../screens/CouponScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ReviewScreen from '../screens/ReviewScreen';
import VariantCompareScreen from '../screens/VariantCompareScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: false,
};

function CartIcon({ color, size }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name="bag-outline" size={size} color={color} />
      {totalItems > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Bag' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Write Review' }} />
      <Stack.Screen name="VariantCompare" component={VariantCompareScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CategoryMain" component={CategoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Bag' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Bag' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Write Review' }} />
    </Stack.Navigator>
  );
}

function WishlistStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="WishlistMain" component={WishlistScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Bag' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Write Review' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Address" component={AddressScreen} options={{ title: 'Addresses' }} />
      <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Coupons" component={CouponScreen} options={{ title: 'Coupons & Offers' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Customer Support' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Write Review' }} />
    </Stack.Navigator>
  );
}

function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Info', 'Please fill in both subject and message.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      Alert.alert('Ticket Submitted', 'Our support team will get back to you within 24 hours.');
      setSubject('');
      setMessage('');
      setSubmitted(false);
    }, 1000);
  };

  const faqs = [
    { q: 'How do I track my order?', a: 'Go to My Orders and tap on any order to see live tracking updates.' },
    { q: 'How do I return an item?', a: 'Open the delivered order, tap Return, select items and reason. Pickup will be scheduled within 48 hours.' },
    { q: 'What payment methods are accepted?', a: 'We accept UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery.' },
  ];

  if (submitted) {
    return (
      <View style={styles.placeholderScreen}>
        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success || '#4CAF50'} />
        <Text style={styles.placeholderTitle}>Submitting...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: SIZES.md, gap: SIZES.md }}>
      <View style={{ alignItems: 'center', marginBottom: SIZES.sm }}>
        <Ionicons name="chatbubble-outline" size={40} color={COLORS.secondary} />
        <Text style={[styles.placeholderTitle, { marginTop: SIZES.sm }]}>How can we help?</Text>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@luxe.com')}>
          <Ionicons name="mail-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>support@luxe.com</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+919876543200')}>
          <Ionicons name="call-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.contactLabel}>Phone</Text>
          <Text style={styles.contactValue}>+91 98765 43200</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={styles.faqItem}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Send a Message</Text>
        <Text style={styles.formLabel}>Subject</Text>
        <TextInput style={styles.input} placeholder="e.g. Order issue, Return request..." placeholderTextColor={COLORS.gray400} value={subject} onChangeText={setSubject} />
        <Text style={styles.formLabel}>Message</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Describe your issue..." placeholderTextColor={COLORS.gray400} multiline value={message} onChangeText={setMessage} />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { logout } = useAuth();

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'All cached data will be cleared. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', onPress: () => Alert.alert('Done', 'Cache cleared successfully.') },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const toggleSwitch = (setter, current) => setter(!current);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: SIZES.md, gap: SIZES.sm }}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.sectionCard}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Receive order and offer alerts</Text>
          </View>
          <TouchableOpacity onPress={() => toggleSwitch(setNotificationsEnabled, notificationsEnabled)} style={[styles.toggle, notificationsEnabled && styles.toggleOn]}>
            <View style={[styles.toggleDot, notificationsEnabled && styles.toggleDotOn]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDesc}>Switch to dark theme</Text>
          </View>
          <TouchableOpacity onPress={() => toggleSwitch(setDarkMode, darkMode)} style={[styles.toggle, darkMode && styles.toggleOn]}>
            <View style={[styles.toggleDot, darkMode && styles.toggleDotOn]} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Data & Storage</Text>
      <View style={styles.sectionCard}>
        <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
          <Ionicons name="trash-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.menuText}>Clear Cache</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.sectionCard}>
        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.menuText}>App Version</Text>
          <Text style={styles.menuValue}>1.0.0</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.menuText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Categories') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'WishlistTab') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';

          if (route.name === 'WishlistTab') {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Categories" component={CategoryStack} options={{ tabBarLabel: 'Categories' }} />
      <Tab.Screen name="Search" component={SearchStack} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="WishlistTab" component={WishlistStack} options={{ tabBarLabel: 'Wishlist' }} />
      <Tab.Screen name="Account" component={ProfileStack} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  placeholderScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background, gap: SIZES.sm,
  },
  placeholderTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: SIZES.md },
  placeholderText: { fontSize: SIZES.font.md, color: COLORS.textSecondary },
  contactRow: { flexDirection: 'row', gap: SIZES.sm },
  contactCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: SIZES.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.gray200,
  },
  contactLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  contactValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '700' },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.gray200, gap: SIZES.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: SIZES.sm },
  faqItem: { gap: 2 },
  faqQ: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  faqA: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  submitBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: SIZES.sm,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  settingDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggle: {
    width: 48, height: 26, borderRadius: 13, backgroundColor: COLORS.gray300, justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: COLORS.secondary },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white, alignSelf: 'flex-start' },
  toggleDotOn: { alignSelf: 'flex-end' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  menuValue: { fontSize: 13, color: COLORS.textSecondary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 14, marginTop: SIZES.sm,
    borderWidth: 1, borderColor: COLORS.error,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.error },
});
