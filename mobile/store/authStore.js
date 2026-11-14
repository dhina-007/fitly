import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      token: null,
      loading: true,
      initialized: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),
      logout: () => set({ user: null, profile: null, token: null }),
    }),
    {
      name: 'healthfit-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, profile: state.profile, token: state.token }),
    }
  )
);