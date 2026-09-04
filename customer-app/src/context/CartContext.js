import React, { createContext, useState, useContext, useCallback } from 'react';
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
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await cartAPI.get();
      const cartData = response.data || response;
      const cartItems = cartData.items || cartData.cart?.items || [];
      setItems(cartItems);
      setTotalItems(cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0));
      if (cartData.coupon || cartData.cart?.coupon) setCoupon(cartData.coupon || cartData.cart?.coupon);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartAPI.add({ productId, quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to add to cart' };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await cartAPI.update({ productId, quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update cart' };
    }
  };

  const removeItem = async (productId) => {
    try {
      await cartAPI.remove(productId);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove item' };
    }
  };

  const applyCoupon = async (code, subtotal) => {
    try {
      const response = await couponsAPI.apply({ code, subtotal });
      setCoupon(response.data || response);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid coupon' };
    }
  };

  const getSubtotal = () => items.reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const getMRP = () => items.reduce((sum, item) => {
    const mrp = item.mrp || item.product?.mrp || item.price || item.product?.price || 0;
    return sum + mrp * (item.quantity || 1);
  }, 0);

  const getDiscount = () => getMRP() - getSubtotal();
  const getCouponDiscount = () => coupon ? (coupon.discount || coupon.discountAmount || 0) : 0;
  const getDelivery = () => getSubtotal() > 999 ? 0 : 99;
  const getTax = () => Math.round(getSubtotal() * 0.05);
  const getTotal = () => getSubtotal() - getCouponDiscount() + getDelivery() + getTax();

  return (
    <CartContext.Provider value={{
      items, loading, totalItems, coupon,
      fetchCart, addToCart, updateQuantity, removeItem, applyCoupon,
      getSubtotal, getMRP, getDiscount, getCouponDiscount, getDelivery, getTax, getTotal,
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
