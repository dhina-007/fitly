import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../constants';

export function ProgressBar({
  progress = 0,
  color = Colors.primary[600],
  height = 6,
  backgroundColor = Colors.neutral[100],
  style,
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1) * 100, {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor,
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: color,
            borderRadius: BorderRadius.full,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

export default ProgressBar;