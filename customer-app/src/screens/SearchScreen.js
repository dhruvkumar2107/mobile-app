import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  StatusBar, Keyboard, ActivityIndicator, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { searchAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/SkeletonLoader';

const SearchScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentSearches, setRecentSearches] = useState(['Shirts', 'Dresses', 'Sneakers']);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await searchAPI.trending();
      const data = res?.data || res || [];
      setTrending(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(() => fetchSuggestions(query), 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async (searchQuery) => {
    try {
      const res = await searchAPI.suggestions(searchQuery);
      const data = res?.data || res || [];
      setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const search = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setShowResults(true);
    Keyboard.dismiss();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== q.toLowerCase());
      return [q, ...filtered].slice(0, 8);
    });
    try {
      const res = await searchAPI.search({ q: q.trim() });
      const data = res?.data || res || {};
      setResults(Array.isArray(data) ? data : (data.results || data.items || data.products || []));
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecent = () => setRecentSearches([]);

  const renderSearchContent = () => {
    if (showResults) {
      return (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{results.length} results for "{query}"</Text>
            <TouchableOpacity onPress={() => { setShowResults(false); setResults([]); }}>
              <Ionicons name="close" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.resultsGrid}>{[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}</View>
          ) : results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={COLORS.gray300} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyMessage}>Try different keywords</Text>
            </View>
          ) : (
            <View style={styles.resultsGrid}>
              {results.map((item) => (
                <View key={item._id || item.id} style={[styles.resultItem, { width: (width - 40) / 2 }]}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                  />
                </View>
              ))}
            </View>
          )}
        </>
      );
    }

    if (suggestions.length > 0 && query.length > 1) {
      return (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => {
                const text = typeof item === 'string' ? item : (item.name || item);
                setQuery(text);
                search(text);
              }}
            >
              <Ionicons name="search" size={16} color={COLORS.gray400} />
              <Text style={styles.suggestionText}>{typeof item === 'string' ? item : (item.name || item)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.searchContent}>
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecent}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {recentSearches.map((searchTerm, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => { setQuery(searchTerm); search(searchTerm); }}
                >
                  <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
                  <Text style={styles.tagText}>{searchTerm}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <Ionicons name="flame" size={18} color={COLORS.error} />
          </View>
          {initialLoading ? (
            <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: SIZES.md }} />
          ) : (
            <View style={styles.trendingContainer}>
              {trending.length > 0 ? trending.map((item, index) => {
                const text = typeof item === 'string' ? item : (item.name || item.query || '');
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.trendingItem}
                    onPress={() => { setQuery(text); search(text); }}
                  >
                    <View style={styles.trendingNumber}>
                      <Text style={styles.trendingNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.trendingText}>{text}</Text>
                    <Ionicons name="trending-up" size={14} color={COLORS.secondary} />
                  </TouchableOpacity>
                );
              }) : (
                ['Premium Watches', 'Designer Bags', 'Gold Jewelry', 'Silk Sarees', 'Luxury Shoes', 'Perfumes'].map((text, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.trendingItem}
                    onPress={() => { setQuery(text); search(text); }}
                  >
                    <View style={styles.trendingNumber}>
                      <Text style={styles.trendingNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.trendingText}>{text}</Text>
                    <Ionicons name="trending-up" size={14} color={COLORS.secondary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={20} color={COLORS.gray400} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for brands, products..."
              placeholderTextColor={COLORS.gray400}
              returnKeyType="search"
              onSubmitEditing={() => search()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setShowResults(false); setResults([]); }}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={[1]}
        renderItem={() => renderSearchContent()}
        keyExtractor={() => 'content'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: SIZES.md,
    paddingHorizontal: SIZES.padding, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.gray100, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md, height: SIZES.height.input,
  },
  searchInput: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary, marginLeft: SIZES.sm },
  content: { paddingHorizontal: SIZES.padding, paddingBottom: 100 },
  suggestionsContainer: { paddingTop: SIZES.sm },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SIZES.sm,
  },
  suggestionText: { fontSize: SIZES.font.md, color: COLORS.textPrimary, flex: 1 },
  searchContent: { paddingTop: SIZES.lg },
  section: { marginBottom: SIZES.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary },
  clearText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  tagText: { fontSize: SIZES.font.sm, color: COLORS.textPrimary },
  trendingContainer: { marginTop: SIZES.sm },
  trendingItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SIZES.md,
  },
  trendingNumber: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  trendingNumberText: { color: COLORS.white, fontSize: SIZES.font.xs, fontWeight: '700' },
  trendingText: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary, fontWeight: '500' },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.md, paddingVertical: SIZES.sm,
  },
  resultsCount: { fontSize: SIZES.font.sm, color: COLORS.textSecondary },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  resultItem: { marginBottom: SIZES.sm },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: SIZES.md },
  emptyMessage: { fontSize: SIZES.font.md, color: COLORS.textSecondary, marginTop: SIZES.xs },
});

export default SearchScreen;
