import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const isWeb = Platform.OS === 'web';
const useNative = !isWeb;

export default function SimpleTextSplashScreen() {
  const router = useRouter();
  const { user, profile, initialized } = useAuthStore();

  // Animation values for simple text appear
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(18)).current;
  const textLetterSpacing = useRef(new Animated.Value(-1)).current;

  // Subtitle fade
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslateY = useRef(new Animated.Value(10)).current;

  // Simple loading indicator dots animation
  const dot1Opacity = useRef(new Animated.Value(0.2)).current;
  const dot2Opacity = useRef(new Animated.Value(0.2)).current;
  const dot3Opacity = useRef(new Animated.Value(0.2)).current;

  // Screen exit fade
  const screenFade = useRef(new Animated.Value(1)).current;

  const minTimeElapsed = useRef(false);
  const navigated = useRef(false);

  useEffect(() => {
    // 1. Text appear animation with synchronized stagger
    Animated.parallel([
      // Main "Fitly" text appears smoothly
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: useNative,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 480,
        useNativeDriver: useNative,
      }),

      // Subtitle appears gently with slight stagger
      Animated.sequence([
        Animated.delay(160),
        Animated.parallel([
          Animated.timing(subOpacity, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: useNative,
          }),
          Animated.timing(subTranslateY, {
            toValue: 0,
            duration: 420,
            useNativeDriver: useNative,
          }),
        ]),
      ]),
    ]).start();

    // 2. Simple rhythmic pulsing dots animation
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          // Dot 1
          Animated.timing(dot1Opacity, { toValue: 1, duration: 250, useNativeDriver: useNative }),
          Animated.parallel([
            Animated.timing(dot1Opacity, { toValue: 0.25, duration: 250, useNativeDriver: useNative }),
            Animated.timing(dot2Opacity, { toValue: 1, duration: 250, useNativeDriver: useNative }),
          ]),
          Animated.parallel([
            Animated.timing(dot2Opacity, { toValue: 0.25, duration: 250, useNativeDriver: useNative }),
            Animated.timing(dot3Opacity, { toValue: 1, duration: 250, useNativeDriver: useNative }),
          ]),
          Animated.timing(dot3Opacity, { toValue: 0.25, duration: 250, useNativeDriver: useNative }),
          Animated.delay(200),
        ])
      ).start();
    };

    const dotTimer = setTimeout(animateDots, 400);

    // 3. Minimum display timer (~1.3s for simple, quick, refined feel)
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      checkAndNavigate();
    }, 1350);

    return () => {
      clearTimeout(dotTimer);
      clearTimeout(minTimer);
    };
  }, []);

  // When auth state is ready and min animation duration elapsed
  useEffect(() => {
    if (initialized && minTimeElapsed.current) {
      checkAndNavigate();
    }
  }, [user, profile, initialized]);

  const checkAndNavigate = () => {
    if (navigated.current) return;
    if (!initialized && !minTimeElapsed.current) return;

    navigated.current = true;

    // Smooth exit fade
    Animated.timing(screenFade, {
      toValue: 0,
      duration: 250,
      useNativeDriver: useNative,
    }).start(() => {
      if (user) {
        if (profile?.onboardingCompleted) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } else {
        router.replace('/(auth)/login');
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Brand & Text Content */}
      <View style={styles.centerBox}>
        {/* Animated Brand Emblem */}
        <Animated.View
          style={[
            styles.emblemWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.emblemShadow}>
            <Image
              source={require('../assets/fitly-badge.png')}
              style={styles.emblemImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Animated "Fitly" Brand Title */}
        <Animated.View
          style={[
            styles.titleRow,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.mainText}>Fitly</Text>
          <View style={styles.accentDot} />
        </Animated.View>

        {/* Animated Subtitle */}
        <Animated.View
          style={[
            styles.subWrapper,
            {
              opacity: subOpacity,
              transform: [{ translateY: subTranslateY }],
            },
          ]}
        >
          <Text style={styles.subText}>PRECISION HEALTH & FITNESS</Text>
        </Animated.View>

        {/* Minimalist 3-Dot Loading Indicator */}
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean minimalist white background
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemWrap: {
    marginBottom: 16,
  },
  emblemShadow: {
    width: 68,
    height: 68,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: '#021817',
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mainText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.4,
  },
  accentDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginTop: -16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  subWrapper: {
    marginTop: 8,
  },
  subText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 3,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
});