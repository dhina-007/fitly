import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants';

export function Card({
  children,
  style,
  padding = 16,
  shadow = 'sm',
  rounded = 'xl',
  variant = 'default', // 'default' | 'flat' | 'highlight' | 'dark'
}) {
  const shadowStyles = {
    none: Shadows.none,
    sm: Shadows.sm,
    md: Shadows.md,
    lg: Shadows.lg,
  };

  const roundedMap = {
    sm: BorderRadius.sm,
    md: BorderRadius.md,
    lg: BorderRadius.lg,
    xl: BorderRadius.xl,
    '2xl': BorderRadius['2xl'],
  };

  const variantStyles = {
    default: {
      backgroundColor: Colors.surface,
      borderColor: Colors.borderSubtle,
      borderWidth: 1,
    },
    flat: {
      backgroundColor: Colors.surfaceSubtle,
      borderColor: Colors.border,
      borderWidth: 1,
    },
    highlight: {
      backgroundColor: Colors.primary[50],
      borderColor: Colors.primary[200],
      borderWidth: 1,
    },
    dark: {
      backgroundColor: Colors.surfaceDark,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    },
  };

  const selectedVariant = variantStyles[variant] || variantStyles.default;

  return (
    <View
      style={[
        styles.base,
        selectedVariant,
        {
          borderRadius: roundedMap[rounded] || BorderRadius.xl,
          padding,
          ...(variant === 'dark' ? Shadows.none : (shadowStyles[shadow] || Shadows.sm)),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export default Card;