import os

base_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile"
files = {
    "app.json": """{
  "expo": {
    "name": "HealthFit",
    "slug": "healthfit",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#00BFA5"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.healthfit.app",
      "infoPlist": {
        "NSHealthShareUsageDescription": "HealthFit reads your health data to track fitness and nutrition goals.",
        "NSHealthUpdateUsageDescription": "HealthFit writes health data to keep your records in sync.",
        "NSCameraUsageDescription": "HealthFit uses the camera to scan food for nutrition tracking.",
        "NSPhotoLibraryUsageDescription": "HealthFit accesses photos to analyze food nutrition."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#00BFA5"
      },
      "package": "com.healthfit.app",
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#00BFA5"
        }
      ]
    ],
    "scheme": "healthfit",
    "experiments": {
      "typedRoutes": false
    }
  }
}""",
    "babel.config.js": """module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};""",
    "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './features/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0F7F4', 100: '#B2EBE4', 200: '#80DECD', 300: '#4DD0B6',
          400: '#26C6A1', 500: '#00BFA5', 600: '#00A895', 700: '#008F7E',
          800: '#007668', 900: '#004F46',
        },
        secondary: {
          50: '#E8F1FF', 100: '#C5D9FF', 200: '#9EBFFF', 300: '#74A4FF',
          400: '#4D8EFF', 500: '#2979FF', 600: '#1A6AFF', 700: '#0055FF',
          800: '#0047E0', 900: '#002DAD',
        },
        accent: {
          50: '#FFF0F0', 100: '#FFD6D6', 200: '#FFB0B0', 300: '#FF8585',
          400: '#FF6B6B', 500: '#FF5252', 600: '#F44336', 700: '#E53935',
          800: '#C62828', 900: '#B71C1C',
        },
        success: '#4CAF50', warning: '#FF9800', error: '#F44336',
        neutral: {
          50: '#F8FAFB', 100: '#F1F4F6', 200: '#E4E9EE', 300: '#CDD5DE',
          400: '#9AAAB8', 500: '#6B7E93', 600: '#4A5D70', 700: '#334455',
          800: '#1E2D3D', 900: '#0F1923',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        '2xl': '16px', '3xl': '24px', '4xl': '32px',
      },
    },
  },
  plugins: [],
};""",
    "metro.config.js": """const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });""",
    "global.css": """@tailwind base;
