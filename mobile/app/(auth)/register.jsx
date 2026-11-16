import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { GoogleIcon, Icon, FitlyLogo } from '../../components/ui';
import { Colors, Typography } from '../../constants';

export default function RegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useAppStore();
  const { setUser, setProfile, setToken } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Please enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Try Backend JWT Registration
      try {
        const res = await api.post('/auth/register', {
          email: email.trim(),
          password,
          name: name.trim(),
        });
        if (res.data?.success && res.data?.token) {
          queryClient.clear();
          setToken(res.data.token);
          setUser(res.data.data);
          setProfile(res.data.data);
          showToast({ type: 'success', title: 'Account Created', message: 'Welcome to Fitly!' });
          if (res.data.data?.onboardingCompleted) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/(auth)/onboarding');
          }
          return;
        }
      } catch (jwtErr) {
        if (jwtErr?.response?.data?.message) {
          throw new Error(jwtErr.response.data.message);
        }
      }

      // 2. Fallback to Firebase Registration
      const fbUser = await authService.register(email.trim(), password, name.trim());
      queryClient.clear();
      const idToken = await fbUser.getIdToken();
      setToken(idToken);
      setUser(fbUser);
      let loadedProfile = null;
      try {
        const profRes = await api.put(
          '/auth/profile',
          { name: name.trim() },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        loadedProfile = profRes.data?.data || null;
        setProfile(loadedProfile);
      } catch {}
      showToast({ type: 'success', title: 'Account Created', message: 'Welcome to Fitly!' });
      if (loadedProfile?.onboardingCompleted) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Could not create account' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const fbUser = await authService.googleSignIn();
      if (fbUser) {
        queryClient.clear();
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        setUser(fbUser);
        let loadedProfile = null;
        try {
          const profRes = await api.get('/auth/profile', { headers: { Authorization: `Bearer ${idToken}` } });
          loadedProfile = profRes.data?.data || null;
          setProfile(loadedProfile);
        } catch {}
        if (loadedProfile?.onboardingCompleted) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Google Sign-In Failed', message: err.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Navigation Row */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="ChevronLeft" size={20} color="#0F172A" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.topLogo}>
              <FitlyLogo size={36} variant="icon" />
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Your Account</Text>
            <Text style={styles.headerSubtitle}>
              Begin your intelligent metabolic and athletic training
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputFocused,
                  errors.name && styles.inputError,
                ]}
              >
                <Icon name="User" size={18} color={focusedField === 'name' ? Colors.primary[600] : '#94A3B8'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alex Morgan"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'email' && styles.inputFocused,
                  errors.email && styles.inputError,
                ]}
              >
                <Icon name="Mail" size={18} color={focusedField === 'email' ? Colors.primary[600] : '#94A3B8'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputFocused,
                  errors.password && styles.inputError,
                ]}
              >
                <Icon name="Lock" size={18} color={focusedField === 'password' ? Colors.primary[600] : '#94A3B8'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={showPassword ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.primary[600]}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'confirmPassword' && styles.inputFocused,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <Icon name="Lock" size={18} color={focusedField === 'confirmPassword' ? Colors.primary[600] : '#94A3B8'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={showConfirmPassword ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.primary[600]}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primaryBtnText}>Create My Account</Text>
                  <Icon name="ArrowRight" size={18} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.textPrimary} size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <GoogleIcon size={18} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Terms and Privacy Policy */}
            <Text style={styles.termsText}>
              By creating an account, you agree to Fitly’s{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/terms')}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Footer switch to login */}
          <View style={styles.footer}>
            <View style={styles.switchRow}>
              <Text style={styles.switchPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.switchLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLogo: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 16,
  },
  termsLink: {
    color: '#059669',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  switchPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});