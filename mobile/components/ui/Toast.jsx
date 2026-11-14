import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Typography } from '../../constants';
import { useAppStore } from '../../store/appStore';

export function ToastContainer() {
  const { toast, hideToast } = useAppStore();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(hideToast, 300);
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: opacity.value }));
  if (!toast) return null;

  const bgColors = { success: Colors.success, error: Colors.error, info: Colors.secondary[500], warning: Colors.warning };
  return (
    <Animated.View style={[animStyle, { position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: bgColors[toast.type] || Colors.primary[500], borderRadius: BorderRadius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', zIndex: 9999, ...Shadows.lg }]}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</Text>
      <View style={{ flex: 1 }}>
        {toast.title && <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.white, marginBottom: 2 }}>{toast.title}</Text>}
        <Text style={{ fontSize: Typography.sizes.sm, color: Colors.white, opacity: 0.9 }}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}