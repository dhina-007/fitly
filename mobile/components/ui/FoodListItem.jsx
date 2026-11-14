import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';

export function FoodListItem({
  item,
  onPress,
  onAdd,
  onDelete,
  showAdd = false,
  showDelete = false,
  servingText,
  style,
}) {
  if (!item) return null;

  const name = item.displayName || item.name || item.foodName || item.canonicalName || 'Food Item';
  const nameTa = item.nameTa || item.tamilName || item.regionalNames?.ta?.[0] || '';
  const calories = item.calories ?? item.nutrients?.calories ?? 0;
  const protein = item.protein ?? item.nutrients?.protein ?? 0;
  const carbs = item.carbs ?? item.nutrients?.carbs ?? 0;
  const fat = item.fat ?? item.nutrients?.fat ?? 0;
  const serving = servingText || item.servingSize || (item.quantity ? `${item.quantity} ${item.unit || 'g'}` : '1 serving');

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.container, style]}
    >
      <View style={styles.iconBox}>
        <Icon name="Utensils" size={16} color={Colors.primary[600]} strokeWidth={2.2} />
      </View>

      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {nameTa ? <Text style={styles.nameTa} numberOfLines={1}>({nameTa})</Text> : null}
        </View>

        <Text style={styles.serving} numberOfLines={1}>{serving}</Text>

        <View style={styles.macroRow}>
          <Text style={styles.macroTag}>
            <Text style={styles.macroVal}>{protein}g</Text> P
          </Text>
          <Text style={styles.macroDot}>•</Text>
          <Text style={styles.macroTag}>
            <Text style={styles.macroVal}>{carbs}g</Text> C
          </Text>
          <Text style={styles.macroDot}>•</Text>
          <Text style={styles.macroTag}>
            <Text style={styles.macroVal}>{fat}g</Text> F
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <View style={styles.calBadge}>
          <Text style={styles.calText}>{Math.round(calories)}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>

        {showAdd && onAdd && (
          <TouchableOpacity
            onPress={onAdd}
            style={styles.addButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="Plus" size={16} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="Trash2" size={14} color={Colors.error} strokeWidth={2} />
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
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  nameTa: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
  },
  serving: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  macroTag: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  macroVal: {
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  macroDot: {
    fontSize: 10,
    color: Colors.neutral[300],
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
    fontWeight: Typography.weights.extrabold,
    color: Colors.primary[700],
    letterSpacing: Typography.tracking.tight,
  },
  calUnit: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  addButton: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});

export default FoodListItem;
