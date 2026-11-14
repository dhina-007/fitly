import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { Colors, Shadows } from '../../constants';
import { Icon } from './Icon';
import { useAuthStore } from '../../store/authStore';

export function FloatingAICoachButton() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { user, isAuthenticated } = useAuthStore();

  // Do not show if user is not authenticated
  if (!isAuthenticated && !user) {
    return null;
  }

  // Determine current screen from segments and pathname
  const currentFirstSegment = segments?.[0] || '';
  const currentPath = pathname || '';

  // Hide on auth screens, splash screen, or when ALREADY in the AI Coach screen
  if (
    currentFirstSegment === '(auth)' ||
    currentFirstSegment === 'ai-coach' ||
    currentPath === '/ai-coach' ||
    currentPath === '/' ||
    currentPath === '/index' ||
    currentFirstSegment === 'index'
  ) {
    return null;
  }

  // Check if current screen is inside main tabs (which has a bottom tab bar)
  const isTabScreen =
    currentFirstSegment === '(tabs)' ||
    currentPath === '/home' ||
    currentPath === '/measure' ||
    currentPath === '/workout' ||
    currentPath === '/profile';

  // Bottom position: above the tab bar on tabs, or near bottom-right on subpages
  const bottomPosition = isTabScreen
    ? Platform.OS === 'ios' ? 104 : 84
    : currentPath.includes('food-search') ? 88 : 28;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: bottomPosition },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push('/ai-coach')}
        activeOpacity={0.85}
        style={styles.floatingButton}
        testID="floating-ai-coach-btn"
        accessibilityLabel="Chat with Ria AI Coach"
      >
        <Icon name="Bot" size={26} color="#FFFFFF" strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default FloatingAICoachButton;
