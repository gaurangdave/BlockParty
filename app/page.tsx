"use client";

import { useEffect, useRef } from "react";
import { useBlockParty } from "../src/hooks/useBlockParty";
import StatusIndicator from "./components/StatusIndicator";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("../src/components/Scene"), { ssr: false });

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

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Scene />
      </div>

      {error && (
        <div className="absolute top-16 rounded-xl border border-red-500/30 bg-black/80 px-4 py-2 text-center backdrop-blur-sm">
          <p className="text-xs text-red-400">Error: {error}</p>
        </div>
      )}
    </main>
  );
}
