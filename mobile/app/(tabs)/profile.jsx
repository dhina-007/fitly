import React, { useState, useEffect } from 'react';
import { View, Text, Image, Modal, Pressable, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { Card, BottomSheet, Input, Button, Icon, AppHeader, DateSelector, TopHeader, MaintenanceCaloriesModal } from '../../components/ui';
import { predictMaintenanceCalories } from '../../utils/calorieCalculator';
import { deviceSyncService } from '../../services/deviceSync.service';
import { healthService } from '../../services/health.service';
import { authService } from '../../services/auth.service';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useDateStore } from '../../store/dateStore';
import api from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, setProfile, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { selectedDate } = useDateStore();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'progress' | 'devices'

  // Profile Photo & Name Edit State
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);

  // Devices & Google Fit Sync State
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState({ connected: false, provider: null });
  const [lastSyncedData, setLastSyncedData] = useState(null);

  // Manual Data Entry Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSteps, setManualSteps] = useState('');
  const [manualWeight, setManualWeight] = useState('');
  const [manualWater, setManualWater] = useState('');
  const [manualSleep, setManualSleep] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);

  // Fetch Dashboard Analytics for real progress metrics
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardAnalytics', selectedDate],
    queryFn: () => healthService.getDashboardAnalytics(selectedDate),
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const status = await deviceSyncService.checkConnectionStatus();
    setConnection(status);
  };

  const handleToggleConnection = async (providerName) => {
    if (connection.connected) {
      if (connection.provider === providerName) {
        await deviceSyncService.disconnect();
        setConnection({ connected: false, provider: null });
      } else {
        Alert.alert('Notice', `Disconnect ${connection.provider} first to connect a new provider.`);
      }
    } else {
      setDeviceLoading(true);
      const res = await deviceSyncService.connect(providerName);
      if (res.success) {
        setConnection({ connected: true, provider: res.provider });
      }
      setDeviceLoading(false);
    }
  };

  const handleSyncGoogleFit = async () => {
    if (!connection.connected) return;
    setSyncing(true);
    try {
      const res = await deviceSyncService.syncTodayData();
      if (res.success) {
        setLastSyncedData(res.syncedData);
        queryClient.invalidateQueries(['dashboardAnalytics']);
        Alert.alert('Sync Successful', 'Your activity data has been updated.');
      }
    } catch (e) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveManualData = async () => {
    try {
      if (manualWater) await healthService.logWater(parseFloat(manualWater), selectedDate);
      if (manualSleep) await healthService.logSleep(parseFloat(manualSleep), 'Good', selectedDate);
      if (manualWeight) await healthService.logWeight(parseFloat(manualWeight), selectedDate);
      if (manualSteps) await healthService.logActivity(parseInt(manualSteps), Math.round(parseInt(manualSteps) * 0.04), selectedDate);

      queryClient.invalidateQueries(['dashboardAnalytics', selectedDate]);
      setManualSuccess(true);
      setTimeout(() => {
        setManualSuccess(false);
        setShowManualModal(false);
        setManualSteps('');
        setManualWeight('');
        setManualWater('');
        setManualSleep('');
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const displayName = (profile?.name && !profile?.name.toLowerCase().includes('healthfit'))
    ? profile.name
    : (user?.displayName && !user?.displayName.toLowerCase().includes('healthfit'))
    ? user.displayName
    : 'Dhina';
  const displayEmail = user?.email || profile?.email || 'dhina@fitly.app';
  const initial = (displayName.trim()[0] || 'D').toUpperCase();
  const profilePhoto = profile?.profilePhoto || user?.photoURL;

  const handlePickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.65,
        base64: true,
      };

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera access is required to take a profile picture.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Gallery access is required to choose a profile photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoModalVisible(false);
        setIsSavingPhoto(true);
        const asset = result.assets[0];
        const base64Uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        const res = await api.put('/auth/profile', { profilePhoto: base64Uri });
        const updated = res.data?.data;
        if (updated) {
          setProfile(updated);
        } else {
          setProfile({ ...(profile || {}), profilePhoto: base64Uri });
        }
        queryClient.invalidateQueries(['userProfile']);
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (err) {
      console.warn('Failed to pick profile image:', err);
      Alert.alert('Error', 'Could not update profile photo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setPhotoModalVisible(false);
      setIsSavingPhoto(true);
      const res = await api.put('/auth/profile', { profilePhoto: null });
      const updated = res.data?.data;
      if (updated) {
        setProfile(updated);
      } else {
        setProfile({ ...(profile || {}), profilePhoto: null });
      }
      queryClient.invalidateQueries(['userProfile']);
      Alert.alert('Removed', 'Profile photo removed.');
    } catch (err) {
      Alert.alert('Error', 'Could not remove photo: ' + err.message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Error', 'Please enter a valid name.');
      return;
    }
    setIsSavingName(true);
    try {
      const res = await api.put('/auth/profile', { name: nameInput.trim() });
      const updated = res.data?.data;
      if (updated) {
        setProfile(updated);
      } else {
        setProfile({ ...(profile || {}), name: nameInput.trim() });
      }
      queryClient.invalidateQueries(['userProfile']);
      setNameModalVisible(false);
      setNameInput('');
      Alert.alert('Success', 'Name updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Could not update name: ' + err.message);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Pinned Unified Top Header */}
      <TopHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* User Card with Interactive Photo Avatar */}
        <Card style={styles.userCard}>
          <View style={styles.userInfoRow}>
            {/* Interactive Profile Photo Avatar with Edit Badge */}
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(true)}
              style={styles.avatarTouchable}
              activeOpacity={0.8}
              testID="profile-avatar-edit-btn"
            >
              <View style={styles.avatar}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                <Icon name="Camera" size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                {(profile?.isAdmin || user?.isAdmin) ? (
                  <View
                    style={[styles.roleBadge, styles.roleBadgeAdmin]}
                    testID="profile-role-badge"
                  >
                    <Text style={[styles.roleBadgeText, styles.roleBadgeTextAdmin]}>
                      ADMIN
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={() => {
                    setNameInput(displayName);
                    setNameModalVisible(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  testID="edit-name-btn"
                >
                  <Icon name="Edit2" size={13} color={Colors.primary[600]} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>{displayEmail}</Text>
              <TouchableOpacity
                onPress={() => setPhotoModalVisible(true)}
                style={styles.changePhotoLink}
                activeOpacity={0.7}
              >
                <Text style={styles.changePhotoLinkText}>Set Profile Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowManualModal(true)} style={styles.addDataBtn}>
            <Icon name="Plus" size={14} color={Colors.primary[700]} />
            <Text style={styles.addDataText}>Data</Text>
          </TouchableOpacity>
        </Card>

        {/* Profile Section Tabs Header */}
        <View style={styles.tabContainer}>
          {[
            { id: 'account', label: 'Account', icon: 'User' },
            { id: 'progress', label: 'Analytics', icon: 'TrendingUp' },
            { id: 'devices', label: 'Sync', icon: 'Smartphone' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabBtn,
                activeTab === tab.id && styles.tabBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Icon name={tab.icon} size={16} color={activeTab === tab.id ? Colors.primary[600] : Colors.textSecondary} />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB 1: ACCOUNT & FEATURES */}
        {activeTab === 'account' && (
          <View style={styles.tabContent}>
            {/* Body Stats & Auto-Predicted Maintenance Calories Card */}
            <Card style={styles.maintenanceCard}>
              <View style={styles.maintenanceHeader}>
                <View style={styles.maintenanceIconBox}>
                  <Icon name="Flame" size={18} color={Colors.primary[600]} strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.maintenanceCardTitle}>Maintenance Calories</Text>
                    <View
                      style={[
                        styles.mcModePill,
                        profile?.isCustomMaintenance ? styles.mcModePillCustom : styles.mcModePillAuto,
                      ]}
                    >
                      <Text
                        style={[
                          styles.mcModePillText,
                          profile?.isCustomMaintenance ? styles.mcModePillTextCustom : styles.mcModePillTextAuto,
                        ]}
                      >
                        {profile?.isCustomMaintenance ? 'EDITED' : 'AUTO-PREDICTED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.maintenanceCardValue}>
                    {(
                      profile?.tdee ||
                      predictMaintenanceCalories({
                        weight: profile?.currentWeight || 71,
                        height: profile?.height || 173,
                        age: profile?.age || 26,
                        gender: profile?.gender || 'male',
                        activityLevel: profile?.activityLevel || 'moderately_active',
                        fitnessGoal: profile?.fitnessGoal || 'maintenance',
                      })?.maintenanceCalories ||
                      profile?.calorieTarget ||
                      2200
                    ).toLocaleString()}{' '}
                    kcal / day
                  </Text>
                  <Text style={styles.maintenanceCardMeta}>
                    {profile?.currentWeight || 71} kg • {profile?.height || 173} cm • {profile?.age || 26} yrs
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMaintenanceModalVisible(true)}
                  style={styles.mcEditBtn}
                  testID="profile-maintenance-edit-btn"
                >
                  <Icon name="Edit2" size={14} color={Colors.primary[700]} strokeWidth={2.3} />
                  <Text style={styles.mcEditBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Quick Feature Links */}
            <Card style={styles.linksCard}>
              {[
                { title: 'Ria AI Health Coach', icon: 'Bot', action: () => router.push('/ai-coach') },
                { title: 'Intermittent Fasting Timer', icon: 'Timer', action: () => router.push('/fasting') },
                { title: 'Healthy Recipe Library', icon: 'ChefHat', action: () => router.push('/recipes') },
                { title: 'Daily Habits Tracker', icon: 'Zap', action: () => router.push('/habits') },
                { title: 'Community & Challenges', icon: 'Users', action: () => router.push('/community') },
                { title: 'Privacy Policy & Terms', icon: 'Shield', action: () => router.push('/privacy-policy') },
              ].map((item, index, arr) => (
                <TouchableOpacity
                  key={item.title}
                  onPress={item.action}
                  style={[
                    styles.linkItem,
                    index === arr.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.linkInfo}>
                    <View style={styles.linkIconWrapper}>
                      <Icon name={item.icon} size={18} color={Colors.primary[600]} />
                    </View>
                    <Text style={styles.linkText}>{item.title}</Text>
                  </View>
                  <Icon name="ChevronRight" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>

            <Button
              title="Log Out"
              onPress={async () => {
                queryClient.clear();
                await authService.logout().catch(() => {});
                logout();
                router.replace('/(auth)/login');
              }}
              variant="outline"
              style={styles.logoutBtn}
              textStyle={{ color: Colors.error, fontWeight: Typography.weights.bold }}
              testID="logout-btn"
            />
          </View>
        )}

        {/* TAB 2: PROGRESSIVE ANALYTICS */}
        {activeTab === 'progress' && (
          <View style={styles.tabContent}>
            {/* Weight Loss Chart Simulation */}
            <Card style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Weight Progress (30 Days)</Text>
                <View style={styles.badgeSuccess}>
                  <Text style={styles.badgeSuccessText}>-2.4 kg lost</Text>
                </View>
              </View>

              <View style={styles.chartMock}>
                {[74.5, 74.2, 73.8, 73.5, 73.0, 72.8, 72.1].map((wt, idx) => (
                  <View key={idx} style={styles.barItem}>
                    <Text style={styles.barVal}>{wt}</Text>
                    <View style={[styles.barFill, { height: (wt - 70) * 20 }]} />
                    <Text style={styles.barLabel}>W{idx+1}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Weekly Habit Consistency */}
            <Card style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Weekly Goal Consistency</Text>
              <View style={styles.daysRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <View key={day} style={styles.dayItem}>
                    <View style={[styles.dayCircle, i < 5 ? styles.dayCircleActive : styles.dayCircleInactive]}>
                      {i < 5 && <Icon name="Check" size={16} color={Colors.white} />}
                    </View>
                    <Text style={styles.dayLabel}>{day}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.manualEntryPromo}>
              <View style={styles.promoIcon}>
                <Icon name="Edit3" size={24} color={Colors.primary[600]} />
              </View>
              <Text style={styles.promoTitle}>Daily Health Tracker</Text>
              <Text style={styles.promoDesc}>Update your daily steps, water, sleep, or weight anytime.</Text>
              <Button
                title="Update Tracker"
                onPress={() => setShowManualModal(true)}
                size="sm"
                style={styles.promoBtn}
              />
            </Card>
          </View>
        )}

        {/* TAB 3: DEVICE SYNC */}
        {activeTab === 'devices' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionTitleCont}>
              <Text style={styles.sectionTitle}>Sync Health Data</Text>
              <Text style={styles.sectionSubtitle}>
                Automatically import your daily steps, active calories, and sleep from your device.
              </Text>
            </View>

            <Card style={styles.syncCard}>
              {/* Google Fit Connection */}
              <View style={styles.syncItemRow}>
                <View style={styles.syncItemInfo}>
                  <View style={styles.syncIconWrap}>
                    <Icon name="Activity" size={20} color={Colors.primary[600]} />
                  </View>
                  <View>
                    <Text style={styles.syncItemTitle}>Google Fit</Text>
                    <Text style={styles.syncItemDesc}>Syncs Android & WearOS</Text>
                  </View>
                </View>
                <Switch 
                  value={connection.connected && connection.provider === 'Google Fit'}
                  onValueChange={() => handleToggleConnection('Google Fit')}
                  trackColor={{ false: Colors.neutral[200], true: Colors.primary[600] }}
                />
              </View>

              <View style={styles.syncDivider} />

              {/* Apple Health Connection */}
              <View style={styles.syncItemRow}>
                <View style={styles.syncItemInfo}>
                  <View style={styles.syncIconWrap}>
                    <Icon name="Heart" size={20} color={Colors.error} />
                  </View>
                  <View>
                    <Text style={styles.syncItemTitle}>Apple Health</Text>
                    <Text style={styles.syncItemDesc}>Syncs iPhone & Apple Watch</Text>
                  </View>
                </View>
                <Switch 
                  value={connection.connected && connection.provider === 'Apple Health'}
                  onValueChange={() => handleToggleConnection('Apple Health')}
                  trackColor={{ false: Colors.neutral[200], true: Colors.primary[600] }}
                />
              </View>
            </Card>

            {connection.connected ? (
              <Card style={styles.activeSyncCard}>
                <Text style={styles.activeSyncTitle}>
                  Connected to {connection.provider}
                </Text>
                
                <Button
                  title={syncing ? 'Syncing...' : 'Sync Data Now'}
                  onPress={handleSyncGoogleFit}
                  disabled={syncing}
                  icon={<Icon name="RefreshCw" size={16} color={Colors.white} />}
                />

                {lastSyncedData && (
                  <View style={styles.lastSyncInfo}>
                    <Text style={styles.lastSyncLabel}>Latest Synced Entry:</Text>
                    <Text style={styles.lastSyncData}>
                      {lastSyncedData.steps.toLocaleString()} steps • {lastSyncedData.activeCalories} kcal • {lastSyncedData.sleepHours} hrs sleep
                    </Text>
                  </View>
                )}
              </Card>
            ) : (
              <Card style={styles.noSyncCard}>
                <Text style={styles.noSyncTitle}>No device connected?</Text>
                <Text style={styles.noSyncDesc}>You can manually record your daily steps, weight, sleep, and water intake.</Text>
                <Button
                  title="Manually Add Data"
                  onPress={() => setShowManualModal(true)}
                  variant="outline"
                  size="sm"
                  style={styles.noSyncBtn}
                />
              </Card>
            )}
          </View>
        )}
        
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Manual Data Entry Modal */}
      <BottomSheet
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Daily Health Update"
        subtitle="Update your steps, water, sleep & weight"
        height={550}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          <View style={styles.inputRow}>
            <Input
              label="Steps"
              value={manualSteps}
              onChangeText={setManualSteps}
              placeholder="e.g. 8500"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Weight (kg)"
              value={manualWeight}
              onChangeText={setManualWeight}
              placeholder="e.g. 70"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Input
              label="Water (ml)"
              value={manualWater}
              onChangeText={setManualWater}
              placeholder="e.g. 2000"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Sleep (hrs)"
              value={manualSleep}
              onChangeText={setManualSleep}
              placeholder="e.g. 7.5"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>
          
          <Button
            title={manualSuccess ? '✓ Daily Data Updated!' : 'Save Health Entry'}
            onPress={handleSaveManualData}
            style={[{ marginTop: Spacing.sm }, manualSuccess && { backgroundColor: Colors.success }]}
          />
        </ScrollView>
      </BottomSheet>

      {/* Profile Photo Options Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPhotoModalVisible(false)}>
          <Pressable style={styles.photoModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.photoModalHeader}>
              <View>
                <Text style={styles.photoModalTitle}>Profile Photo</Text>
                <Text style={styles.photoModalSubtitle}>Choose where to take or select your photo</Text>
              </View>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="X" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.photoOptionsList}>
              <TouchableOpacity
                style={styles.photoOptionBtn}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.8}
                testID="pick-camera-btn"
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="Camera" size={20} color="#059669" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.photoOptionTitle}>Take Photo</Text>
                  <Text style={styles.photoOptionDesc}>Capture using device camera</Text>
                </View>
                <Icon name="ChevronRight" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOptionBtn}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.8}
                testID="pick-gallery-btn"
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Icon name="Image" size={20} color="#2563EB" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.photoOptionTitle}>Choose from Gallery</Text>
                  <Text style={styles.photoOptionDesc}>Select from photos library</Text>
                </View>
                <Icon name="ChevronRight" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {profilePhoto && (
                <TouchableOpacity
                  style={[styles.photoOptionBtn, { borderBottomWidth: 0 }]}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.8}
                >
                  <View style={[styles.photoOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Icon name="Trash2" size={20} color="#DC2626" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.photoOptionTitle, { color: '#DC2626' }]}>Remove Photo</Text>
                    <Text style={styles.photoOptionDesc}>Revert to initial letter avatar</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Inline Name Edit Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setNameModalVisible(false)}>
          <Pressable style={styles.nameModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.nameModalTitle}>Edit Your Name</Text>
            <Input
              label="Full Name"
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Dhina"
              autoFocus
            />
            <View style={styles.nameModalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setNameModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={isSavingName ? 'Saving...' : 'Save Name'}
                onPress={handleSaveName}
                loading={isSavingName}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <MaintenanceCaloriesModal
        visible={maintenanceModalVisible}
        onClose={() => setMaintenanceModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  userCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  userDetails: {
    flex: 1,
    paddingLeft: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeAdmin: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  roleBadgeMember: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  roleBadgeTextAdmin: {
    color: '#4338CA',
  },
  roleBadgeTextMember: {
    color: '#047857',
  },
  userName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  changePhotoLink: {
    marginTop: 4,
  },
  changePhotoLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  addDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  addDataText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
  },
  tabContent: {
    gap: Spacing.md,
  },
  linksCard: {
    padding: 0,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  analyticsCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  badgeSuccess: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeSuccessText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: Typography.weights.bold,
  },
  chartMock: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  barItem: {
    alignItems: 'center',
    gap: 4,
  },
  barVal: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  barFill: {
    width: 18,
    backgroundColor: Colors.primary[500],
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: Colors.success,
  },
  dayCircleInactive: {
    backgroundColor: Colors.neutral[200],
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  manualEntryPromo: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[900],
  },
  promoDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  promoBtn: {
    marginTop: 4,
  },
  sectionTitleCont: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  syncCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  syncItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  syncIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncItemTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  syncItemDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  syncDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  activeSyncCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
  },
  activeSyncTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[800],
  },
  lastSyncInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  lastSyncLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  lastSyncData: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  noSyncCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral[50],
  },
  noSyncTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  noSyncDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  noSyncBtn: {
    backgroundColor: Colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  photoModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionsList: {
    marginTop: 16,
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  photoOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoOptionDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  nameModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  maintenanceCard: {
    padding: Spacing.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  maintenanceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  mcModePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  mcModePillAuto: {
    backgroundColor: '#DCFCE7',
  },
  mcModePillCustom: {
    backgroundColor: '#FEF3C7',
  },
  mcModePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  mcModePillTextAuto: {
    color: '#047857',
  },
  mcModePillTextCustom: {
    color: '#B45309',
  },
  maintenanceCardValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: '#065F46',
    marginTop: 2,
  },
  maintenanceCardMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  mcEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  mcEditBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.primary[700],
  },
});
