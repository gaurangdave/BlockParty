import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useSettingsStore } from "../store/useSettingsStore";
import { useMessagesStore } from "../store/useMessagesStore";
import { useCommandCenterStore } from "../store/useCommandCenterStore";
import { ComicBubble } from "./ComicBubble";
import { CommandMenu } from "./CommandMenu";

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
  enableRandomWalk?: boolean;
  isSelf?: boolean;
}

export function VoxelAvatar({
  id,
  position = [0, 5, 0],
  colorPalette,
  enableRandomWalk = true,
  isSelf = false,
}: VoxelAvatarProps) {
  const { viewport } = useThree();
  const isInteractive = useSettingsStore((state) => state.isInteractive);
  const [isDragging, setIsDragging] = useState(false);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);

  const messages = useMessagesStore((state) => state.messages);
  const userIdStr = id.toString();
  const message = messages[userIdStr];
  const hasUnread = message ? !message.isRead : false;

  // Command Center state
  const isMenuOpen = useCommandCenterStore((state) => state.isMenuOpen);
  const setMenuOpen = useCommandCenterStore((state) => state.setMenuOpen);
  const isPartyHidden = useCommandCenterStore((state) => state.isPartyHidden);

  // Track message count for jump notification
  const prevMessageCount = useRef(Object.keys(messages).length);

  // Memoize randomized colors so they don't change on re-renders
  const colors = useMemo(() => {
    const skin = colorPalette?.skin || "#ffccaa"; // default skin
    const shirt = colorPalette?.shirt || getRandomColor();
    const pants = colorPalette?.pants || getRandomColor();
    const shoes = colorPalette?.shoes || getColorVariation(pants, -0.2); // darker pants color for shoes
    return { skin, shirt, pants, shoes };
  }, [colorPalette]);

  // Overall bounds for the physics collider
  const width = 1;
  const height = 2;
  const depth = 0.5;

  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [width, height, depth],
    fixedRotation: true,
    allowSleep: false,
  }));

  // Internal group to animate slightly for "breathing" and visual hop
  const internalGroupRef = useRef<THREE.Group>(null);

  // Star rotation ref (for animated spinning star)
  const starGroupRef = useRef<THREE.Group>(null);

  // Track velocity
  const velocity = useRef([0, 0, 0]);
  useMemo(() => {
    api.velocity.subscribe((v) => (velocity.current = v));
  }, [api.velocity]);

  // Track position
  const currentPos = useRef([0, 0, 0]);
  useMemo(() => {
    api.position.subscribe((p) => (currentPos.current = p));
  }, [api.position]);

  // Jump notification: when party is hidden and a new message arrives, make self avatar hop
  useEffect(() => {
    if (!isSelf || !isPartyHidden) {
      prevMessageCount.current = Object.keys(messages).length;
      return;
    }

    const currentCount = Object.keys(messages).length;
    if (currentCount > prevMessageCount.current) {
      // New message arrived while party is hidden — hop!
      api.velocity.set(0, 5, 0);
    }
    prevMessageCount.current = currentCount;
  }, [messages, isSelf, isPartyHidden, api]);

  useFrame((state) => {
    if (!internalGroupRef.current) return;

    // Rotate the star indicator for self avatar
    if (starGroupRef.current) {
      starGroupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    }

    if (isDragging) {
      // Map pointer to orthographic world coordinates
      const x = (state.pointer.x * viewport.width) / 2;
      const y = (state.pointer.y * viewport.height) / 2;
      const floorY = -viewport.height / 2 + height / 2;

      api.position.set(x, Math.max(y, floorY), 0);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);

      internalGroupRef.current.position.y = 0;

      // Add wobble effect
      const t = state.clock.elapsedTime;
      internalGroupRef.current.rotation.z = Math.sin(t * 15) * 0.1;

      return;
    }

    // Reset rotation if not dragging
    internalGroupRef.current.rotation.z = THREE.MathUtils.lerp(
      internalGroupRef.current.rotation.z,
      0,
      0.1,
    );

    // Check if grounded
    const isGrounded = Math.abs(velocity.current[1]) < 0.1;

    if (isGrounded) {
      const t = state.clock.elapsedTime;
      const numericId =
        typeof id === "number"
          ? id
          : id.charCodeAt(0) + id.charCodeAt(id.length - 1);
      const phase = numericId * 10;
      const breathe = Math.sin(t * 2 + phase) * 0.02;

      internalGroupRef.current.position.y = breathe;

      if (enableRandomWalk && !isBubbleOpen && !(isSelf && isMenuOpen)) {
        if (Math.random() < 0.005) {
          const horizontalImpulse = (Math.random() - 0.5) * 2;
          const newX = currentPos.current[0] + horizontalImpulse;
          const bound = viewport.width / 2 - width;
          const safeHorizontalImpulse =
            newX > bound
              ? -Math.abs(horizontalImpulse)
              : newX < -bound
                ? Math.abs(horizontalImpulse)
                : horizontalImpulse;

          api.velocity.set(velocity.current[0] + safeHorizontalImpulse, 3, 0);
        } else if (Math.random() < 0.01) {
          const horizontalNudge = (Math.random() - 0.5) * 2;
          const newX = currentPos.current[0] + horizontalNudge;
          const bound = viewport.width / 2 - width;
          const safeHorizontalNudge =
            newX > bound
              ? -Math.abs(horizontalNudge)
              : newX < -bound
                ? Math.abs(horizontalNudge)
                : horizontalNudge;

          api.velocity.set(safeHorizontalNudge, velocity.current[1], 0);
        }
      }
    } else {
      internalGroupRef.current.position.y = THREE.MathUtils.lerp(
        internalGroupRef.current.position.y,
        0,
        0.1,
      );
    }
  });

  const gl = useThree((state) => state.gl);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;

    e.stopPropagation();
    try {
      gl.domElement.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed capture", err);
    }

    setIsDragging(true);
    document.body.style.cursor = "grabbing";

    // @ts-ignore
    api.mass.set(0); // make kinematic
    api.velocity.set(0, 0, 0);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isDragging) {
      try {
        gl.domElement.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.warn("Failed release", err);
      }
    }
    setIsDragging(false);
    api.mass.set(1); // make dynamic
    document.body.style.cursor = "grab";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();

    // Use delta to distinguish between click and drag
    if (e.delta <= 2) {
      if (isSelf) {
        // Toggle the command menu for self avatar
        setMenuOpen(!isMenuOpen);
      } else if (message) {
        setIsBubbleOpen(true);
      }
    }
  };

  // If party is hidden and this is NOT self, hide visually but keep physics body alive
  const isHidden = isPartyHidden && !isSelf;

  return (
    <group
      ref={ref as any}
      visible={!isHidden}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = isDragging ? "grabbing" : "grab";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          document.body.style.cursor = "auto";
        }
      }}
    >
      <group ref={internalGroupRef}>
        {/* ─── Self Avatar: Star Indicator ─── */}
        {isSelf && (
          <group ref={starGroupRef} position={[0, 1.35, 0]}>
            <Html center zIndexRange={[50, 0]}>
              <div
                className="pointer-events-none select-none"
                style={{
                  fontSize: "18px",
                  filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))",
                  animation: "float 2s ease-in-out infinite",
                }}
              >
                ⭐
              </div>
              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-4px); }
                }
              `}</style>
            </Html>
          </group>
        )}

        {/* ─── Self Avatar: Glow Light ─── */}
        {isSelf && (
          <pointLight
            position={[0, 0.5, 1]}
            color="#fbbf24"
            intensity={1.5}
            distance={4}
            decay={2}
          />
        )}

        {/* ─── Command Menu (Self Only) ─── */}
        {isSelf && isMenuOpen && <CommandMenu />}

        {/* Floating Notification */}
        {hasUnread && !isBubbleOpen && !isSelf && (
          <Html position={[0, 1.2, 0]} center zIndexRange={[50, 0]}>
            <div className="animate-bounce bg-yellow-400 text-black font-extrabold border-2 border-black rounded-full w-6 h-6 flex items-center justify-center pointer-events-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
              !
            </div>
          </Html>
        )}

        {/* Comic Bubble */}
        {isBubbleOpen && message && (
          <ComicBubble
            userId={userIdStr}
            messageText={message.text}
            onClose={() => setIsBubbleOpen(false)}
          />
        )}

        {/* Head */}
        <group position={[0, 0.75, 0]}>
          <mesh castShadow receiveShadow>
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
            <meshStandardMaterial
              color={getColorVariation(colors.skin, -0.1)}
            />
          </mesh>
        </group>

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
