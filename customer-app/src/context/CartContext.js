import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { cartAPI, couponsAPI } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setTotalItems(0);
      setCoupon(null);
      return;
    }
    try {
      setLoading(true);
      const response = await cartAPI.get();
      const cartData = response.data || response;
      const cartItems = cartData.items || cartData.cart?.items || [];
      setItems(cartItems);
      setTotalItems(cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0));
      if (cartData.coupon || cartData.cart?.coupon) {
        setCoupon(cartData.coupon || cartData.cart?.coupon);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (productId, quantity = 1, variantId = null) => {
    try {
      const payload = { productId, quantity };
      if (variantId) payload.variantId = variantId;
      await cartAPI.add(payload);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to add to cart' };
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      await cartAPI.update({ productId, quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update cart' };
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (productId) => {
    try {
      await cartAPI.remove(productId);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove item' };
    }
  }, [fetchCart]);

  const applyCoupon = useCallback(async (code, subtotal) => {
    try {
      const response = await couponsAPI.apply({ code, subtotal });
      setCoupon(response.data || response);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid coupon' };
    }
  }, []);

  const clearCoupon = useCallback(() => setCoupon(null), []);

  const cartSummary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.price || item.product?.price || 0;
      return sum + price * (item.quantity || 1);
    }, 0);

    const mrp = items.reduce((sum, item) => {
      const itemMrp = item.mrp || item.product?.mrp || item.price || item.product?.price || 0;
      return sum + itemMrp * (item.quantity || 1);
    }, 0);

    const discount = mrp - subtotal;
    const couponDiscount = coupon ? (coupon.discount || coupon.discountAmount || 0) : 0;
    const delivery = subtotal > 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal - couponDiscount + delivery + tax;

    return { subtotal, mrp, discount, couponDiscount, delivery, tax, total };
  }, [items, coupon]);

  return (
    <CartContext.Provider value={{
      items, loading, totalItems, coupon,
      fetchCart, addToCart, updateQuantity, removeItem, applyCoupon, clearCoupon,
      ...cartSummary,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export default CartContext;
