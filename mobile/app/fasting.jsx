import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, ProgressRing, AppHeader, Icon, Button } from '../components/ui';
import { healthService } from '../services/health.service';

export default function FastingScreen() {
  const router = useRouter();
  const [isFasting, setIsFasting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [targetHours, setTargetHours] = useState(16); // 16:8 protocol
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await healthService.getFastingStatus();
      if (data) {
        setIsFasting(Boolean(data.isFasting));
        if (data.targetHours) setTargetHours(data.targetHours);
        if (data.elapsedSeconds) setSeconds(data.elapsedSeconds);
      }
    } catch (err) {
      console.warn('Error loading fasting status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isFasting) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFasting]);

  const handleToggleFast = async () => {
    setActionLoading(true);
    try {
      if (isFasting) {
        await healthService.endFast();
        setIsFasting(false);
        setSeconds(0);
      } else {
        const protocol = `${targetHours}:${24 - targetHours}`;
        const res = await healthService.startFast(targetHours, protocol);
        setIsFasting(true);
        setSeconds(0);
      }
    } catch (err) {
      console.warn('Fasting toggle error:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const hoursElapsed = Math.floor(seconds / 3600);
  const minsElapsed = Math.floor((seconds % 3600) / 60);
  const secsElapsed = seconds % 60;
  const progressRatio = Math.min(1, seconds / (targetHours * 3600));

  const getStage = (h) => {
    if (h < 4) return { title: 'Anabolic Phase', desc: 'Blood sugar & insulin levels normalising.', icon: 'ArrowDown' };
    if (h < 12) return { title: 'Catabolic Phase', desc: 'Glycogen depleting, body transitioning to fat burn.', icon: 'Battery' };
    if (h < 18) return { title: 'Ketosis Fat-Burn Zone', desc: 'Fatty acids breaking down into ketones for energy.', icon: 'Flame' };
    return { title: 'Autophagy & Cell Renewal', desc: 'Old damaged cells being recycled & repaired.', icon: 'Sparkles' };
  };

  const currentStage = getStage(hoursElapsed);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <AppHeader
        title="Fasting Tracker"
        showBack
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Protocol Switcher */}
          <Card style={styles.protocolCard}>
            <View style={styles.protocolInfo}>
              <Text style={styles.protocolTitle}>Intermittent Fasting</Text>
              <Text style={styles.protocolSubtitle}>{targetHours}:{24 - targetHours} Protocol (Synced with cloud)</Text>
            </View>
            <View style={styles.protocolOptions}>
              {[14, 16, 18].map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => !isFasting && setTargetHours(h)}
                  disabled={isFasting}
                  style={[styles.protocolBtn, targetHours === h && styles.protocolBtnActive, isFasting && { opacity: 0.7 }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.protocolBtnText, targetHours === h && styles.protocolBtnTextActive]}>
                    {h}:{24-h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Circular Fasting Timer */}
          <Card style={styles.timerCard}>
            <ProgressRing
              size={220}
              strokeWidth={16}
              progress={isFasting ? progressRatio : 0}
              color={Colors.accent[500]}
              label={`${String(hoursElapsed).padStart(2, '0')}:${String(minsElapsed).padStart(2, '0')}:${String(secsElapsed).padStart(2, '0')}`}
              sublabel={isFasting ? `${targetHours} Hours Target` : 'Ready to Start'}
            />

            <Button
              title={isFasting ? 'End Fast' : 'Start Fasting Now'}
              onPress={handleToggleFast}
              loading={actionLoading}
              variant={isFasting ? 'danger' : 'primary'}
              style={styles.actionBtn}
            />
          </Card>

          {/* Current Fasting Stage */}
          <Card style={styles.stageCard}>
            <View style={styles.stageIconWrap}>
              <Icon name={currentStage.icon} size={24} color={Colors.primary[600]} />
            </View>
            <View style={styles.stageInfo}>
              <Text style={styles.stageTitle}>Stage: {currentStage.title}</Text>
              <Text style={styles.stageDesc}>{currentStage.desc}</Text>
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  protocolCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  protocolSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  protocolOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  protocolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
  },
  protocolBtnActive: {
    backgroundColor: Colors.primary[600],
    ...Shadows.sm,
  },
  protocolBtnText: {
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.xs,
  },
  protocolBtnTextActive: {
    color: Colors.white,
  },
  timerCard: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.xl,
  },
  actionBtn: {
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[600],
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageInfo: {
    flex: 1,
  },
  stageTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[900],
    marginBottom: 2,
  },
  stageDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[800],
    lineHeight: 18,
  },
});
