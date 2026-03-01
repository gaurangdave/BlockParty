"use client";

import { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useCommandCenterStore } from "../store/useCommandCenterStore";
import {
  useAppearanceStore,
  AvatarSkinData,
} from "../store/useAppearanceStore";
import { ref, update } from "firebase/database";
import { database } from "../lib/firebase";

/* ─── Default palette for new users ─── */
const DEFAULT_PALETTE: AvatarSkinData = {
  hair: "#3B2F2F",
  skin: "#ffccaa",
  top: "#2E86C1",
  bottom: "#1B4F72",
  accent: "#E74C3C",
};

/* ─── Color picker configuration ─── */
const COLOR_FIELDS: {
  key: keyof AvatarSkinData;
  label: string;
  emoji: string;
}[] = [
  { key: "hair", label: "Hair", emoji: "💇" },
  { key: "skin", label: "Skin", emoji: "🧑" },
  { key: "top", label: "Top", emoji: "👕" },
  { key: "bottom", label: "Bottom", emoji: "👖" },
  { key: "accent", label: "Shoes", emoji: "👟" },
];

/* ─── Rotating Preview Avatar (inside its own Canvas) ─── */
function getColorVariation(baseColor: string, amount: number) {
  const c = new THREE.Color(baseColor);
  c.addScalar(amount);
  return "#" + c.getHexString();
}

function PreviewAvatar({ palette }: { palette: AvatarSkinData }) {
  const groupRef = useRef<THREE.Group>(null);

  const colors = useMemo(
    () => ({
      skin: palette.skin,
      shirt: palette.top,
      pants: palette.bottom,
      shoes: palette.accent,
      hair: palette.hair,
    }),
    [palette],
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hair */}
      <mesh position={[0, 1.1, -0.02]} castShadow>
        <boxGeometry args={[0.52, 0.18, 0.54]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>

      {/* Head */}
      <group position={[0, 0.75, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
        {/* Left Eye */}
        <mesh position={[-0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Right Eye */}
        <mesh position={[0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.04]} />
          <meshStandardMaterial color={getColorVariation(colors.skin, -0.1)} />
        </mesh>
      </group>

      {/* Torso */}
      <mesh position={[0, 0.125, 0]} castShadow>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.375, 0.125, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      {/* Left Sleeve */}
      <mesh position={[-0.375, 0.375, 0]} castShadow>
        <boxGeometry args={[0.26, 0.25, 0.26]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.375, 0.125, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      {/* Right Sleeve */}
      <mesh position={[0.375, 0.375, 0]} castShadow>
        <boxGeometry args={[0.26, 0.25, 0.26]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.125, -0.625, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.125, -0.625, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.125, -0.9, 0.05]} castShadow>
        <boxGeometry args={[0.26, 0.2, 0.3]} />
        <meshStandardMaterial color={colors.shoes} />
      </mesh>
      <mesh position={[0.125, -0.9, 0.05]} castShadow>
        <boxGeometry args={[0.26, 0.2, 0.3]} />
        <meshStandardMaterial color={colors.shoes} />
      </mesh>
    </group>
  );
}

/* ─── Main Customizer Overlay ─── */
export function AvatarCustomizer() {
  const isOpen = useCommandCenterStore((state) => state.isCustomizerOpen);
  const setCustomizerOpen = useCommandCenterStore(
    (state) => state.setCustomizerOpen,
  );
  const selfUserId = useCommandCenterStore((state) => state.selfUserId);
  const existingSkinData = useAppearanceStore((state) => state.skinData);
  const setSkinData = useAppearanceStore((state) => state.setSkinData);

  // Local draft palette — starts from existing or default
  const [draft, setDraft] = useState<AvatarSkinData>(
    existingSkinData || DEFAULT_PALETTE,
  );

  // Sync draft when the panel opens
  const handleOpen = () => {
    setDraft(existingSkinData || DEFAULT_PALETTE);
  };

  const handleColorChange = (key: keyof AvatarSkinData, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setDraft(DEFAULT_PALETTE);
  };

  const handleSave = async () => {
    // Update global appearance store
    setSkinData(draft);

    // Persist to Firebase RTDB
    if (selfUserId) {
      const userRef = ref(database, `users/${selfUserId}`);
      await update(userRef, {
        colorPalette: {
          skin: draft.skin,
          shirt: draft.top,
          pants: draft.bottom,
          shoes: draft.accent,
          hair: draft.hair,
        },
      });
      console.log("💾 Saved palette to Firebase RTDB for user:", selfUserId);
    }

    setCustomizerOpen(false);
  };

  const handleCancel = () => {
    setCustomizerOpen(false);
  };

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {isOpen && (
        <motion.div
          key="avatar-customizer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onAnimationStart={() => {
            // Sync draft when animation starts (opening)
            handleOpen();
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ pointerEvents: "auto" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(15, 10, 40, 0.92) 0%, rgba(0, 0, 0, 0.96) 100%)",
              backdropFilter: "blur(20px)",
            }}
            onClick={handleCancel}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            exit={{ y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 flex overflow-hidden rounded-3xl border border-white/10"
            style={{
              width: "min(700px, 90vw)",
              height: "min(480px, 80vh)",
              background:
                "linear-gradient(145deg, rgba(20, 15, 50, 0.95) 0%, rgba(10, 8, 30, 0.98) 100%)",
              boxShadow:
                "0 0 80px rgba(168, 85, 247, 0.15), 0 0 30px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── Left Column: 3D Preview ─── */}
            <div className="relative flex-1 border-r border-white/5">
              {/* Header */}
              <div className="absolute top-4 left-0 right-0 z-10 text-center">
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{
                    color: "rgba(168, 85, 247, 0.7)",
                    textShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
                  }}
                >
                  Preview
                </span>
              </div>

              {/* Canvas */}
              <Canvas>
                <OrthographicCamera
                  makeDefault
                  position={[0, 0, 50]}
                  zoom={120}
                />
                <ambientLight intensity={0.6} />
                <directionalLight
                  position={[5, 8, 10]}
                  intensity={1.8}
                  castShadow
                />
                <directionalLight
                  position={[-5, 3, -5]}
                  intensity={0.4}
                  color="#a855f7"
                />
                <pointLight
                  position={[0, 0, 3]}
                  intensity={0.5}
                  color="#3b82f6"
                />
                <PreviewAvatar palette={draft} />
              </Canvas>

              {/* Subtle grid bg */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            {/* ─── Right Column: Color Pickers ─── */}
            <div
              className="flex flex-col justify-between p-6"
              style={{ width: "280px" }}
            >
              {/* Header Row */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-lg font-bold"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Customize
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Color Fields */}
                <div className="flex flex-col gap-3">
                  {COLOR_FIELDS.map(({ key, label, emoji }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <span className="text-base">{emoji}</span>
                      <span className="flex-1 text-sm font-medium text-white/80">
                        {label}
                      </span>
                      <label className="relative cursor-pointer">
                        <input
                          type="color"
                          value={draft[key]}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value)
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          style={{ width: "36px", height: "28px" }}
                        />
                        <div
                          className="rounded-lg border border-white/15 transition-shadow hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                          style={{
                            width: "36px",
                            height: "28px",
                            backgroundColor: draft[key],
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80 hover:bg-white/5"
                >
                  <RotateCcw size={14} />
                  Reset Defaults
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                  }}
                >
                  <Save size={14} />
                  Save & Apply
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
