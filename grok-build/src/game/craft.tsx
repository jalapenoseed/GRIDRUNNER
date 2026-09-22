import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sim } from "./sim";
import { useGameTextures } from "./textures";
import { BEACON, type Airframe } from "./types";

function Metal({ extra }: { extra?: THREE.MeshStandardMaterialParameters }) {
  const { metal, metalRough } = useGameTextures();
  return (
    <meshStandardMaterial
      map={metal}
      roughnessMap={metalRough}
      metalness={0.72}
      roughness={0.38}
      color="#9aa3a0"
      {...extra}
    />
  );
}

export function BeaconGlow({
  color,
  scale = 1,
  strobe = true,
}: {
  color: string;
  scale?: number;
  strobe?: boolean;
}) {
  const { glow } = useGameTextures();
  const mat = useRef<THREE.SpriteMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current || !strobe) return;
    const t = clock.elapsedTime;
    const pulse = 0.55 + Math.sin(t * 6.2) * 0.12;
    const flash = Math.sin(t * 9) > 0.97 ? 1 : pulse;
    mat.current.opacity = flash;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.06 * scale, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <sprite scale={[1.15 * scale, 1.15 * scale, 1]}>
        <spriteMaterial
          ref={mat}
          map={glow}
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
        />
      </sprite>
    </group>
  );
}

function Rotors({ span, y = 0.04 }: { span: number; y?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    let rpm = 48;
    let obj: THREE.Object3D | null = ref.current;
    while (obj) {
      if (obj.userData.airborne === false) {
        rpm = 9;
        break;
      }
      if (obj.userData.airborne === true) {
        rpm = 54;
        break;
      }
      obj = obj.parent;
    }
    ref.current.rotation.y += dt * rpm;
  });
  const arms = useMemo(() => {
    const s = span;
    return [
      [s, s],
      [s, -s],
      [-s, s],
      [-s, -s],
    ] as const;
  }, [span]);
  return (
    <group ref={ref} position={[0, y, 0]}>
      {arms.map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.01, 20]} />
          <meshStandardMaterial
            color="#cfd8d4"
            transparent
            opacity={0.22}
            roughness={0.2}
            metalness={0.4}
            emissive="#8fd0c8"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Drone({
  kind,
  scale = 1,
}: {
  kind: Airframe;
  scale?: number;
}) {
  const color = BEACON[kind];
  return (
    <group scale={scale}>
      {kind === "scout" && <ScoutBody color={color} />}
      {kind === "relay" && <RelayBody color={color} />}
      {kind === "utility" && <UtilityBody color={color} />}
      {kind === "cargo" && <CargoBody color={color} />}
    </group>
  );
}

function ScoutBody({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.22, 0.09, 0.5]} />
        <Metal extra={{ color: "#6d7572" }} />
      </mesh>
      <mesh position={[0, -0.02, 0.18]} castShadow>
        <boxGeometry args={[0.16, 0.06, 0.16]} />
        <meshStandardMaterial color="#1a1d1c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, -0.18]}>
        <boxGeometry args={[0.18, 0.03, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      </mesh>
      {[
        [0.16, 0.16],
        [0.16, -0.16],
        [-0.16, 0.16],
        [-0.16, -0.16],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x * 1.1, 0, z * 1.1]}>
          <boxGeometry args={[0.28, 0.025, 0.035]} />
          <Metal extra={{ color: "#8a918c" }} />
        </mesh>
      ))}
      <Rotors span={0.28} />
      <group position={[0, 0.12, 0]}>
        <BeaconGlow color={color} scale={1.1} />
      </group>
    </group>
  );
}

function RelayBody({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.16, 6]} />
        <Metal extra={{ color: "#7b8480" }} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 24]} />
        <Metal extra={{ color: "#c5cdc8" }} />
      </mesh>
      <mesh position={[0.08, 0.28, -0.02]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
        <meshStandardMaterial color="#d0d6d2" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.08, 0.3, -0.02]}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 6]} />
        <meshStandardMaterial color="#d0d6d2" metalness={0.8} roughness={0.25} />
      </mesh>
      {[
        [0.2, 0.2],
        [0.2, -0.2],
        [-0.2, 0.2],
        [-0.2, -0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.22, 0.02, 0.03]} />
          <Metal />
        </mesh>
      ))}
      <Rotors span={0.32} y={0.02} />
      <group position={[0, 0.14, 0.12]}>
        <BeaconGlow color={color} />
      </group>
    </group>
  );
}

