import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";

// A simple deterministic pseudo-random generator based on an ID
// or just simple random colors.
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Generates a similar color (variation)
const getColorVariation = (baseColor: string, amount: number) => {
  const c = new THREE.Color(baseColor);
  c.addScalar(amount);
  return "#" + c.getHexString();
};

export interface VoxelAvatarProps {
  id: string | number;
  position?: [number, number, number];
  colorPalette?: {
    skin?: string;
    shirt?: string;
    pants?: string;
    shoes?: string;
  };
}

export function VoxelAvatar({
  id,
  position = [0, 5, 0],
  colorPalette,
}: VoxelAvatarProps) {
  // Memoize randomized colors so they don't change on re-renders
  const colors = useMemo(() => {
    const skin = colorPalette?.skin || "#ffccaa"; // default skin
    const shirt = colorPalette?.shirt || getRandomColor();
    const pants = colorPalette?.pants || getRandomColor();
    const shoes = colorPalette?.shoes || getColorVariation(pants, -0.2); // darker pants color for shoes
    return { skin, shirt, pants, shoes };
  }, [colorPalette]);

  // Overall bounds for the physics collider
  // A Minecraft character is 1 unit wide, 2 units high, 0.5 units deep roughly.
  // We'll use 1 x 2 x 0.5 for the bounds.
  const width = 1;
  const height = 2;
  const depth = 0.5;

  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [width, height, depth],
    // Keep them upright for now (lock rotations) to behave more like characters
    fixedRotation: true,
  }));

  // Internal group to animate slightly for "breathing" and visual hop
  const internalGroupRef = useRef<THREE.Group>(null);

  // Track velocity
  const velocity = useRef([0, 0, 0]);
  useMemo(() => {
    api.velocity.subscribe((v) => (velocity.current = v));
  }, [api.velocity]);

  useFrame((state) => {
    if (!internalGroupRef.current) return;

    // Check if grounded (rough estimate: y velocity is near 0)
    const isGrounded = Math.abs(velocity.current[1]) < 0.1;

    if (isGrounded) {
      // 1. Breathing Animation (subtle vertical scale/position bounce)
      const t = state.clock.elapsedTime;
      // Breathe rate: based on ID so they don't all breathe sync
      const phase = (typeof id === "number" ? id : 0) * 10;
      const breathe = Math.sin(t * 2 + phase) * 0.02;

      // Apply slight scale and position bounce
      internalGroupRef.current.position.y = breathe;
      // Arms could swing slightly? We could do more complex stuff, but simple is good for now.

      // 2. Occasional Hop / Walk
      // Random chance to move
      if (Math.random() < 0.005) {
        // 0.5% chance per frame (~once every few seconds)
        // Hop upward slightly
        api.velocity.set(
          velocity.current[0] + (Math.random() - 0.5) * 2, // hop left/right/forward/back
          3, // jump strength
          velocity.current[2] + (Math.random() - 0.5) * 2,
        );
      } else if (Math.random() < 0.01) {
        // 1% chance to just nudge
        api.velocity.set(
          (Math.random() - 0.5) * 2,
          velocity.current[1],
          (Math.random() - 0.5) * 2,
        );
      }
    } else {
      // Reset breathing when falling
      internalGroupRef.current.position.y = THREE.MathUtils.lerp(
        internalGroupRef.current.position.y,
        0,
        0.1,
      );
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={internalGroupRef}>
        {/* Head */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 0.125, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.75, 0.25]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>

        {/* Left Arm */}
        <mesh position={[-0.375, 0.125, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
        {/* Left Sleeve */}
        <mesh position={[-0.375, 0.375, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.25, 0.26]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>

        {/* Right Arm */}
        <mesh position={[0.375, 0.125, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
        {/* Right Sleeve */}
        <mesh position={[0.375, 0.375, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.25, 0.26]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>

        {/* Left Leg */}
        <mesh position={[-0.125, -0.625, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>

        {/* Right Leg */}
        <mesh position={[0.125, -0.625, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.125, -0.9, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.2, 0.3]} />
          <meshStandardMaterial color={colors.shoes} />
        </mesh>
        <mesh position={[0.125, -0.9, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.2, 0.3]} />
          <meshStandardMaterial color={colors.shoes} />
        </mesh>
      </group>
    </group>
  );
}
