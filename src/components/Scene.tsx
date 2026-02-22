"use client";

import { useEffect, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, ContactShadows } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { VoxelAvatar } from "./VoxelAvatar";
import { useBlockPartySync } from "../hooks/useBlockPartySync";

function Floor() {
  const { viewport } = useThree();

  // The floor alignment at the bottom:
  // For perspective: Height = 2 * tan(FOV/2) * Distance
  // For orthographic: Height is directly given by top/bottom bounds
  // R3F's viewport.height handles this dynamically on resize for both!
  const floorY = -viewport.height / 2;

  const [ref, api] = usePlane(() => ({
    position: [0, floorY, 0],
    rotation: [-Math.PI / 2, 0, 0],
    type: "Static",
  }));

  // Update floor position when viewport changes
  useEffect(() => {
    api.position.set(0, -viewport.height / 2, 0);
  }, [viewport.height, api]);

  return (
    <group>
      <mesh ref={ref as any} receiveShadow visible={false}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <ContactShadows
        position={[0, floorY + 0.01, 0]}
        scale={20}
        blur={2}
        far={15}
        opacity={0.5}
      />
    </group>
  );
}

export default function Scene() {
  const { activeUsers } = useBlockPartySync();
  const [enableRandomWalk, setEnableRandomWalk] = useState(true);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* UI Overlay for Toggle */}
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10 }}>
        <button
          onClick={() => setEnableRandomWalk((prev) => !prev)}
          className="rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-black/70 border border-white/10"
        >
          {enableRandomWalk ? "🚶 Random Walk: ON" : "🧍 Random Walk: OFF"}
        </button>
      </div>

      <Canvas shadows>
        <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={50} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Physics>
          <Floor />
          {activeUsers.map((user) => (
            <VoxelAvatar
              key={user.id}
              id={user.id}
              position={user.position}
              colorPalette={user.colorPalette}
              enableRandomWalk={enableRandomWalk}
            />
          ))}
        </Physics>
      </Canvas>
    </div>
  );
}
