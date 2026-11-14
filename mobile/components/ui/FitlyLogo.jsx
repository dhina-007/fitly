import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants';

/**
 * FitlyLogo
 * Official brand identity component for Fitly.
 * Renders the aerodynamic kinetic "F" emblem with glowing pulse details,
 * customizable sizing, variants, and optional animations.
 */
export function FitlyLogo({
  size = 48,
  variant = 'icon', // 'icon' | 'horizontal' | 'vertical' | 'badge'
  showTagline = false,
  textColor,
  animated = false,
  style,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!animated) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [animated]);

  const cornerRadius = Math.round(size * 0.23); // Standard Apple/Android squircle ratio
  const titleColor = textColor || (variant === 'badge' ? '#FFFFFF' : Colors.textPrimary);

  const emblem = (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Outer ambient glow halo */}
      <Animated.View
        style={[
          styles.glowHalo,
          {
            borderRadius: cornerRadius + 4,
            opacity: glowAnim,
          },
        ]}
      />

      <Image
        source={require('../../assets/fitly-badge.png')}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: cornerRadius,
          },
        ]}
        resizeMode="cover"
      />
    </Animated.View>
  );

  if (variant === 'icon') {
    return <View style={[styles.root, style]}>{emblem}</View>;
  }

  if (variant === 'horizontal') {
    return (
      <View style={[styles.horizontalContainer, style]}>
        {emblem}
        <View style={styles.textColumn}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, { fontSize: Math.max(18, Math.round(size * 0.5)), color: titleColor }]}>
              Fitly
            </Text>
            <View style={styles.accentDot} />
          </View>
          {showTagline && (
            <Text style={[styles.tagline, { fontSize: Math.max(10, Math.round(size * 0.22)) }]}>
              Precision Health & Fitness
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Vertical layout (ideal for auth, modals, splash)
  return (
    <View style={[styles.verticalContainer, style]}>
      {emblem}
      <View style={styles.brandRow}>
        <Text style={[styles.brandText, { fontSize: Math.max(22, Math.round(size * 0.38)), color: titleColor }]}>
          Fitly
        </Text>
        <View style={[styles.accentDot, { width: 6, height: 6 }]} />
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: Math.max(11, Math.round(size * 0.18)) }]}>
          Precision Health & Fitness
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0B0F17',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glowHalo: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verticalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textColumn: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  accentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: -4,
  },
  tagline: {
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
