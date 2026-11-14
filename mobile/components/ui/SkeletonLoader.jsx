import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../constants';

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = BorderRadius.md, style }) {
  const opacity = useSharedValue(1);
  useEffect(() => { opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })), -1, false); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, backgroundColor: Colors.neutral[200], borderRadius }, animStyle, style]} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <View style={{ padding: 16, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, ...require('../../constants').Shadows.md }}>
      <SkeletonLoader height={20} width="60%" style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} height={12} width={i === lines - 1 ? '40%' : '100%'} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}