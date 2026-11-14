import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';

export function WorkoutListItem({
  title,
  subtitle,
  duration,
  caloriesBurned,
  category = 'Strength',
  icon = 'Dumbbell',
  onPress,
  onStart,
  style,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.container, style]}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={18} color={Colors.primary[600]} strokeWidth={2.2} />
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}

        <View style={styles.detailsRow}>
          {category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          )}
          {duration && (
            <View style={styles.detailItem}>
              <Icon name="Clock" size={12} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.detailText}>{duration}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightCol}>
        {caloriesBurned !== undefined && (
          <View style={styles.calBadge}>
            <Text style={styles.calText}>{caloriesBurned}</Text>
            <Text style={styles.calUnit}>kcal</Text>
          </View>
        )}

        {onStart && (
          <TouchableOpacity
            onPress={onStart}
            style={styles.startButton}
            activeOpacity={0.8}
          >
            <Icon name="Play" size={12} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.startText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  tag: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: Typography.tracking.wide,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  calBadge: {
    alignItems: 'flex-end',
  },
  calText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[600],
  },
  calUnit: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  startText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    letterSpacing: Typography.tracking.wide,
  },
});

export default WorkoutListItem;
