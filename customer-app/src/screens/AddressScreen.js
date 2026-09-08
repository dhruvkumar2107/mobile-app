import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, Alert, Platform, TextInput, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { addressesAPI } from '../api/client';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

const AddressScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '', type: 'home' });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await addressesAPI.get();
      const data = res?.data || res || [];
      setAddresses(Array.isArray(data) ? data : (data.addresses || []));
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setForm({ name: '', phone: '', line1: '', city: '', state: '', pincode: '', type: 'home' });
    setShowModal(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setForm({
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || addr.street || addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: String(addr.pincode || addr.zip || ''),
      type: addr.type || 'home',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.state || !form.pincode) {
      setToast({ visible: true, message: 'Please fill all required fields', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, pincode: String(form.pincode) };
      if (editingAddress) {
        await addressesAPI.update(editingAddress._id || editingAddress.id, payload);
      } else {
        await addressesAPI.create(payload);
      }
      setShowModal(false);
      setEditingAddress(null);
      fetchAddresses();
      setToast({ visible: true, message: editingAddress ? 'Address updated' : 'Address saved', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: error.message || 'Failed to save address', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await addressesAPI.delete(id);
            fetchAddresses();
            setToast({ visible: true, message: 'Address deleted', type: 'success' });
          } catch (error) {
            setToast({ visible: true, message: 'Failed to delete', type: 'error' });
          }
        },
      },
    ]);
  };

  const renderAddress = ({ item }) => (
    <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
      <View style={styles.addressHeader}>
        <View style={styles.addressType}>
          <Ionicons name={item.type === 'office' ? 'business' : 'home'} size={16} color={COLORS.secondary} />
          <Text style={styles.addressTypeText}>{item.type === 'office' ? 'Office' : 'Home'}</Text>
          {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color={COLORS.gray500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={styles.actionBtn}>
            <Ionicons name="trash" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.addressName}>{item.name}</Text>
      <Text style={styles.addressText}>{item.line1 || item.street || item.address}</Text>
      <Text style={styles.addressText}>{item.city}, {item.state} - {item.pincode || item.zip}</Text>
      {item.phone && <Text style={styles.addressPhone}>Phone: {item.phone}</Text>}
    </View>
  );

  const renderFormModal = () => (
    <Modal visible={showModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Name" />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} />

            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput style={styles.input} value={form.line1} onChangeText={(t) => setForm({ ...form, line1: t })} placeholder="House no., Street, Area, Landmark" multiline numberOfLines={2} />

            <Text style={styles.inputLabel}>City *</Text>
            <TextInput style={styles.input} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} placeholder="City" />

            <Text style={styles.inputLabel}>State *</Text>
            <TextInput style={styles.input} value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} placeholder="State" />

            <Text style={styles.inputLabel}>Pincode *</Text>
            <TextInput style={styles.input} value={form.pincode} onChangeText={(t) => setForm({ ...form, pincode: t })} placeholder="6-digit pincode" keyboardType="number-pad" maxLength={6} />

            <View style={styles.typeRow}>
              <Text style={styles.inputLabel}>Address Type</Text>
              <View style={styles.typeBtns}>
                <TouchableOpacity
                  style={[styles.typeBtn, form.type === 'home' && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, type: 'home' })}
                >
                  <Text style={[styles.typeBtnText, form.type === 'home' && styles.typeBtnTextActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, form.type === 'office' && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, type: 'office' })}
                >
                  <Text style={[styles.typeBtnText, form.type === 'office' && styles.typeBtnTextActive]}>Office</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setEditingAddress(null); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.secondary} />
                ) : (
                  <Text style={styles.saveBtnText}>{editingAddress ? 'Update' : 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={styles.loader} />
      ) : addresses.length === 0 ? (
        <EmptyState icon="location-outline" title="No Addresses" message="Add your delivery addresses" buttonText="Add Address" onButtonPress={openAddModal} />
      ) : (
        <FlatList data={addresses} renderItem={renderAddress} keyExtractor={(item) => String(item._id || item.id)} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}
      {renderFormModal()}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SIZES.padding },
  addressCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.lg,
    marginBottom: SIZES.md, borderWidth: 2, borderColor: COLORS.border,
  },
  defaultCard: { borderColor: COLORS.secondary },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  addressType: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  addressTypeText: { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textPrimary },
  defaultBadge: { backgroundColor: COLORS.secondary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: SIZES.sm },
  defaultText: { fontSize: SIZES.font.xs, color: COLORS.secondary, fontWeight: '700' },
  addressActions: { flexDirection: 'row', gap: SIZES.sm },
  actionBtn: { padding: 4 },
  addressName: { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.textPrimary },
  addressText: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, lineHeight: 20, marginTop: 2 },
  addressPhone: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding, paddingBottom: 40, paddingTop: SIZES.sm, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray300, alignSelf: 'center', marginBottom: SIZES.lg },
  modalTitle: { fontSize: SIZES.font.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.lg },
  inputLabel: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginBottom: SIZES.xs, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.gray50, borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md, fontSize: SIZES.font.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.md,
  },
  typeRow: { marginBottom: SIZES.lg },
  typeBtns: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
  typeBtn: { paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary + '10' },
  typeBtnText: { fontSize: SIZES.font.sm, color: COLORS.textPrimary },
  typeBtnTextActive: { color: COLORS.secondary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.sm },
  cancelBtn: { flex: 1, height: 48, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: SIZES.font.md, color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, height: 48, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '700' },
});

export default AddressScreen;
