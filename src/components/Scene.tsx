"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, ContactShadows } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { VoxelAvatar } from "./VoxelAvatar";
import { useBlockPartySync } from "../hooks/useBlockPartySync";
import { useSettingsStore } from "../store/useSettingsStore";
import { useCommandCenterStore } from "../store/useCommandCenterStore";
import { useFirebaseMessages } from "../hooks/useFirebaseMessages";

function Floor() {
  const { viewport } = useThree();

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
  useFirebaseMessages(); // Initialize messages listener
  const { activeUsers } = useBlockPartySync();
  const movementEnabled = useSettingsStore((state) => state.movementEnabled);
  const selfUserId = useCommandCenterStore((state) => state.selfUserId);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
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
              enableRandomWalk={movementEnabled}
              isSelf={user.id === selfUserId}
            />
          ))}
        </Physics>
      </Canvas>
    </div>
  );
}