@tailwind components;
@tailwind utilities;""",
    ".env.example": """EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_API_URL=http://localhost:3000/api""",
    "constants/colors.js": """export const Colors = {
  primary: {
    50: '#E0F7F4', 100: '#B2EBE4', 200: '#80DECD', 300: '#4DD0B6', 400: '#26C6A1',
    500: '#00BFA5', 600: '#00A895', 700: '#008F7E', 800: '#007668', 900: '#004F46',
  },
  secondary: {
    50: '#E8F1FF', 100: '#C5D9FF', 200: '#9EBFFF', 300: '#74A4FF', 400: '#4D8EFF',
    500: '#2979FF', 600: '#1A6AFF', 700: '#0055FF', 800: '#0047E0', 900: '#002DAD',
  },
  accent: '#FF6B6B', success: '#4CAF50', warning: '#FF9800', error: '#F44336',
  white: '#FFFFFF', black: '#000000', background: '#F8FAFB', surface: '#FFFFFF',
  border: '#E4E9EE', textPrimary: '#1E2D3D', textSecondary: '#6B7E93', textMuted: '#9AAAB8',
  gradients: {
    primary: ['#00BFA5', '#00A895'], secondary: ['#2979FF', '#1A6AFF'], accent: ['#FF6B6B', '#FF5252'],
    warm: ['#FF9800', '#F57C00'], purple: ['#9C27B0', '#7B1FA2'], card: ['#FFFFFF', '#F8FAFB'],
  },
};""",
    "constants/typography.js": """export const Typography = {
  sizes: { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 34, '5xl': 40 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
  lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};""",
    "constants/index.js": """export { Colors } from './colors';
export { Typography } from './typography';

export const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64 };
export const BorderRadius = { sm: 6, md: 10, lg: 14, xl: 18, '2xl': 24, full: 9999 };
export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
};

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];
export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise', multiplier: 1.2 },
  { id: 'lightly_active', label: 'Lightly Active', description: '1-3 days/week', multiplier: 1.375 },
  { id: 'moderately_active', label: 'Moderately Active', description: '3-5 days/week', multiplier: 1.55 },
  { id: 'very_active', label: 'Very Active', description: '6-7 days/week', multiplier: 1.725 },
  { id: 'extra_active', label: 'Extra Active', description: 'Very hard exercise, physical job', multiplier: 1.9 },
];
export const FITNESS_GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '🏃', description: 'Lose body fat and get leaner' },
  { id: 'weight_gain', label: 'Weight Gain', icon: '💪', description: 'Gain mass and strength' },
  { id: 'muscle_building', label: 'Muscle Building', icon: '🏋️', description: 'Build lean muscle mass' },
  { id: 'maintenance', label: 'Maintenance', icon: '⚖️', description: 'Maintain current weight' },
  { id: 'general_fitness', label: 'General Fitness', icon: '🌟', description: 'Improve overall fitness' },
  { id: 'better_nutrition', label: 'Better Nutrition', icon: '🥗', description: 'Eat healthier every day' },
  { id: 'better_sleep', label: 'Better Sleep', icon: '😴', description: 'Improve sleep quality' },
  { id: 'improved_activity', label: 'Improved Activity', icon: '🚶', description: 'Move more daily' },
];
export const DIETARY_PREFERENCES = [
  { id: 'non_vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'jain', label: 'Jain', icon: '🙏' },
  { id: 'custom', label: 'Custom', icon: '⚙️' },
];
export const WATER_QUICK_ADD = [250, 500, 750, 1000];""",
    "services/firebase.js": """import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} else {
  app = getApp();
  auth = getAuth(app);
}
export { app, auth };""",
    "services/auth.service.js": """import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider,
  signInWithCredential, onAuthStateChanged, updateProfile,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

export const authService = {
  register: async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    return cred.user;
  },
  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },
  googleSignIn: async () => {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
    return cred.user;
  },
  logout: async () => await signOut(auth),
  forgotPassword: async (email) => await sendPasswordResetEmail(auth, email),
  getIdToken: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  },
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  getCurrentUser: () => auth.currentUser,
};""",
    "store/authStore.js": """import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, profile: null, token: null, loading: true, initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  logout: () => set({ user: null, profile: null, token: null }),
}));""",
    "store/appStore.js": """import { create } from 'zustand';

export const useAppStore = create((set) => ({
  todaySummary: null,
  setTodaySummary: (summary) => set({ todaySummary: summary }),
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  bottomSheet: { visible: false, content: null },
  openBottomSheet: (content) => set({ bottomSheet: { visible: true, content } }),
  closeBottomSheet: () => set({ bottomSheet: { visible: false, content: null } }),
  toast: null,
  showToast: (toast) => set({ toast }),
  hideToast: () => set({ toast: null }),
}));""",
    "services/api.js": """import axios from 'axios';
import { authService } from './auth.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: API_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(async (config) => {
  try {
    const token = await authService.getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.warn('Failed to get auth token:', e.message);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
export default api;""",
    "components/ui/Button.jsx": """import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, BorderRadius, Typography } from '../../constants';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({ title, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, fullWidth = true, style }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const variants = {
    primary: { bg: Colors.primary[500], text: Colors.white, border: 'transparent' },
    secondary: { bg: Colors.secondary[500], text: Colors.white, border: 'transparent' },
    outline: { bg: 'transparent', text: Colors.primary[500], border: Colors.primary[500] },
    ghost: { bg: Colors.primary[50], text: Colors.primary[600], border: 'transparent' },
    danger: { bg: Colors.error, text: Colors.white, border: 'transparent' },
    white: { bg: Colors.white, text: Colors.primary[600], border: 'transparent' },
  };
  const sizes = {
    sm: { paddingH: 12, paddingV: 8, fontSize: Typography.sizes.sm, height: 36 },
    md: { paddingH: 20, paddingV: 14, fontSize: Typography.sizes.base, height: 50 },
    lg: { paddingH: 24, paddingV: 16, fontSize: Typography.sizes.lg, height: 56 },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <AnimatedTouchable
      onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}
      disabled={disabled || loading} activeOpacity={0.9}
      style={[animStyle, {
        backgroundColor: disabled ? Colors.neutral[200] : v.bg,
        borderColor: v.border, borderWidth: variant === 'outline' ? 1.5 : 0,
        borderRadius: BorderRadius.xl, paddingHorizontal: s.paddingH, paddingVertical: s.paddingV,
        height: s.height, width: fullWidth ? '100%' : undefined,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
      }, style]}
    >
      {loading ? <ActivityIndicator color={v.text} size="small" /> : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={{ color: disabled ? Colors.neutral[400] : v.text, fontSize: s.fontSize, fontWeight: Typography.weights.semibold, letterSpacing: 0.3 }}>{title}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}""",
    "components/ui/Card.jsx": """import React from 'react';
import { View } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants';

export function Card({ children, style, padding = 16, shadow = 'md', rounded = 'xl' }) {
  const shadowStyles = { none: {}, sm: Shadows.sm, md: Shadows.md, lg: Shadows.lg };
  const roundedMap = { md: BorderRadius.md, lg: BorderRadius.lg, xl: BorderRadius.xl, '2xl': BorderRadius['2xl'] };
  return (
    <View style={[{ backgroundColor: Colors.surface, borderRadius: roundedMap[rounded] || BorderRadius.xl, padding, ...shadowStyles[shadow] }, style]}>
      {children}
    </View>
  );
}""",
    "components/ui/Input.jsx": """import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants';

export function Input({ label, placeholder, value, onChangeText, error, secureTextEntry, keyboardType = 'default', autoCapitalize = 'none', leftIcon, rightIcon, onRightIconPress, multiline, numberOfLines, style, inputStyle, editable = true, maxLength }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = error ? Colors.error : focused ? Colors.primary[500] : Colors.border;

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>{label}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: focused ? Colors.primary[50] : Colors.neutral[50], borderWidth: 1.5, borderColor, borderRadius: BorderRadius.lg, paddingHorizontal: 14, minHeight: 50 }}>
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.textMuted} secureTextEntry={secureTextEntry && !showPassword} keyboardType={keyboardType} autoCapitalize={autoCapitalize} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} multiline={multiline} numberOfLines={numberOfLines} editable={editable} maxLength={maxLength} style={[{ flex: 1, fontSize: Typography.sizes.base, color: Colors.textPrimary, paddingVertical: 12 }, inputStyle]} />
        {secureTextEntry && <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}><Text style={{ fontSize: 13, color: Colors.primary[500], fontWeight: '600' }}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity>}
        {rightIcon && !secureTextEntry && <TouchableOpacity onPress={onRightIconPress} style={{ padding: 4 }}>{rightIcon}</TouchableOpacity>}
      </View>
      {error && <Text style={{ fontSize: Typography.sizes.xs, color: Colors.error, marginTop: 4, marginLeft: 4 }}>{error}</Text>}
    </View>
  );
}""",
    "components/ui/ProgressRing.jsx": """import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../../constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ size = 80, strokeWidth = 8, progress = 0, color = Colors.primary[500], backgroundColor = Colors.neutral[100], label, sublabel, children }) {
  const animatedProgress = useSharedValue(0);
  useEffect(() => { animatedProgress.value = withTiming(Math.min(progress, 1), { duration: 1000, easing: Easing.out(Easing.cubic) }); }, [progress]);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - animatedProgress.value) }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={backgroundColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} animatedProps={animatedProps} transform={`rotate(-90, ${size / 2}, ${size / 2})`} />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children || (
          <>
            {label && <Text style={{ fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{label}</Text>}
            {sublabel && <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{sublabel}</Text>}
          </>
        )}
      </View>
    </View>
  );
}""",
    "components/ui/ProgressBar.jsx": """import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../constants';

export function ProgressBar({ progress = 0, color = Colors.primary[500], height = 8, backgroundColor = Colors.neutral[100], style }) {
  const width = useSharedValue(0);
  useEffect(() => { width.value = withTiming(Math.min(Math.max(progress, 0), 1) * 100, { duration: 800, easing: Easing.out(Easing.cubic) }); }, [progress]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={[{ height, backgroundColor, borderRadius: BorderRadius.full, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: BorderRadius.full }, animStyle]} />
    </View>
  );
}""",
    "components/ui/SkeletonLoader.jsx": """import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../constants';

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = BorderRadius.md, style }) {
  const opacity = useSharedValue(1);
  useEffect(() => { opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })), -1, false); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, backgroundColor: Colors.neutral[200], borderRadius }, animStyle, style]} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <View style={{ padding: 16, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, ...require('../../constants').Shadows.md }}>
      <SkeletonLoader height={20} width="60%" style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} height={12} width={i === lines - 1 ? '40%' : '100%'} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}""",
    "components/ui/EmptyState.jsx": """import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Typography } from '../../constants';
import { Button } from './Button';

export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
      {icon && <Text style={{ fontSize: 56 }}>{icon}</Text>}
      <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center' }}>{title}</Text>
      {description && <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>{description}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: 8, paddingHorizontal: 32 }} />}
    </View>
  );
}""",
    "components/ui/Toast.jsx": """import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Typography } from '../../constants';
import { useAppStore } from '../../store/appStore';

export function ToastContainer() {
  const { toast, hideToast } = useAppStore();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(hideToast, 300);
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: opacity.value }));
  if (!toast) return null;

  const bgColors = { success: Colors.success, error: Colors.error, info: Colors.secondary[500], warning: Colors.warning };
  return (
    <Animated.View style={[animStyle, { position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: bgColors[toast.type] || Colors.primary[500], borderRadius: BorderRadius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', zIndex: 9999, ...Shadows.lg }]}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</Text>
      <View style={{ flex: 1 }}>
        {toast.title && <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.white, marginBottom: 2 }}>{toast.title}</Text>}
        <Text style={{ fontSize: Typography.sizes.sm, color: Colors.white, opacity: 0.9 }}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}""",
    "components/ui/index.js": """export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { ProgressRing } from './ProgressRing';
export { ProgressBar } from './ProgressBar';
export { SkeletonLoader, SkeletonCard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
export { ToastContainer } from './Toast';""",
    "app/_layout.jsx": """import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { ToastContainer } from '../components/ui';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 }, mutations: { retry: 0 } },
});

function AuthProvider({ children }) {
  const { setUser, setToken, setLoading, setInitialized } = useAuthStore();
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setUser(user); setToken(token);
      } else {
        setUser(null); setToken(null);
      }
      setLoading(false); setInitialized(true);
    });
    return unsubscribe;
  }, []);
  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <ToastContainer />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}""",
    "app/index.jsx": """import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants';

export default function Index() {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();
  useEffect(() => {
    if (!initialized) return;
    if (user) router.replace('/(tabs)/home');
    else router.replace('/(auth)/login');
  }, [user, initialized]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[500] }}>
      <ActivityIndicator color={Colors.white} size="large" />
    </View>
  );
}""",
    "app/(auth)/_layout.jsx": """import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  useEffect(() => {
    if (initialized && user) router.replace('/(tabs)/home');
  }, [user, initialized]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}""",
    "app/(auth)/login.jsx": """import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button, Input } from '../../components/ui';
import { Colors, Typography } from '../../constants';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\\S+@\\S+\\.\\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login(email, password);
      router.replace('/(tabs)/home');
    } catch (err) {
      showToast({ type: 'error', title: 'Login Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authService.googleSignIn();
      router.replace('/(tabs)/home');
    } catch (err) {
      showToast({ type: 'error', title: 'Google Sign-In Failed', message: err.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[Colors.primary[500], Colors.primary[600]]} style={{ paddingTop: 60, paddingBottom: 48, alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, backgroundColor: Colors.white, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 36 }}>💚</Text>
            </View>
            <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.bold, color: Colors.white, letterSpacing: -0.5 }}>HealthFit</Text>
            <Text style={{ fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Your complete wellness companion</Text>
          </LinearGradient>
          <View style={{ flex: 1, padding: 24, paddingTop: 32 }}>
            <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>Welcome back! 👋</Text>
            <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 28 }}>Sign in to continue your health journey</Text>
            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} leftIcon={<Mail size={18} color={Colors.textMuted} />} />
            <Input label="Password" placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} leftIcon={<Lock size={18} color={Colors.textMuted} />} />
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}>
              <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.sm }}>Forgot password?</Text>
            </TouchableOpacity>
            <Button title="Sign In" onPress={handleLogin} loading={loading} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ marginHorizontal: 12, color: Colors.textMuted, fontSize: Typography.sizes.sm }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>
            <Button title="Continue with Google" onPress={handleGoogle} loading={googleLoading} variant="outline" icon={<Text style={{ fontSize: 18 }}>🇬</Text>} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.sizes.base }}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base }}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}""",
    "app/(auth)/register.jsx": """import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock } from 'lucide-react-native';
import { authService } from '../../services/auth.service';
import { useAppStore } from '../../store/appStore';
import { Button, Input } from '../../components/ui';
import { Colors, Typography } from '../../constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { showToast } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email) e.email = 'Email is required';
    else if (!/\\S+@\\S+\\.\\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(email, password, name.trim());
      router.replace('/(auth)/onboarding');
    } catch (err) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24, marginTop: 8 }}>
            <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.base }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>Create Account 🌱</Text>
          <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 32 }}>Start your personalized health journey today</Text>
          <Input label="Full Name" placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} leftIcon={<User size={18} color={Colors.textMuted} />} />
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} leftIcon={<Mail size={18} color={Colors.textMuted} />} />
          <Input label="Password" placeholder="Min 8 characters" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} leftIcon={<Lock size={18} color={Colors.textMuted} />} />
          <Input label="Confirm Password" placeholder="Repeat your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} leftIcon={<Lock size={18} color={Colors.textMuted} />} />
          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />
          <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: Colors.textSecondary }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.bold }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}""",
    "app/(auth)/forgot-password.jsx": """import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { authService } from '../../services/auth.service';
import { useAppStore } from '../../store/appStore';
import { Button, Input } from '../../components/ui';
import { Colors, Typography } from '../../constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useAppStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      showToast({ type: 'success', title: 'Email Sent!', message: 'Check your inbox for password reset instructions.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32, marginTop: 8 }}>
            <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.base }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 24 }}>🔑</Text>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>Forgot Password?</Text>
          <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            No worries! Enter your email and we'll send you reset instructions.
          </Text>
          {!sent ? (
            <>
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" leftIcon={<Mail size={18} color={Colors.textMuted} />} />
              <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
            </>
          ) : (
            <View style={{ backgroundColor: Colors.primary[50], borderRadius: 16, padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary[600], textAlign: 'center' }}>Email Sent!</Text>
              <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Check your inbox and follow the link to reset your password.
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold }}>Return to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("All initial files created")
