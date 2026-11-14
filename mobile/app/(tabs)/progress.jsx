import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Progress Analytics 📈</Text>

        {/* Weight Loss Chart Simulation */}
        <Card style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Weight Trend (30 Days)</Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.success, fontWeight: 'bold' }}>-2.4 kg lost 🎉</Text>
          </View>

          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
            {[74.5, 74.2, 73.8, 73.5, 73.0, 72.8, 72.1].map((wt, idx) => (
              <View key={idx} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>{wt}</Text>
                <View style={{ width: 18, height: (wt - 70) * 20, backgroundColor: Colors.primary[500], borderRadius: 4 }} />
                <Text style={{ fontSize: 9, color: Colors.textSecondary }}>W{idx+1}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Habit Heatmap */}
        <Card style={{ padding: 18, gap: 12 }}>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Weekly Streak Consistency</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i < 5 ? Colors.success : Colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: i < 5 ? '#FFF' : Colors.textMuted, fontWeight: 'bold', fontSize: 12 }}>{i < 5 ? '✓' : ''}</Text>
                </View>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{day}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
