import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone, validatePassword } from '../utils/helpers';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email address';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(phone)) newErrors.phone = 'Invalid 10-digit phone number';
    if (!password) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    setLoading(false);
    if (!result.success) {
      Alert.alert('Registration Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>LUXE</Text>
          <View style={styles.goldLine} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us for exclusive access</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color={errors.name ? COLORS.error : COLORS.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.gray400}
              value={name}
              onChangeText={(t) => { setName(t); setErrors({ ...errors, name: null }); }}
              autoCapitalize="words"
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color={errors.email ? COLORS.error : COLORS.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: null }); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={20} color={errors.phone ? COLORS.error : COLORS.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.gray400}
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors({ ...errors, phone: null }); }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <View style={[styles.inputContainer, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color={errors.password ? COLORS.error : COLORS.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray400}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: null }); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? COLORS.error : COLORS.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.gray400}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setErrors({ ...errors, confirmPassword: null }); }}
              secureTextEntry={!showPassword}
            />
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <Text style={styles.terms}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: SIZES.padding, paddingBottom: 40 },
  backButton: { marginTop: 48, marginBottom: SIZES.md, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: SIZES.xxl },
  logo: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: 4 },
  goldLine: { width: 40, height: 3, backgroundColor: COLORS.secondary, borderRadius: 2, marginTop: 8 },
  title: { fontSize: SIZES.font.xxxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: SIZES.lg },
  subtitle: { fontSize: SIZES.font.md, color: COLORS.textSecondary, marginTop: 4 },
  form: { marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, height: SIZES.height.input,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.xs,
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary, marginLeft: SIZES.sm },
  errorText: { fontSize: SIZES.font.xs, color: COLORS.error, marginBottom: SIZES.sm, marginLeft: 4 },
  terms: { fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: SIZES.md, marginBottom: SIZES.xl, lineHeight: 20 },
  termsLink: { color: COLORS.secondary, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary, height: SIZES.height.button, borderRadius: SIZES.radiusMd,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.secondary, fontSize: SIZES.font.lg, fontWeight: '800', letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.xl },
  footerText: { fontSize: SIZES.font.md, color: COLORS.textSecondary },
  footerLink: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '700' },
});

export default RegisterScreen;
