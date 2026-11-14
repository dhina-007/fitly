import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';
import { deviceSyncService } from '../../services/deviceSync.service';
import { useQueryClient } from '@tanstack/react-query';

export default function DevicesScreen() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState({ connected: false, provider: null });
  const [lastSyncedData, setLastSyncedData] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const status = await deviceSyncService.checkConnectionStatus();
    setConnection(status);
    setLoading(false);
  };

  const handleToggleConnection = async (providerName) => {
    if (connection.connected) {
      if (connection.provider === providerName) {
        // Disconnect
        await deviceSyncService.disconnect();
        setConnection({ connected: false, provider: null });
      } else {
        Alert.alert('Notice', `Disconnect ${connection.provider} first to connect a new provider.`);
      }
    } else {
      // Connect
      setLoading(true);
      const res = await deviceSyncService.connect(providerName);
      if (res.success) {
        setConnection({ connected: true, provider: res.provider });
      }
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!connection.connected) return;
    setSyncing(true);
    try {
      const res = await deviceSyncService.syncTodayData();
      if (res.success) {
        setLastSyncedData(res.syncedData);
        // Invalidate dashboard query to trigger refresh
        queryClient.invalidateQueries(['dashboardAnalytics']);
        Alert.alert('Sync Successful', 'Your steps and sleep have been updated on the dashboard.');
      }
    } catch (e) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <View>
          <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Connected Devices</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 }}>
            Sync your health data automatically from your smartwatch or phone.
          </Text>
        </View>

        {/* Warning about mock mode */}
        <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}>
          <Text style={{ fontSize: Typography.sizes.xs, color: '#92400E', fontWeight: 'bold' }}>🧪 Development Mode</Text>
          <Text style={{ fontSize: Typography.sizes.xs, color: '#B45309', marginTop: 4 }}>
            Native OS Health connections require a standalone native build. Currently using Mock Sync Mode to demonstrate the flow.
          </Text>
        </View>

        <Card style={{ padding: 16, gap: 16 }}>
          {/* Apple Health */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>❤️</Text>
              </View>
              <View>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: 'bold', color: Colors.textPrimary }}>Apple Health</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted }}>Syncs Apple Watch & iPhone</Text>
              </View>
            </View>
            <Switch 
              value={connection.connected && connection.provider === 'Apple Health'}
              onValueChange={() => handleToggleConnection('Apple Health')}
              trackColor={{ false: '#E5E7EB', true: Colors.primary[600] }}
            />
          </View>

          <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

          {/* Google Fit / Health Connect */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>💪</Text>
              </View>
              <View>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: 'bold', color: Colors.textPrimary }}>Google Fit</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted }}>Syncs WearOS & Android</Text>
              </View>
            </View>
            <Switch 
              value={connection.connected && connection.provider === 'Google Fit'}
              onValueChange={() => handleToggleConnection('Google Fit')}
              trackColor={{ false: '#E5E7EB', true: Colors.primary[600] }}
            />
          </View>
        </Card>

        {connection.connected && (
          <Card style={{ padding: 18, alignItems: 'center', gap: 12, backgroundColor: Colors.primary[50], borderColor: Colors.primary[200], borderWidth: 1 }}>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: 'bold', color: Colors.primary[800] }}>
              Connected to {connection.provider}
            </Text>
            
            <TouchableOpacity 
              onPress={handleSync}
              disabled={syncing}
              style={{
                backgroundColor: Colors.primary[600],
                paddingVertical: 12,
                paddingHorizontal: 32,
                borderRadius: 24,
                opacity: syncing ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
              }}
            >
              {syncing && <ActivityIndicator size="small" color="#FFF" />}
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.base }}>
                {syncing ? 'Syncing...' : 'Force Sync Now'}
              </Text>
            </TouchableOpacity>

            {lastSyncedData && (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>Last sync pulled:</Text>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.textPrimary }}>
                  {lastSyncedData.steps.toLocaleString()} steps • {lastSyncedData.activeCalories} kcal • {lastSyncedData.sleepHours} hrs sleep
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
