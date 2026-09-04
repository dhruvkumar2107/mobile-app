import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, StatusBar,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { formatPrice, getDiscountPercent, getImageUrl } from '../utils/helpers';

const CartScreen = ({ navigation }) => {
  const {
    items, loading, fetchCart, updateQuantity, removeItem,
    getSubtotal, getMRP, getDiscount, getCouponDiscount, getDelivery, getTax, getTotal, totalItems,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated]);

  const getItemId = (item) => item.product?._id || item.productId || item._id || item.id;
  const getItemName = (item) => item.name || item.product?.name || '';
  const getItemBrand = (item) => item.brand || item.product?.brand || '';
  const getItemPrice = (item) => item.price || item.product?.price || 0;
  const getItemMrp = (item) => item.mrp || item.product?.mrp || getItemPrice(item);
  const getItemImage = (item) => item.image || item.product?.images?.[0] || '';

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => handleRemoveItem(item) },
      ]);
      return;
    }
    const productId = getItemId(item);
    const result = await updateQuantity(productId, newQty);
    if (!result.success) setToast({ visible: true, message: result.message, type: 'error' });
  };

  const handleRemoveItem = async (item) => {
    const productId = getItemId(item);
    const result = await removeItem(productId);
    if (result.success) setToast({ visible: true, message: 'Item removed', type: 'success' });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) { navigation.navigate('Auth'); return; }
    if (items.length === 0) return;
    navigation.navigate('Checkout');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <EmptyState
          icon="bag-outline"
          title="Your Bag is Empty"
          message="Sign in to view your cart and start shopping"
          buttonText="Sign In"
          onButtonPress={() => navigation.navigate('Auth')}
        />
      </View>
    );
  }

  const totalSavings = getDiscount() + getCouponDiscount();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Bag</Text>
        <Text style={styles.headerSubtitle}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="bag-outline"
          title="Your Bag is Empty"
          message="Explore our collection and add items you love"
          buttonText="Start Shopping"
          onButtonPress={() => navigation.navigate('HomeTab')}
        />
      ) : (
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {items.map((item) => {
              const itemId = getItemId(item);
              const price = getItemPrice(item);
              const mrp = getItemMrp(item);
              const discount = getDiscountPercent(mrp, price);
              return (
                <View key={itemId} style={styles.cartItem}>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: itemId })}>
                    <Image source={{ uri: getImageUrl(getItemImage(item)) }} style={styles.itemImage} resizeMode="cover" />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleWrap}>
                        {getItemBrand(item) && <Text style={styles.itemBrand}>{getItemBrand(item)}</Text>}
                        <Text style={styles.itemName} numberOfLines={2}>{getItemName(item)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveItem(item)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.gray400} />
                      </TouchableOpacity>
                    </View>
                    {item.size && <Text style={styles.itemVariant}>Size: {item.size}{item.color ? ` | Color: ${item.color}` : ''}</Text>}
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>{formatPrice(price)}</Text>
                      {mrp > price && <Text style={styles.itemMrp}>{formatPrice(mrp)}</Text>}
                      {discount > 0 && <Text style={styles.itemDiscount}>{discount}% off</Text>}
                    </View>
                    <View style={styles.quantityRow}>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(item, (item.quantity || 1) - 1)}>
                          <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity || 1}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(item, (item.quantity || 1) + 1)}>
                          <Ionicons name="add" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.itemTotal}>{formatPrice(price * (item.quantity || 1))}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.summary}>
            <ScrollView style={styles.summaryScroll}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Price Details</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total MRP</Text>
                  <Text style={styles.summaryValue}>{formatPrice(getMRP())}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{formatPrice(getDiscount())}</Text>
                </View>
                {getCouponDiscount() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Coupon Discount</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{formatPrice(getCouponDiscount())}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={[styles.summaryValue, getDelivery() === 0 && { color: COLORS.success }]}>
                    {getDelivery() === 0 ? 'FREE' : formatPrice(getDelivery())}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>{formatPrice(getTax())}</Text>
                </View>
                {totalSavings > 0 && (
                  <View style={styles.savingsBanner}>
                    <Ionicons name="pricetag" size={16} color={COLORS.success} />
                    <Text style={styles.savingsText}>You Save {formatPrice(totalSavings)}</Text>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.8}>
              <Text style={styles.checkoutText}>CONTINUE TO CHECKOUT</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  headerSubtitle: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: SIZES.padding },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.md, ...SHADOWS.small },
  itemImage: { width: 100, height: 130, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.gray100 },
  itemInfo: { flex: 1, marginLeft: SIZES.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitleWrap: { flex: 1, marginRight: SIZES.sm },
  itemBrand: { fontSize: SIZES.font.xs, color: COLORS.secondary, fontWeight: '600', textTransform: 'uppercase' },
  itemName: { fontSize: SIZES.font.md, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2, lineHeight: 20 },
  removeBtn: { padding: 4 },
  itemVariant: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginTop: SIZES.sm },
  itemPrice: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  itemMrp: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  itemDiscount: { fontSize: SIZES.font.xs, color: COLORS.success, fontWeight: '600' },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.sm },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  summary: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 30 },
  summaryScroll: { maxHeight: 300 },
  summaryCard: { padding: SIZES.padding },
  summaryTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SIZES.xs },
  summaryLabel: { fontSize: SIZES.font.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: SIZES.font.md, color: COLORS.textPrimary, fontWeight: '600' },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '15',
    padding: SIZES.sm, borderRadius: SIZES.radiusSm, gap: SIZES.sm, marginTop: SIZES.sm,
  },
  savingsText: { fontSize: SIZES.font.sm, color: COLORS.success, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  totalLabel: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.textPrimary },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, marginHorizontal: SIZES.padding, height: 52,
    borderRadius: SIZES.radiusMd, gap: SIZES.sm, ...SHADOWS.medium,
  },
  checkoutText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
});

export default CartScreen;
