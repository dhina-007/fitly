import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  iconColor = Colors.primary[600],
  iconBg,
  progress,
  onPress,
  badge,
  badgeColor = Colors.primary[50],
  badgeTextColor = Colors.primary[700],
  style,
}) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const computedIconBg = iconBg || `${iconColor}15`;

  return (
    <CardWrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          {icon && (
            <View style={[styles.iconWrapper, { backgroundColor: computedIconBg }]}>
              <Icon name={icon} size={18} color={iconColor} strokeWidth={2.2} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      ) : null}

      {typeof progress === 'number' && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={iconColor} height={5} />
        </View>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.tracking.wide,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  value: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  unit: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
});

export default MetricCard;
