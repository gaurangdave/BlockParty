import { create } from "zustand";

interface SettingsState {
  isInteractive: boolean;
  movementEnabled: boolean;
  setIsInteractive: (isInteractive: boolean) => void;
  setMovementEnabled: (movementEnabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isInteractive: true,
  movementEnabled: true,
  setIsInteractive: (isInteractive) => set({ isInteractive }),
  setMovementEnabled: (movementEnabled) => set({ movementEnabled }),
}));
