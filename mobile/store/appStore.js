import { create } from 'zustand';

export const useAppStore = create((set) => ({
  todaySummary: null,
  setTodaySummary: (summary) => set({ todaySummary: summary }),
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  bottomSheet: { visible: false, content: null },
  openBottomSheet: (content) => set({ bottomSheet: { visible: true, content } }),
  closeBottomSheet: () => set({ bottomSheet: { visible: false, content: null } }),
  toast: null,
  showToast: (toastOrMessage, type = 'info', title) =>
    set({
      toast:
        typeof toastOrMessage === 'string'
          ? { type, title, message: toastOrMessage }
          : toastOrMessage,
    }),
  hideToast: () => set({ toast: null }),
}));