import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, AppHeader, Icon, BottomSheet, Input, Button, DateSelector } from '../components/ui';
import { healthService } from '../services/health.service';
import { useDateStore } from '../store/dateStore';
import { useAppStore } from '../store/appStore';

const ICONS = ['Droplets', 'Footprints', 'Moon', 'Utensils', 'Sun', 'Activity', 'Heart', 'Coffee', 'Dumbbell'];
const COLORS = [...new Set([Colors.primary[600], Colors.energy[500], Colors.secondary[600], '#0284C7', Colors.warning, Colors.error])];

export default function HabitsScreen() {
  const queryClient = useQueryClient();
  const { selectedDate } = useDateStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'Droplets', color: Colors.primary[600] });

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', selectedDate],
    queryFn: () => healthService.getHabits(selectedDate),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => healthService.toggleHabit(id, selectedDate),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['dashboardAnalytics']);
      queryClient.invalidateQueries(['communities']);
      queryClient.invalidateQueries(['feedPosts']);
      if (res?.communityUpdatesCount > 0) {
        useAppStore.getState().showToast(
          `Synced task completion to ${res.communityUpdatesCount} joined ${res.communityUpdatesCount === 1 ? 'community' : 'communities'}!`,
          'success'
        );
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return healthService.updateHabit(editId, data);
      } else {
        return healthService.createHabit(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      setModalVisible(false);
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to save habit');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => healthService.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      setModalVisible(false);
      resetForm();
    },
  });

  const toggleHabit = (id) => {
    toggleMutation.mutate(id);
  };

  const openAddModal = () => {
    setIsEditing(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (habit) => {
    setIsEditing(true);
    setEditId(habit._id);
    setForm({
      name: habit.name || '',
      icon: habit.icon || 'Droplets',
      color: habit.color || Colors.primary[600],
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setForm({ name: '', icon: 'Droplets', color: Colors.primary[600] });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Habit name is required');
    saveMutation.mutate(form);
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this habit?')) {
        deleteMutation.mutate(editId);
      }
      return;
    }
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(editId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Daily Habits Tracker"
        subtitle="Consistency & streak tracking"
        showBack
        rightElement={
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn} activeOpacity={0.8}>
            <Icon name="Plus" size={18} color={Colors.primary[700]} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.dateSelectorContainer}>
        <DateSelector />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Icon name="Target" size={32} color={Colors.primary[600]} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No Habits Tracked Yet</Text>
          <Text style={styles.emptyDesc}>Build small daily routines to maintain long-term momentum.</Text>
          <Button title="Create Daily Habit" onPress={openAddModal} style={{ marginTop: Spacing.md }} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={h => h._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleHabit(item._id)}
              onLongPress={() => openEditModal(item)}
              activeOpacity={0.75}
            >
              <Card
                style={[
                  styles.habitCard,
                  item.completedToday && styles.habitCardCompleted,
                ]}
              >
                <View style={styles.habitInfo}>
                  <View style={[styles.iconBox, { backgroundColor: (item.color || Colors.primary[600]) + '18' }]}>
                    <Icon name={item.icon || 'Star'} size={20} color={item.color || Colors.primary[600]} strokeWidth={2.2} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.habitTitle, item.completedToday && styles.habitTitleDone]}>
                      {item.name}
                    </Text>
                    <View style={styles.streakRow}>
                      <Icon name="Flame" size={13} color={Colors.energy[500]} strokeWidth={2.2} />
                      <Text style={styles.streakText}>{item.currentStreak || 0} day streak</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.editIconBtn}
                  onPress={() => openEditModal(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="Edit3" size={15} color={Colors.textMuted} strokeWidth={2} />
                </TouchableOpacity>

                <View style={[styles.checkbox, item.completedToday && styles.checkboxActive]}>
                  {item.completedToday && <Icon name="Check" size={14} color={Colors.white} strokeWidth={2.8} />}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add / Edit Modal */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={isEditing ? 'Edit Habit' : 'New Habit'}
        subtitle={isEditing ? 'Update your habit settings' : 'What routine do you want to build?'}
        height={600}
      >
        <View style={styles.modalContent}>
          <Input
            label="Habit Name"
            placeholder="e.g. 2L Morning Water"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />

          <Text style={styles.sectionLabel}>Select Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setForm({ ...form, icon: i })}
                style={[
                  styles.iconSelectBtn,
                  form.icon === i && styles.iconSelectBtnActive,
                ]}
              >
                <Icon name={i} size={18} color={form.icon === i ? Colors.primary[700] : Colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Select Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c, idx) => (
              <TouchableOpacity
                key={`${c}-${idx}`}
                onPress={() => setForm({ ...form, color: c })}
                style={[styles.colorSelectBtn, { backgroundColor: c }]}
              >
                {form.color === c && <Icon name="Check" size={14} color={Colors.white} strokeWidth={2.8} />}
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={isEditing ? 'Update Habit' : 'Create Habit'}
            onPress={handleSave}
            loading={saveMutation.isPending}
            style={styles.saveBtn}
          />
          
          {isEditing && (
            <Button
              title="Delete Habit"
              variant="danger"
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              style={{ marginTop: Spacing.sm }}
            />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dateSelectorContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: Spacing.base,
    gap: Spacing.xs,
    paddingBottom: 60,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  habitCardCompleted: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  habitTitleDone: {
    color: Colors.primary[900],
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  streakText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  editIconBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalContent: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: Typography.tracking.wider,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconSelectBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelectBtnActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  colorGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  colorSelectBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: Spacing.xl,
  },
});
