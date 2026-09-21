import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sim } from "./sim";
import { useGameTextures } from "./textures";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function SkyDome() {
  const { sky } = useGameTextures();
  return (
    <mesh>
      <sphereGeometry args={[180, 32, 20]} />
      <meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

export function NightLights({ hangar = false }: { hangar?: boolean }) {
  return (
    <>
      <hemisphereLight args={["#9aafc0", "#1a140e", hangar ? 1.05 : 0.42]} />
      <ambientLight intensity={hangar ? 0.7 : 0.14} />
      <directionalLight
        position={[36, 52, 18]}
        intensity={hangar ? 2.4 : 0.55}
        color="#c5d4e2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      {hangar && (
        <>
          <pointLight position={[0, 4.2, 2]} intensity={28} distance={22} color="#efe6cc" />
          <pointLight position={[-4.2, 3.2, 0]} intensity={16} distance={14} color="#7ee0d0" />
          <pointLight position={[4.2, 3.2, 0]} intensity={16} distance={14} color="#e0a15a" />
        </>
      )}
    </>
  );
}

export function Terrain({ hangar = false }: { hangar?: boolean }) {
  const { earth, earthRough, concrete } = useGameTextures();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial
          map={hangar ? concrete : earth}
          roughnessMap={hangar ? undefined : earthRough}
          roughness={hangar ? 0.55 : 0.34}
          metalness={hangar ? 0.12 : 0.08}
          color={hangar ? "#9aa09c" : "#6a655c"}
        />
      </mesh>
      {!hangar && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -90]} receiveShadow>
          <planeGeometry args={[9, 240]} />
          <meshPhysicalMaterial
            color="#3a372f"
            roughness={0.22}
            metalness={0.12}
            clearcoat={0.7}
            clearcoatRoughness={0.18}
          />
        </mesh>
      )}
    </group>
  );
}

export function LatticeTower({ position }: { position: [number, number, number] }) {
  const { metal } = useGameTextures();
  return (
    <group position={position}>
      {[
        [-0.7, 0.7],
        [0.7, 0.7],
        [-0.7, -0.7],
        [0.7, -0.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 8, z]} castShadow>
          <boxGeometry args={[0.08, 16, 0.08]} />
          <meshStandardMaterial map={metal} color="#8b928c" metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 2 + i * 2.4, 0]}>
          <boxGeometry args={[1.5, 0.05, 1.5]} />
          <meshStandardMaterial color="#6e756f" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-2.4, 15.4, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[4.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9aa29c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[2.4, 15.4, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[4.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9aa29c" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-3.8, -2.2, 2.2, 3.8].map((x, i) => (
        <mesh key={i} position={[x, 14.9, 0]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color="#7ee0d0" emissive="#7ee0d0" emissiveIntensity={2.4} />
        </mesh>
      ))}
    </group>
  );
}

export function TowerLine() {
  const positions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const z = 20 - i * 32;
      list.push([-14, 0, z]);
      list.push([14, 0, z]);
    }
    return list;
  }, []);
  return (
    <group>
      {positions.map((p, i) => (
        <LatticeTower key={i} position={p} />
      ))}
      <Conductors />
    </group>
  );
}

