import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback } from "react";

export interface UseBlockPartyReturn {
  isInteractive: boolean;
  toggleInteraction: (state: boolean) => Promise<void>;
  error: string | null;
}

export function useBlockParty(): UseBlockPartyReturn {
  const [isInteractive, setIsInteractive] = useState(true); // Start in interactive mode
  const [error, setError] = useState<string | null>(null);

  const toggleInteraction = useCallback(async (state: boolean) => {
    console.log("🔄 toggleInteraction called with state:", state);
    try {
      setError(null);
      console.log("📡 Calling Tauri command: set_overlay_clickable");
      await invoke("set_overlay_clickable", { clickable: state });
      console.log("✅ Tauri command succeeded, updating state to:", state);
      setIsInteractive(state);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to toggle interaction mode";
      setError(errorMessage);
      console.error("❌ Error toggling interaction:", err);
    }
  }, []);

  return {
    isInteractive,
    toggleInteraction,
    error,
  };
}
