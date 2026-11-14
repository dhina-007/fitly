import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDxweCjEh6GC0CIka0kXukg_ooCPQLQwKM',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'healtifyfit.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'healtifyfit',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'healtifyfit.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '363441785150',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:363441785150:web:bfcbc28788c159bd0c446f',
};

let app;
let auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Use getAuth directly; on React Native it will use memory persistence if AsyncStorage isn't configured,
  // which is perfectly fine for development and avoids the getReactNativePersistence crash on Web/Expo Go.
  try {
    auth = getAuth(app);
  } catch (err) {
    auth = initializeAuth(app);
  }
} catch (e) {
  console.error('Firebase initialization error:', e.message);
}

export { app, auth };