function Conductors() {
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const z = 20 - i * 32;
      pts.push(new THREE.Vector3(-17.8, 14.6 - Math.sin(i) * 0.4, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 40, 0.04, 5, false);
  }, []);
  const geo2 = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const z = 20 - i * 32;
      pts.push(new THREE.Vector3(17.8, 14.6 - Math.cos(i) * 0.4, z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.04, 5, false);
  }, []);
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#2c3030" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh geometry={geo2}>
        <meshStandardMaterial color="#2c3030" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function OakField() {
  const trees = useMemo(() => {
    const rand = mulberry32(42);
    const list: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 42; i++) {
      const x = (rand() - 0.5) * 160;
      const z = (rand() - 0.5) * 220;
      if (Math.abs(x) < 18) continue;
      list.push({ x, z, s: 0.8 + rand() * 0.7 });
    }
    return list;
  }, []);
  const { bark } = useGameTextures();
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.34, 2.8, 6]} />
            <meshStandardMaterial map={bark} color="#3a2a1c" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.6, 0]} castShadow>
            <icosahedronGeometry args={[1.8, 1]} />
            <meshStandardMaterial color="#0f1612" roughness={0.85} />
          </mesh>
          <mesh position={[0.5, 4.2, -0.3]}>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial color="#152018" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Substation() {
  return (
    <group position={[0, 0, -200]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[10, 2.4, 6]} />
        <meshStandardMaterial color="#3a3f3c" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[4, 0.4, 2]} />
        <meshStandardMaterial color="#2a2e2c" metalness={0.6} roughness={0.35} />
      </mesh>
      {[-3, 0, 3].map((x) => (
        <pointLight key={x} position={[x, 3.4, 2.2]} color="#e0a15a" intensity={6} distance={22} />
      ))}
      <mesh position={[0, 3.6, 2.1]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#e0a15a" emissive="#e0a15a" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, 0.05, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 24]} />
        <meshStandardMaterial color="#7ee0d0" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

export function CamoShelter() {
  const { camo } = useGameTextures();
  return (
    <group position={[-7, 0, 10]}>
      <mesh rotation={[-0.55, 0.2, 0.05]} position={[0, 1.3, 0]} castShadow>
        <planeGeometry args={[5.2, 3.4]} />
        <meshStandardMaterial map={camo} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[-2.2, 0.9, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshStandardMaterial color="#2a2c28" />
      </mesh>
      <mesh position={[2.1, 0.8, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color="#2a2c28" />
      </mesh>
    </group>
  );
}

export function HangarShell() {
  const { metal, concrete } = useGameTextures();
  return (
    <group>
      <mesh position={[0, 4.6, -8]} receiveShadow>
        <boxGeometry args={[22, 9, 0.4]} />
        <meshStandardMaterial map={metal} color="#3a423e" metalness={0.38} roughness={0.58} />
      </mesh>
      <mesh position={[-11, 4.6, 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[20, 9, 0.35]} />
        <meshStandardMaterial color="#2a322e" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[11, 4.6, 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[20, 9, 0.35]} />
        <meshStandardMaterial color="#2a322e" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[0, 9.1, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[22, 20, 0.3]} />
        <meshStandardMaterial color="#2c3330" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.02, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 18]} />
        <meshStandardMaterial map={concrete} roughness={0.52} metalness={0.12} color="#8f948f" />
      </mesh>
      {[-6, 0, 6].map((x) => (
        <group key={x}>
          <spotLight
            position={[x, 8.2, 1]}
            angle={0.55}
            penumbra={0.5}
            intensity={80}
            distance={18}
            color="#e8e4d6"
            castShadow
          />
          <mesh position={[x, 8.05, 1]}>
            <boxGeometry args={[0.45, 0.12, 0.45]} />
            <meshStandardMaterial color="#efe6cc" emissive="#efe6cc" emissiveIntensity={2.4} />
          </mesh>
        </group>
      ))}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 0.04, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 20]} />
          <meshStandardMaterial color="#2a2e2c" />
        </mesh>
      ))}
      <mesh position={[-8.2, 0.45, 3.2]} castShadow>
        <boxGeometry args={[1.4, 0.9, 0.7]} />
        <meshStandardMaterial map={metal} color="#4a524c" metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[-8.2, 0.95, 3.2]} castShadow>
        <boxGeometry args={[1.2, 0.12, 0.55]} />
        <meshStandardMaterial color="#2a2e2c" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[8.4, 0.35, 4]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#1c201e" roughness={0.6} />
      </mesh>
      <mesh position={[8.4, 0.85, 4.05]}>
        <boxGeometry args={[0.22, 0.28, 0.18]} />
        <meshStandardMaterial color="#7ee0d0" emissive="#7ee0d0" emissiveIntensity={1.6} />
      </mesh>
      <CrateStack position={[-8.4, 0, 6.2]} />
      <FuelDrum position={[7.6, 0, 6.4]} />
      <FuelDrum position={[8.2, 0, 6.1]} />
      <Generator position={[8.6, 0, 1.2]} />
    </group>
  );
}

export function SalvageOrb({ position, taken }: { position: [number, number, number]; taken: boolean }) {
  if (taken) return null;
  return (
    <group position={position}>
      <mesh>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#7ee0d0" emissive="#7ee0d0" emissiveIntensity={2.2} />
      </mesh>
      <pointLight color="#7ee0d0" intensity={3.5} distance={6} />
    </group>
  );
}

export function FleetGrid() {
  return <gridHelper args={[90, 45, "#1c4a44", "#10221f"]} position={[0, 0.05, 0]} />;
}

