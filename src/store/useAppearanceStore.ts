import { create } from "zustand";

/** The 5 color fields returned by Gemini Vision */
export interface AvatarSkinData {
  hair: string;
  skin: string;
  top: string;
  bottom: string;
  accent: string;
}

interface AppearanceState {
  /** Current skin data for the self-user's avatar */
  skinData: AvatarSkinData | null;
  /** True while Gemini is processing a photo */
  isCustomizing: boolean;

  setSkinData: (data: AvatarSkinData) => void;
  setIsCustomizing: (val: boolean) => void;
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  skinData: null,
  isCustomizing: false,

  setSkinData: (data) => set({ skinData: data }),
  setIsCustomizing: (val) => set({ isCustomizing: val }),
}));
