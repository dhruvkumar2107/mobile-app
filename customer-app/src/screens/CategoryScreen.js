import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { categoriesAPI } from '../api/client';
import CategoryCard from '../components/CategoryCard';
import EmptyState from '../components/EmptyState';

const CategoryScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      const data = res?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ProductList', { categoryId: item._id || item.id, categoryName: item.name })}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="grid" size={28} color={COLORS.secondary} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      {item.productCount > 0 && <Text style={styles.productCount}>{item.productCount} items</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : categories.length === 0 ? (
        <EmptyState icon="grid-outline" title="No Categories" message="No categories available at the moment" />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => String(item._id || item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding, paddingBottom: SIZES.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.textPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: SIZES.padding },
  row: { justifyContent: 'space-between' },
  categoryCard: {
    width: '48%', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.xl, alignItems: 'center', marginBottom: SIZES.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small,
  },
  iconContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.gray50,
    justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.md,
    borderWidth: 2, borderColor: COLORS.lightGold,
  },
  categoryName: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  productCount: { fontSize: SIZES.font.xs, color: COLORS.textSecondary, marginTop: 4 },
});

export default CategoryScreen;
