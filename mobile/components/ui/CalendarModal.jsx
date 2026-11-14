import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '../../constants';
import { Icon } from './Icon';
import { useDateStore } from '../../store/dateStore';

const { width } = Dimensions.get('window');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarModal({ visible, onClose }) {
  const { selectedDate, setSelectedDate, resetToToday } = useDateStore();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Current viewed month and year (defaults to selectedDate or today)
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Sync viewed month when modal opens or selectedDate changes
  useEffect(() => {
    if (visible && selectedDate) {
      const parts = selectedDate.split('-');
      setViewDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
    }
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigate to previous month (allows seeing preview/previous month data)
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calculate calendar days for viewed month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate(); // days in month
    const prevMonthDays = new Date(year, month, 0).getDate(); // days in prev month

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNum: d,
        dateStr: prevDateStr,
        isCurrentMonth: false,
        isToday: prevDateStr === todayStr,
        isSelected: prevDateStr === selectedDate,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      // Format as YYYY-MM-DD
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Trailing days to fill 5 or 6 rows (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNum: d,
        dateStr: nextDateStr,
        isCurrentMonth: false,
        isToday: nextDateStr === todayStr,
        isSelected: nextDateStr === selectedDate,
      });
    }

    return days;
  }, [year, month, todayStr, selectedDate]);

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    if (onClose) onClose();
  };

  const formattedSelected = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Monthly Calendar</Text>
              <Text style={styles.subtitle}>Select any date to view telemetry & history</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              testID="close-calendar-modal-btn"
            >
              <Icon name="X" size={18} color="#64748B" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Month Navigation Control */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navBtn}
              activeOpacity={0.7}
              testID="calendar-prev-month-btn"
            >
              <Icon name="ChevronLeft" size={18} color="#0F172A" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.monthLabelContainer}>
              <Text style={styles.monthLabel}>{monthName}</Text>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navBtn}
              activeOpacity={0.7}
              testID="calendar-next-month-btn"
            >
              <Icon name="ChevronRight" size={18} color="#0F172A" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Weekday Names Header */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w, idx) => (
              <View key={idx} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{w}</Text>
              </View>
            ))}
          </View>

          {/* Monthly Calendar Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelectDate(item.dateStr)}
                style={[
                  styles.dayCell,
                  item.isSelected && styles.dayCellSelected,
                  item.isToday && !item.isSelected && styles.dayCellToday,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNumText,
                    !item.isCurrentMonth && styles.dayNumTextOutside,
                    item.isToday && styles.dayNumTextToday,
                    item.isSelected && styles.dayNumTextSelected,
                  ]}
                >
                  {item.dayNum}
                </Text>
                {/* Active day indicator dot */}
                {item.isSelected && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Date & Quick Actions Footer */}
          <View style={styles.footerRow}>
            <View style={styles.selectedDateBadge}>
              <Icon name="Calendar" size={14} color="#059669" />
              <Text style={styles.selectedDateText}>{formattedSelected}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                resetToToday();
                if (onClose) onClose();
              }}
              style={styles.todayBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: Math.min(width - 32, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthLabelContainer: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 20,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayNumTextOutside: {
    color: '#CBD5E1',
    fontWeight: '400',
  },
  dayNumTextToday: {
    color: '#059669',
    fontWeight: '700',
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  selectedDateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  todayBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
