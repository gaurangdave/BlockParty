import { useEffect } from "react";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Palette, Settings } from "lucide-react";
import { useCommandCenterStore } from "../store/useCommandCenterStore";
import { useSettingsStore } from "../store/useSettingsStore";

export function CommandMenu() {
  const isInteractive = useSettingsStore((state) => state.isInteractive);
  const isPartyHidden = useCommandCenterStore((state) => state.isPartyHidden);
  const togglePartyHidden = useCommandCenterStore(
    (state) => state.togglePartyHidden,
  );
  const setMenuOpen = useCommandCenterStore((state) => state.setMenuOpen);
  const setCustomizerOpen = useCommandCenterStore(
    (state) => state.setCustomizerOpen,
  );

  const movementEnabled = useSettingsStore((state) => state.movementEnabled);
  const setMovementEnabled = useSettingsStore(
    (state) => state.setMovementEnabled,
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMenuOpen]);

  const handleCustomize = () => {
    setMenuOpen(false);
    setCustomizerOpen(true);
  };

  return (
    <Html
      position={[0, 2.4, 0]}
      center
      zIndexRange={[200, 0]}
      style={{
        pointerEvents: isInteractive ? "auto" : "none",
        width: "240px",
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 10 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col gap-1 rounded-2xl border border-white/15 p-2"
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "rgba(10, 10, 20, 0.80)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          width: "240px",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={(e) => e.stopPropagation()}
        onPointerOut={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-1 flex items-center justify-between px-2 pt-1">
          <span className="text-xs font-bold tracking-wide text-white/60 uppercase">
            Command Center
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white/40 transition-colors hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div className="mx-2 h-px bg-white/10" />

        {/* Menu Items */}
        <MenuButton
          icon={isPartyHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          label={isPartyHidden ? "Show BlockParty" : "Hide BlockParty"}
          subtitle={isPartyHidden ? "Others are hidden" : "Others are visible"}
          accent={isPartyHidden ? "#fbbf24" : undefined}
          onClick={() => togglePartyHidden()}
        />

        <MenuButton
          icon={
            movementEnabled ? (
              <span className="text-sm">🚶</span>
            ) : (
              <span className="text-sm">🧍</span>
            )
          }
          label={movementEnabled ? "Random Walk: ON" : "Random Walk: OFF"}
          subtitle="Toggle avatar wandering"
          onClick={() => setMovementEnabled(!movementEnabled)}
        />

        <div className="mx-2 h-px bg-white/10" />

        {/* Customize Avatar */}
        <MenuButton
          icon={<Palette size={16} />}
          label="Customize Avatar"
          subtitle="Pick your colors"
          accent="#a855f7"
          onClick={handleCustomize}
        />

        <MenuButton
          icon={<Settings size={16} />}
          label="Settings"
          subtitle="Coming Soon"
          disabled
        />

        {/* Tail pointing down toward the avatar */}
        <div
          className="absolute left-1/2 -bottom-[6px] h-3 w-3 border-b border-r border-white/15"
          style={{
            transform: "translateX(-50%) rotate(45deg)",
            backgroundColor: "rgba(10, 10, 20, 0.80)",
          }}
        />
      </motion.div>
    </Html>
  );
}

/* ─── Reusable Menu Button ─── */
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  accent?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function MenuButton({
  icon,
  label,
  subtitle,
  accent,
  disabled,
  onClick,
}: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left
        transition-all duration-150
        ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-white/10 active:scale-[0.97]"
        }
      `}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
        style={{
          backgroundColor: accent ? `${accent}22` : "rgba(255, 255, 255, 0.07)",
          color: accent || "rgba(255, 255, 255, 0.8)",
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span
          className="text-sm font-semibold leading-tight"
          style={{ color: accent || "rgba(255, 255, 255, 0.9)" }}
        >
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] leading-tight text-white/40">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
}
