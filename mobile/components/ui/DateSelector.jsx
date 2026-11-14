import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { useDateStore } from '../../store/dateStore';

export function DateSelector({ style }) {
  const { selectedDate, setSelectedDate, resetToToday } = useDateStore();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    if (d.toISOString().split('T')[0] > today) return;
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const getDisplayText = () => {
    if (isToday) return 'Today';
    
    const d = new Date(selectedDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        testID="prev-date-btn"
        onPress={handlePrevDay}
        style={styles.navBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="ChevronLeft" size={16} color={Colors.textSecondary} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity
        testID="today-date-chip"
        onPress={resetToToday}
        style={[styles.dateChip, isToday && styles.dateChipToday]}
        activeOpacity={0.8}
      >
        <Icon
          name="Calendar"
          size={14}
          color={isToday ? Colors.primary[600] : Colors.textSecondary}
          strokeWidth={2.2}
        />
        <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
          {getDisplayText()}
        </Text>
        {isToday && <View style={styles.todayDot} />}
      </TouchableOpacity>

      <TouchableOpacity
        testID="next-date-btn"
        onPress={handleNextDay}
        disabled={isToday}
        style={[styles.navBtn, isToday && styles.navBtnDisabled]}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name="ChevronRight"
          size={16}
          color={isToday ? Colors.neutral[300] : Colors.textSecondary}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
    alignSelf: 'flex-start',
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dateChipToday: {
    backgroundColor: Colors.primary[50],
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: Typography.tracking.wide,
  },
  dateTextToday: {
    color: Colors.primary[700],
    fontWeight: Typography.weights.bold,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary[600],
    marginLeft: 2,
  },
});

export default DateSelector;