function UtilityBody({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.2, 0.38]} />
        <Metal extra={{ color: "#6a706c" }} />
      </mesh>
      <mesh position={[0.22, -0.08, 0.12]} rotation={[0.4, 0, 0.2]}>
        <boxGeometry args={[0.06, 0.06, 0.28]} />
        <meshStandardMaterial color="#2a2d2c" roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0.22, -0.2, 0.24]}>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
        <meshStandardMaterial color="#3a3f3c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.14, -0.02, 0]}>
        <boxGeometry args={[0.1, 0.14, 0.2]} />
        <meshStandardMaterial color="#1c1f1e" roughness={0.6} />
      </mesh>
      <Rotors span={0.3} y={0.12} />
      <group position={[0, 0.2, 0]}>
        <BeaconGlow color={color} scale={1.15} />
      </group>
    </group>
  );
}

function CargoBody({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.16, 0.4]} />
        <Metal extra={{ color: "#5e6662" }} />
      </mesh>
      <mesh position={[0.28, -0.02, 0]} castShadow>
        <boxGeometry args={[0.16, 0.18, 0.28]} />
        <meshStandardMaterial color="#2e3330" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-0.28, -0.02, 0]} castShadow>
        <boxGeometry args={[0.16, 0.18, 0.28]} />
        <meshStandardMaterial color="#2e3330" roughness={0.5} metalness={0.4} />
      </mesh>
      <Rotors span={0.34} y={0.1} />
      <group position={[0, 0.18, 0]}>
        <BeaconGlow color={color} scale={1.2} />
      </group>
    </group>
  );
}

export function HostileDrone({ scale = 1.4 }: { scale?: number }) {
  return (
    <group scale={scale} userData={{ airborne: true }}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.1, 0.48]} />
        <meshStandardMaterial color="#2a1c1a" metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.02, 0.2]}>
        <boxGeometry args={[0.16, 0.06, 0.14]} />
        <meshStandardMaterial color="#1a1010" roughness={0.5} />
      </mesh>
      {[
        [0.18, 0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [-0.18, -0.18],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.26, 0.02, 0.03]} />
          <meshStandardMaterial color="#3a2a28" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <Rotors span={0.3} />
      <group position={[0, 0.12, 0]}>
        <BeaconGlow color="#c45c4a" scale={1.15} />
      </group>
    </group>
  );
}

/**
 * Dual-sport mesh is built facing +Z (headlight, forks, front wheel).
 * Vehicle sim yaw=0 travels toward world −Z, so the whole craft is yawed
 * 180° here. Chase cam then sees the rider's back, not the headlight.
 */
export function Bike() {
  const lean = useRef<THREE.Group>(null);
  const { metal, metalRough } = useGameTextures();

  useFrame((_, dt) => {
    if (!lean.current) return;
    lean.current.rotation.z = THREE.MathUtils.damp(
      lean.current.rotation.z,
      sim.mode === "field" ? sim.bike.lean : 0,
      10,
      dt,
    );
    lean.current.rotation.x = THREE.MathUtils.damp(
      lean.current.rotation.x,
      sim.mode === "field" ? -sim.bike.pitch : 0,
      8,
      dt,
    );
  });

  return (
    <group rotation={[0, Math.PI, 0]}>
      <group ref={lean}>
        <mesh position={[0, 0.5, -0.02]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.95]} />
          <meshStandardMaterial
            map={metal}
            roughnessMap={metalRough}
            metalness={0.7}
            roughness={0.36}
            color="#4a524e"
          />
        </mesh>
        <mesh position={[0, 0.62, 0.12]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.16, 0.48]} />
          <meshStandardMaterial color="#1a1e1c" roughness={0.52} metalness={0.28} />
        </mesh>
        <mesh position={[0, 0.58, -0.28]} rotation={[-0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.36]} />
          <meshStandardMaterial color="#25221c" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.48, 0.38]} rotation={[0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.42]} />
          <meshStandardMaterial
            map={metal}
            metalness={0.82}
            roughness={0.28}
            color="#b4bcb6"
          />
        </mesh>
        <mesh position={[0, 0.72, 0.52]}>
          <boxGeometry args={[0.58, 0.03, 0.03]} />
          <meshStandardMaterial color="#161817" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0.26, 0.7, 0.52]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.025, 0.03, 0.08, 8]} />
          <meshStandardMaterial color="#1c1f1e" roughness={0.5} />
        </mesh>
        <mesh position={[-0.26, 0.7, 0.52]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.025, 0.03, 0.08, 8]} />
          <meshStandardMaterial color="#1c1f1e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.44, 0.68]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.16]} />
          <meshStandardMaterial color="#1a1c1b" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.7, 0.74]}>
          <cylinderGeometry args={[0.07, 0.08, 0.06, 16]} />
          <meshStandardMaterial
            color="#f6f2e6"
            emissive="#f4e6c4"
            emissiveIntensity={4.2}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.7, 0.78]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#fff6d8" />
        </mesh>
        <mesh position={[0, 0.42, -0.62]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.18]} />
          <meshStandardMaterial color="#1a1c1b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.5, -0.58]}>
          <boxGeometry args={[0.08, 0.04, 0.05]} />
          <meshStandardMaterial color="#c45c4a" emissive="#c45c4a" emissiveIntensity={2.4} />
        </mesh>
        <mesh position={[0.09, 0.38, 0.08]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.04, 0.04, 0.55]} />
          <meshStandardMaterial color="#2a2e2c" metalness={0.6} roughness={0.4} />
        </mesh>
        <Rider />
        <Wheel z={0.48} />
        <Wheel z={-0.5} />
        <Headlamp />
        <pointLight position={[0, 1.05, 0.1]} intensity={3.2} distance={8} color="#dfe8e2" />
      </group>
    </group>
  );
}

