import { create } from "zustand";

interface CommandCenterState {
  /** Firebase key of the local user */
  selfUserId: string | null;
  /** When true, all non-self avatars are hidden */
  isPartyHidden: boolean;
  /** Whether the command menu overlay is open */
  isMenuOpen: boolean;
  /** Whether the avatar customizer panel is open */
  isCustomizerOpen: boolean;

  setSelfUserId: (id: string) => void;
  togglePartyHidden: () => void;
  setMenuOpen: (open: boolean) => void;
  setCustomizerOpen: (open: boolean) => void;
}

export const useCommandCenterStore = create<CommandCenterState>((set) => ({
  selfUserId: null,
  isPartyHidden: false,
  isMenuOpen: false,
  isCustomizerOpen: false,

  setSelfUserId: (id) => set({ selfUserId: id }),
  togglePartyHidden: () =>
    set((state) => ({ isPartyHidden: !state.isPartyHidden })),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setCustomizerOpen: (open) => set({ isCustomizerOpen: open }),
}));
