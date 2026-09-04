import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { productsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const ReviewScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const { isAuthenticated } = useAuth();

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    if (rating === 0) {
      setToast({ visible: true, message: 'Please select a rating', type: 'warning' });
      return;
    }
    if (!body.trim()) {
      setToast({ visible: true, message: 'Please write a review', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await productsAPI.review(productId, { rating, title: title.trim(), body: body.trim() });
      Alert.alert('Thank You!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setToast({ visible: true, message: error.message || 'Failed to submit review', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Your Rating *</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFC107' : COLORS.gray300}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </Text>

        <Text style={styles.label}>Review Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Summarize your experience"
          placeholderTextColor={COLORS.gray400}
        />

        <Text style={styles.label}>Your Review *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder="Tell others what you think about this product..."
          placeholderTextColor={COLORS.gray400}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color={COLORS.secondary} /> : <Text style={styles.submitBtnText}>SUBMIT REVIEW</Text>}
        </TouchableOpacity>
      </ScrollView>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: SIZES.padding },
  label: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.sm, marginTop: SIZES.lg },
  starsContainer: { flexDirection: 'row', gap: SIZES.sm },
  starBtn: { padding: 4 },
  ratingText: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '600', marginTop: SIZES.sm },
  input: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md, fontSize: SIZES.font.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { height: 120, paddingTop: SIZES.md },
  submitBtn: {
    backgroundColor: COLORS.primary, height: 50, borderRadius: SIZES.radius,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.xxl, marginBottom: 40,
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.secondary, fontSize: SIZES.font.md, fontWeight: '800', letterSpacing: 1 },
});

export default ReviewScreen;
