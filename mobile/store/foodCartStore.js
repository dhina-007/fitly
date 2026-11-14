import { create } from 'zustand';

export const useFoodCartStore = create((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          cartId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      ],
    })),

  removeItem: (cartId) =>
    set((state) => ({
      items: state.items.filter((it) => it.cartId !== cartId),
    })),

  clearCart: () => set({ items: [] }),
}));
