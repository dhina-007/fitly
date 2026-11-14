import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, profile, initialized } = useAuthStore();
  const isOnboarding = segments?.[1] === 'onboarding';

  useEffect(() => {
    if (initialized && user && profile?.onboardingCompleted && !isOnboarding) {
      router.replace('/(tabs)/home');
    }
  }, [user, profile?.onboardingCompleted, initialized, isOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}