export function FuelDrum({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.84, 12]} />
        <meshStandardMaterial color="#4a3a28" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.05, 12]} />
        <meshStandardMaterial color="#2a241c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0.29]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshStandardMaterial color="#c45c4a" emissive="#c45c4a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export function CrateStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.7, 0.56, 0.7]} />
        <meshStandardMaterial color="#5a4a32" roughness={0.78} />
      </mesh>
      <mesh position={[0.12, 0.78, -0.05]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.62, 0.44, 0.62]} />
        <meshStandardMaterial color="#4a3e2a" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Floodlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.8, 8]} />
        <meshStandardMaterial color="#3a403c" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.15, 2.75, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.28, 0.16, 0.22]} />
        <meshStandardMaterial color="#efe6cc" emissive="#efe6cc" emissiveIntensity={2.2} />
      </mesh>
      <spotLight
        position={[0.2, 2.7, 0]}
        angle={0.55}
        penumbra={0.5}
        intensity={18}
        distance={16}
        color="#efe6cc"
      />
    </group>
  );
}

export function LandingPad({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[2.2, 28]} />
        <meshStandardMaterial color="#1c2420" metalness={0.3} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.85, 2.05, 28]} />
        <meshBasicMaterial color="#7ee0d0" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[0.15, 0.28, 16]} />
        <meshBasicMaterial color="#e0a15a" />
      </mesh>
    </group>
  );
}

export function CheckpointGate() {
  const bar = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!bar.current) return;
    const live = sim.salvage >= sim.waveNeed && !sim.won;
    bar.current.emissiveIntensity = live ? 3.4 + Math.sin(sim.time * 6) * 1.2 : 0.7;
  });
  return (
    <group>
      <mesh position={[-4.2, 2.1, 0]} castShadow>
        <boxGeometry args={[0.16, 4.2, 0.16]} />
        <meshStandardMaterial color="#3a423e" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[4.2, 2.1, 0]} castShadow>
        <boxGeometry args={[0.16, 4.2, 0.16]} />
        <meshStandardMaterial color="#3a423e" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[8.6, 0.14, 0.14]} />
        <meshStandardMaterial
          ref={bar}
          color="#7ee0d0"
          emissive="#7ee0d0"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[2.4, 2.7, 28]} />
        <meshBasicMaterial color="#7ee0d0" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function CommsDish({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 1.4, 8]} />
        <meshStandardMaterial color="#4a524c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, 0.1]} rotation={[0.7, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 24]} />
        <meshStandardMaterial color="#c5cdc8" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.7, 0.02]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#7ee0d0" emissive="#7ee0d0" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

export function Generator({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.9, 0.76, 0.55]} />
        <meshStandardMaterial color="#3a423e" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0.2, 0.82, 0]}>
        <boxGeometry args={[0.28, 0.12, 0.28]} />
        <meshStandardMaterial color="#e0a15a" emissive="#e0a15a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.28, 0.55, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 8]} />
        <meshStandardMaterial color="#2a2e2c" />
      </mesh>
    </group>
  );
}

export function FleetYard() {
  return (
    <group>
      <LandingPad position={[0, 0, 0]} />
      <LandingPad position={[-10, 0, -14]} />
      <LandingPad position={[10, 0, -14]} />
      <Floodlight position={[-12, 0, 6]} />
      <Floodlight position={[12, 0, 6]} />
      <Floodlight position={[-8, 0, -22]} />
      <Floodlight position={[8, 0, -22]} />
      <CrateStack position={[7.5, 0, 4]} />
      <CrateStack position={[8.4, 0, 4.8]} />
      <FuelDrum position={[-8.2, 0, 3.4]} />
      <FuelDrum position={[-7.5, 0, 3.8]} />
      <FuelDrum position={[-7.8, 0, 4.5]} />
      <Generator position={[9.2, 0, -4]} />
      <CommsDish position={[-11, 0, -6]} />
    </group>
  );
}

export function FieldClutter() {
  return (
    <group>
      <CrateStack position={[7.2, 0, -8]} />
      <CrateStack position={[-8.4, 0, -36]} />
      <FuelDrum position={[6.6, 0, -24]} />
      <FuelDrum position={[7.2, 0, -23.4]} />
      <FuelDrum position={[-7.1, 0, -88]} />
      <Floodlight position={[8.5, 0, 6]} />
      <Floodlight position={[-8.5, 0, 6]} />
      <Generator position={[8, 0, -118]} />
      <CommsDish position={[-9, 0, -70]} />
    </group>
  );
}
