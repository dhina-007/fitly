import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider,
  signInWithPopup, signInWithCredential, onAuthStateChanged, updateProfile,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';

export const authService = {
  register: async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    try { await sendEmailVerification(cred.user); } catch (e) {}
    return cred.user;
  },
  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },
  googleSignIn: async () => {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      try {
        const cred = await signInWithPopup(auth, provider);
          return cred.user;
        } catch (popupErr) {
          if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
            return null;
          }
          if (popupErr.code === 'auth/unauthorized-domain') {
            throw new Error('This domain is not authorized for Google Sign-In. Please add it to your Firebase Console > Authentication > Settings > Authorized Domains.');
          }
          if (popupErr.code === 'auth/popup-blocked') {
            console.warn('Popup blocked, falling back to redirect...');
            const { signInWithRedirect } = require('firebase/auth');
            await signInWithRedirect(auth, provider);
            return null; // Will reload page
          }
          throw popupErr;
        }
    } else {
      const Constants = require('expo-constants').default;
      if (Constants.appOwnership === 'expo') {
        throw new Error('Google Sign-In requires a custom Expo Development Build. It does not work inside the standard Expo Go app.');
      }

      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '363441785150-mf281u194hvnequ037gq85a20niu5s4k.apps.googleusercontent.com',
          offlineAccess: true,
          scopes: ['profile', 'email'],
        });

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();
        
        if (response?.type === 'cancelled') {
          return null;
        }

        const idToken = response?.data?.idToken || response?.idToken;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const cred = await signInWithCredential(auth, credential);
          return cred.user;
        } else {
          throw new Error('No Google ID token returned');
        }
      } catch (error) {
        if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
          return null;
        }
        throw error;
      }
    }
  },
  logout: async () => {
    if (Platform.OS !== 'web') {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch (e) {
        // Silently continue if native Google sign out is not initialized
      }
    }
    await signOut(auth);
  },
  forgotPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },
  getIdToken: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  },
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback, (error) => {
      console.warn('Auth state changed error:', error);
      callback(null);
    });
  },
  getCurrentUser: () => {
    return auth.currentUser;
  },
};