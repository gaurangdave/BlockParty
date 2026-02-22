"use client";

import { useEffect, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, ContactShadows } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { VoxelAvatar } from "./VoxelAvatar";

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
  const [blockies, setBlockies] = useState([{ id: 0, x: 0 }]);

  const spawnBlocky = useCallback(() => {
    setBlockies((prev) => [
      ...prev,
      {
        id: Date.now(),
        // Random X between -10 and 10
        x: (Math.random() - 0.5) * 20,
      },
    ]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spawnBlocky();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spawnBlocky]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
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
          {blockies.map((blocky) => (
            <VoxelAvatar
              key={blocky.id}
              id={blocky.id}
              position={[blocky.x, 15, 0]}
            />
          ))}
        </Physics>
      </Canvas>
    </div>
  );
}
