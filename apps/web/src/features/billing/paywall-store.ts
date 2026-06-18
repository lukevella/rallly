import { create } from "zustand";

type PayWallStore = {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
};

export const usePayWallStore = create<PayWallStore>((set) => ({
  isOpen: false,
  show: () => set({ isOpen: true }),
  hide: () => set({ isOpen: false }),
}));

export const showPayWall = () => usePayWallStore.getState().show();
