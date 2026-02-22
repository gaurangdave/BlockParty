"use client";

import { useEffect, useRef } from "react";
import { useBlockParty } from "../src/hooks/useBlockParty";
import { useSettingsStore } from "../src/store/useSettingsStore";
import StatusIndicator from "./components/StatusIndicator";
import dynamic from "next/dynamic";
import { ref, push, set } from "firebase/database";
import { database } from "../src/lib/firebase";

const Scene = dynamic(() => import("../src/components/Scene"), { ssr: false });

export default function Home() {
  const { toggleInteraction, error } = useBlockParty();
  const isInteractive = useSettingsStore((state) => state.isInteractive);
  const isAltPressedRef = useRef(false);

  console.log("🎨 Home component render, isInteractive:", isInteractive);

  useEffect(() => {
    const hasJoined = sessionStorage.getItem("hasJoinedBlockParty");
    if (!hasJoined) {
      sessionStorage.setItem("hasJoinedBlockParty", "true");
      console.log("🚀 Dropping into the party!");
      const usersRef = ref(database, "users");
      const newUserRef = push(usersRef);
      set(newUserRef, {
        username: "Player",
        position: [(Math.random() - 0.5) * 20, 15, (Math.random() - 0.5) * 5],
      }).catch((err) => console.error("Failed to join party:", err));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(
        "⌨️ KeyDown event:",
        e.key,
        "altKey:",
        e.altKey,
        "isAltPressedRef:",
        isAltPressedRef.current,
      );
      // Alt key (Option on Mac) - switch to GHOST MODE
      if (e.altKey && !isAltPressedRef.current) {
        console.log("👻 Activating ghost mode (click-through)");
        isAltPressedRef.current = true;
        toggleInteraction(false); // false = ghost mode (ignore cursor)
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log(
        "⌨️ KeyUp event:",
        e.key,
        "isAltPressedRef:",
        isAltPressedRef.current,
      );
      // When Alt is released - switch back to INTERACTIVE
      if (e.key === "Alt" && isAltPressedRef.current) {
        console.log("🔓 Activating interactive mode");
        isAltPressedRef.current = false;
        toggleInteraction(true); // true = interactive mode (receive clicks)
      }
    };

    console.log("👂 Adding keyboard event listeners");
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      console.log("🧹 Cleaning up keyboard event listeners");
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [toggleInteraction]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent pointer-events-none select-none touch-none">
      <div className="pointer-events-auto">
        <StatusIndicator isInteractive={isInteractive} />
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-auto">
        <Scene />
      </div>

      {error && (
        <div className="absolute top-16 rounded-xl border border-red-500/30 bg-black/80 px-4 py-2 text-center backdrop-blur-sm pointer-events-auto">
          <p className="text-xs text-red-400">Error: {error}</p>
        </div>
      )}
    </main>
  );
}
