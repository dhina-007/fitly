import { create } from 'zustand';

export const useDateStore = create((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  resetToToday: () => set({ selectedDate: new Date().toISOString().split('T')[0] }),
}));
