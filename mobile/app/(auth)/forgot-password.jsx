import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { authService } from '../../services/auth.service';
import { useAppStore } from '../../store/appStore';
import { Button, Input } from '../../components/ui';
import { Colors, Typography } from '../../constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useAppStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      showToast({ type: 'success', title: 'Email Sent!', message: 'Check your inbox for password reset instructions.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32, marginTop: 8 }}>
            <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.base }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 24 }}>🔑</Text>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>Forgot Password?</Text>
          <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            No worries! Enter your email and we'll send you a password reset link (not an OTP). Check your Spam folder if you don't see it!
          </Text>
          {!sent ? (
            <>
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" leftIcon={<Mail size={18} color={Colors.textMuted} />} />
              <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
            </>
          ) : (
            <View style={{ backgroundColor: Colors.primary[50], borderRadius: 16, padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary[600], textAlign: 'center' }}>Email Sent!</Text>
              <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Check your inbox and follow the link to reset your password.
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold }}>Return to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}