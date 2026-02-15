"use client";

interface StatusIndicatorProps {
  isInteractive: boolean;
}

export default function StatusIndicator({
  isInteractive,
}: StatusIndicatorProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3 bg-black px-4 py-2.5 rounded-full border-2 border-white/30">
      <div className="flex items-center gap-2">
        <span className="text-xl">{isInteractive ? "🔴" : "🟢"}</span>
        <div
          className={`h-2 w-2 rounded-full transition-all duration-300 animate-pulse ${
            isInteractive ? "bg-red-500" : "bg-green-500"
          }`}
        />
      </div>
      <span className="text-sm font-semibold text-white tracking-wide">
        {isInteractive ? "INTERACTIVE" : "GHOST MODE"}
      </span>
    </div>
  );
}
