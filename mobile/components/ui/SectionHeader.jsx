import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Colors, Typography, Spacing } from '../../constants';

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = 'ChevronRight',
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          {actionIcon && <Icon name={actionIcon} size={14} color={Colors.primary[600]} strokeWidth={2.5} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[600],
    letterSpacing: Typography.tracking.wide,
  },
});

export default SectionHeader;
