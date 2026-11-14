import { Tabs } from 'expo-router';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/ui';

function TabIcon({ iconName, label, focused }) {
  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.08 : 1, { damping: 14, stiffness: 180 }) }],
      opacity: withSpring(focused ? 1 : 0.65),
    };
  });

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <Icon
        name={iconName}
        size={22}
        color={focused ? Colors.primary[600] : Colors.textMuted}
        strokeWidth={focused ? 2.5 : 1.8}
      />
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? Colors.primary[600] : Colors.textMuted,
            fontWeight: focused ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
      {focused && <View style={styles.activeIndicatorDot} />}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, initialized]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          ...Shadows.lg,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 6,
          elevation: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="Home" label="Home" focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="measure"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="Ruler" label="Measure" focused={focused} />
          ),
        }}
      />
      
      {/* Center Floating Quick-Add Action Button */}
      <Tabs.Screen
        name="add"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/food-search');
          },
        }}
        options={{
          tabBarIcon: () => (
            <View style={styles.centerAddWrapper}>
              <View style={styles.centerAddButton}>
                <Icon name="Plus" size={24} color={Colors.white} strokeWidth={2.8} />
              </View>
              <Text style={styles.centerAddLabel}>
                Add
              </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="Dumbbell" label="Workout" focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="User" label="Profile" focused={focused} />
          ),
        }}
      />
      
      {/* Hidden Standalone Tabs */}
      <Tabs.Screen name="devices" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: Typography.tracking.wide,
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary[600],
    marginTop: 1,
  },
  centerAddWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  centerAddLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary[600],
    marginTop: 3,
    letterSpacing: Typography.tracking.wide,
  },
});