function Rider() {
  return (
    <group position={[0, 0.78, -0.02]}>
      <mesh position={[0, 0.22, 0.04]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.34, 0.22]} />
        <meshStandardMaterial color="#1c221f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.48, 0.1]} castShadow>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshStandardMaterial color="#141716" roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.5, 0.2]}>
        <boxGeometry args={[0.16, 0.07, 0.04]} />
        <meshStandardMaterial color="#0e1010" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.02, 0.18]} rotation={[0.7, 0, 0.15]}>
        <boxGeometry args={[0.08, 0.08, 0.28]} />
        <meshStandardMaterial color="#222826" roughness={0.65} />
      </mesh>
      <mesh position={[-0.12, 0.02, 0.18]} rotation={[0.7, 0, -0.15]}>
        <boxGeometry args={[0.08, 0.08, 0.28]} />
        <meshStandardMaterial color="#222826" roughness={0.65} />
      </mesh>
      <mesh position={[0.1, -0.18, -0.08]} rotation={[0.55, 0, 0.08]}>
        <boxGeometry args={[0.09, 0.12, 0.32]} />
        <meshStandardMaterial color="#1a1d1c" roughness={0.75} />
      </mesh>
      <mesh position={[-0.1, -0.18, -0.08]} rotation={[0.55, 0, -0.08]}>
        <boxGeometry args={[0.09, 0.12, 0.32]} />
        <meshStandardMaterial color="#1a1d1c" roughness={0.75} />
      </mesh>
    </group>
  );
}

function Headlamp() {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && target.current) {
      light.current.target = target.current;
    }
  }, []);
  return (
    <>
      <spotLight
        ref={light}
        position={[0, 0.72, 0.82]}
        angle={0.46}
        penumbra={0.42}
        intensity={58}
        distance={68}
        color="#f3ead2"
        castShadow={false}
      />
      <object3D ref={target} position={[0, 0.28, 16]} />
    </>
  );
}

function Wheel({ z }: { z: number }) {
  const spin = useRef<THREE.Group>(null);
  const nubs = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);
  }, []);
  useFrame(() => {
    if (spin.current) spin.current.rotation.x = sim.bike.wheel;
  });
  return (
    <group position={[0, 0.3, z]}>
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.13, 18]} />
          <meshStandardMaterial color="#121413" roughness={0.92} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.15, 14]} />
          <meshStandardMaterial color="#c5cdc6" metalness={0.85} roughness={0.28} />
        </mesh>
        {nubs.map((a, i) => (
          <mesh
            key={i}
            position={[0, Math.cos(a) * 0.3, Math.sin(a) * 0.3]}
            rotation={[a, 0, Math.PI / 2]}
          >
            <boxGeometry args={[0.05, 0.14, 0.04]} />
            <meshStandardMaterial color="#0d0e0d" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function WatchUnit() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.2, 8]} />
        <meshStandardMaterial color="#2a2e2c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.28, 0.08]}>
        <boxGeometry args={[0.22, 0.14, 0.18]} />
        <meshStandardMaterial color="#111413" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.28, 0.18]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#c45c4a" emissive="#c45c4a" emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.9, 0.4]}>
        <coneGeometry args={[1.6, 4.2, 16, 1, true]} />
        <meshBasicMaterial
          color="#c45c4a"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
