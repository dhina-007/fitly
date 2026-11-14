import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { ToastContainer, FloatingAICoachButton } from '../components/ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 }, mutations: { retry: 0 } },
});

import api from '../services/api';

function AuthProvider({ children }) {
  const { setUser, setProfile, setToken, setLoading, setInitialized } = useAuthStore();
  
  useEffect(() => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // Increased timeout to allow API call

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      resolved = true;
      clearTimeout(timeout);
      if (user) {
        try {
          const token = await user.getIdToken();
          setToken(token);
          
          // Fetch profile from MongoDB
          const res = await api.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
          setProfile(res.data?.data || null);
          
          setUser(user);
        } catch (e) {
          console.warn('Failed to fetch profile during auth init:', e.message);
          setUser(user);
          setProfile(null);
        }
      } else {
        const storedUser = useAuthStore.getState().user;
        if (!storedUser) {
          setUser(null); setToken(null); setProfile(null);
        }
      }
      setLoading(false); setInitialized(true);
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
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
            <FloatingAICoachButton />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}