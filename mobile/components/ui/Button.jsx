import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, BorderRadius, Typography, Shadows } from '../../constants';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  testID,
  style,
  textStyle,
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const variants = {
    primary: {
      bg: Colors.primary[600],
      text: Colors.white,
      border: 'transparent',
      shadow: Shadows.sm,
    },
    secondary: {
      bg: Colors.secondary[600],
      text: Colors.white,
      border: 'transparent',
      shadow: Shadows.sm,
    },
    outline: {
      bg: 'transparent',
      text: Colors.primary[600],
      border: Colors.primary[600],
      shadow: Shadows.none,
    },
    ghost: {
      bg: Colors.primary[50],
      text: Colors.primary[700],
      border: 'transparent',
      shadow: Shadows.none,
    },
    danger: {
      bg: Colors.error,
      text: Colors.white,
      border: 'transparent',
      shadow: Shadows.sm,
    },
    white: {
      bg: Colors.white,
      text: Colors.primary[700],
      border: Colors.borderSubtle,
      shadow: Shadows.sm,
    },
    social: {
      bg: Colors.white,
      text: Colors.textPrimary,
      border: Colors.border,
      shadow: Shadows.sm,
    },
  };

  const sizes = {
    sm: { paddingH: 14, fontSize: Typography.sizes.sm, height: 38 },
    md: { paddingH: 20, fontSize: Typography.sizes.base, height: 48 },
    lg: { paddingH: 24, fontSize: Typography.sizes.lg, height: 54 },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.88}
      testID={testID}
      style={[
        styles.base,
        v.shadow,
        {
          backgroundColor: disabled ? Colors.neutral[200] : v.bg,
          borderColor: v.border,
          borderWidth: (variant === 'outline' || variant === 'social' || variant === 'white') ? 1 : 0,
          borderRadius: BorderRadius.lg, // Crisp 16px radius
          paddingHorizontal: s.paddingH,
          height: s.height,
          width: fullWidth ? '100%' : undefined,
        },
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && (
            <View style={styles.iconContainer}>
              {typeof icon === 'string' ? (
                <Icon
                  name={icon}
                  size={size === 'sm' ? 16 : 18}
                  color={disabled ? Colors.neutral[400] : v.text}
                  strokeWidth={2.2}
                />
              ) : (
                icon
              )}
            </View>
          )}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? Colors.neutral[400] : v.text,
                fontSize: s.fontSize,
                fontWeight: Typography.weights.semibold,
                letterSpacing: Typography.tracking.wide,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;