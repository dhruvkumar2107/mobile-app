import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/helpers';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>LUXE</Text>
            <View style={styles.goldLine} />
          </View>
          <Text style={styles.tagline}>Premium Fashion & Lifestyle</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping</Text>

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
              autoCorrect={false}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.buttonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color={COLORS.textPrimary} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={22} color={COLORS.textPrimary} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: SIZES.padding, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logoContainer: { alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '900', color: COLORS.primary, letterSpacing: 6 },
  goldLine: { width: 60, height: 3, backgroundColor: COLORS.secondary, borderRadius: 2, marginTop: 8 },
  tagline: { fontSize: SIZES.font.sm, color: COLORS.secondary, letterSpacing: 2, marginTop: 12, fontWeight: '500' },
  formContainer: { marginBottom: 20 },
  welcomeText: { fontSize: SIZES.font.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: SIZES.font.md, color: COLORS.textSecondary, marginTop: 4, marginBottom: SIZES.xl },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, height: SIZES.height.input,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.xs,
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, fontSize: SIZES.font.md, color: COLORS.textPrimary, marginLeft: SIZES.sm },
  errorText: { fontSize: SIZES.font.xs, color: COLORS.error, marginBottom: SIZES.sm, marginLeft: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: SIZES.xl, marginTop: SIZES.sm },
  forgotPasswordText: { fontSize: SIZES.font.sm, color: COLORS.secondary, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary, height: SIZES.height.button, borderRadius: SIZES.radiusMd,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.secondary, fontSize: SIZES.font.lg, fontWeight: '800', letterSpacing: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: SIZES.md, color: COLORS.textSecondary, fontSize: SIZES.font.sm },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, height: SIZES.height.button, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.md, gap: SIZES.sm,
  },
  socialButtonText: { fontSize: SIZES.font.md, color: COLORS.textPrimary, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.xl },
  footerText: { fontSize: SIZES.font.md, color: COLORS.textSecondary },
  footerLink: { fontSize: SIZES.font.md, color: COLORS.secondary, fontWeight: '700' },
});

export default LoginScreen;
