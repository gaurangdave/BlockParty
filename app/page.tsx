"use client";

import { useEffect, useRef } from "react";
import { useBlockParty } from "../src/hooks/useBlockParty";
import StatusIndicator from "./components/StatusIndicator";

export default function Home() {
  const { isInteractive, toggleInteraction, error } = useBlockParty();
  const isAltPressedRef = useRef(false);

  console.log("🎨 Home component render, isInteractive:", isInteractive);

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
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent">
      <StatusIndicator isInteractive={isInteractive} />

      <div className="rounded-xl border border-white/10 bg-black/50 p-8 text-center backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-wider text-white">
          BlockParty Engine Initialized
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Overlay Active • Awaiting Commands
        </p>
        {error && <p className="mt-2 text-xs text-red-400">Error: {error}</p>}
        <p className="mt-4 text-xs text-gray-400">
          Hold <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Alt</kbd> for
          ghost mode
        </p>
      </div>
    </main>
  );
}
