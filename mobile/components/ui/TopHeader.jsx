import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { CalendarModal } from './CalendarModal';
import { useAuthStore } from '../../store/authStore';

/**
 * TopHeader
 * Standardized unified top header across all app tabs.
 * Left: Profile circle [ D / Photo ] + Page title (e.g. "Fitly", "Weight tracker", "Workouts")
 * Right: Circular Calendar button [ 📅 ] + Circular Community button [ 💬 ]
 */
export function TopHeader({
  title = 'Fitly',
  showProfile = true,
  showCalendar = true,
  showCommunity = true,
  onCalendarPress,
  style,
}) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Compute profile photo and dynamic user initial
  const profilePhoto = profile?.profilePhoto || user?.photoURL;
  const rawName = (profile?.name && !profile?.name.toLowerCase().includes('healthfit'))
    ? profile.name
    : (user?.displayName && !user?.displayName.toLowerCase().includes('healthfit'))
    ? user.displayName
    : (user?.email && !user?.email.toLowerCase().includes('healthfit'))
    ? user.email.split('@')[0]
    : 'Dhina';
  const initial = (rawName.trim()[0] || 'D').toUpperCase();

  const handleOpenCalendar = () => {
    if (onCalendarPress) {
      onCalendarPress();
    } else {
      setCalendarVisible(true);
    }
  };

  const isBrandTitle = title === 'Fitly';

  return (
    <>
      <View style={[styles.headerContainer, style]}>
        {/* Left Section: Profile Avatar Circle + Title Text */}
        <View style={styles.leftRow}>
          {showProfile && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.profileAvatarBtn}
              activeOpacity={0.8}
              testID="top-profile-btn"
            >
              <View style={styles.profileAvatarCircle}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profileAvatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Title Text */}
          <View style={styles.titleWrap}>
            {isBrandTitle ? (
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandText}>Fitly</Text>
                <View style={styles.brandDot} />
              </View>
            ) : (
              <Text style={styles.pageTitle} numberOfLines={1}>
                {title}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section: Circular Calendar & Community Buttons */}
        <View style={styles.rightActionsRow}>
          {showCalendar && (
            <TouchableOpacity
              onPress={handleOpenCalendar}
              style={styles.headerIconBtn}
              activeOpacity={0.8}
              testID="top-calendar-btn"
            >
              <Icon name="Calendar" size={18} color="#059669" strokeWidth={2.3} />
            </TouchableOpacity>
          )}

          {showCommunity && (
            <TouchableOpacity
              onPress={() => router.push('/community')}
              style={styles.headerIconBtn}
              activeOpacity={0.8}
              testID="top-community-btn"
            >
              <Icon name="MessageCircle" size={18} color="#059669" strokeWidth={2.3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Built-in Monthly Calendar Modal */}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileAvatarBtn: {
    padding: 2,
  },
  profileAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  titleWrap: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: -8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
