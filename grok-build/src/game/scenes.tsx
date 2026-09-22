import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { fleetCam } from "./cam";
import { Bike, BeaconGlow, Drone, HostileDrone, WatchUnit } from "./craft";
import { catalogById } from "./catalog";
import { sim, stepSim } from "./sim";
import { useGame } from "./store";
import { HostileSwarm, LiveSwarm } from "./swarm";
import { AIRFRAMES, type Airframe } from "./types";
import {
  CamoShelter,
  CheckpointGate,
  CommsDish,
  CrateStack,
  FieldClutter,
  FleetYard,
  Floodlight,
  FuelDrum,
  Generator,
  HangarShell,
  LandingPad,
  LatticeTower,
  NightLights,
  OakField,
  SalvageOrb,
  SkyDome,
  Substation,
  Terrain,
  TowerLine,
} from "./world";

const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _punch = new THREE.Vector3();

function syncStore() {
  const s = useGame.getState();
  sim.paused = s.paused;
  sim.formation = s.formation;
  sim.boids = s.boids;
  sim.mode = s.mode === "library" ? "library" : s.mode;
  sim.cam = s.camView;
  sim.stance = s.stance;
}

export function FieldScene() {
  const bike = useRef<THREE.Group>(null);
  const watch = useRef<THREE.Group>(null);
  const gate = useRef<THREE.Group>(null);

  useFrame(({ camera }, dt) => {
    syncStore();
    stepSim(dt);
    const b = sim.bike;
    if (bike.current) {
      bike.current.position.set(b.x, b.y, b.z);
      bike.current.rotation.y = b.yaw;
    }
    if (watch.current) {
      watch.current.position.set(sim.watch.x, 0, sim.watch.z);
      watch.current.rotation.y = sim.watch.yaw;
    }
    if (gate.current) {
      gate.current.position.set(0, 0, sim.dropZ);
    }

    const fx = -Math.sin(b.yaw);
    const fz = -Math.cos(b.yaw);
    const rx = Math.cos(b.yaw);
    const rz = -Math.sin(b.yaw);
    const view = sim.cam;
    let follow = 3.6;
    if (view === "hood") {
      _desired.set(b.x + fx * 0.55 + rx * 0.18, b.y + 1.28, b.z + fz * 0.55 + rz * 0.18);
      _look.set(b.x + fx * 16, 0.9, b.z + fz * 16);
      follow = 14;
    } else if (view === "shoulder") {
      _desired.set(b.x - fx * 4.6 + rx * 1.55, 2.05, b.z - fz * 4.6 + rz * 1.55);
      _look.set(b.x + fx * 8, 1.05, b.z + fz * 8);
      follow = 7;
    } else if (view === "drone") {
      const d = sim.drones.find((dr) => dr.airborne) ?? sim.drones[0];
      if (d) {
        _desired.set(d.x - fx * 5.4, d.y + 1.8, d.z - fz * 5.4);
        _look.set(b.x, 1.1, b.z);
      } else {
        _desired.set(b.x - fx * 9, 8.5, b.z - fz * 9);
        _look.set(b.x, 1.1, b.z);
      }
      follow = 4.2;
    } else if (view === "orbit") {
      const t = sim.time * 0.32;
      _desired.set(b.x + Math.cos(t) * 11.5, 5.8, b.z + Math.sin(t) * 11.5);
      _look.set(b.x, 1.2, b.z);
      follow = 3.2;
    } else {
      _desired.set(b.x - fx * 9.4 + rx * 1.05, 3.4, b.z - fz * 9.4 + rz * 1.05);
      _look.set(b.x + fx * (4 + Math.abs(b.speed) * 0.18), 1.15, b.z + fz * (4 + Math.abs(b.speed) * 0.18));
      follow = 3.4;
    }
    camera.position.lerp(_desired, 1 - Math.exp(-follow * Math.min(dt, 0.1)));
    if (sim.juice > 0.05 && view === "chase") {
      camera.position.x += (Math.random() - 0.5) * sim.juice * 0.1;
      camera.position.y += (Math.random() - 0.5) * sim.juice * 0.05;
    }
    camera.lookAt(_look);
    const persp = camera as THREE.PerspectiveCamera;
    const wantFov = view === "hood" ? 58 : 46 + Math.min(8, Math.abs(b.speed) * 0.38);
    persp.fov += (wantFov - persp.fov) * (1 - Math.exp(-3.2 * Math.min(dt, 0.1)));
    persp.updateProjectionMatrix();
  });

  return (
    <>
      <NightLights />
      <SkyDome />
      <fog attach="fog" args={["#07090c", 48, 210]} />
      <Terrain />
      <TowerLine />
      <OakField />
      <Substation />
      <CamoShelter />
      <FieldClutter />
      <group ref={gate}>
        <CheckpointGate />
      </group>
      <group ref={bike}>
        <Bike />
      </group>
      <group ref={watch}>
        <WatchUnit />
      </group>
      <LiveSwarm />
      <HostileSwarm />
      {Array.from({ length: 8 }, (_, i) => (
        <Pickup key={i} index={i} />
      ))}
    </>
  );
}

function Pickup({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = sim.pickups[index];
    if (!ref.current) return;
    if (!p || p.taken) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.set(p.x, 0.7 + Math.sin(sim.time * 2 + index) * 0.12, p.z);
  });
  return (
    <group ref={ref}>
      <SalvageOrb position={[0, 0, 0]} taken={false} />
    </group>
  );
}

export function FleetScene() {
  const controls = useRef<
    THREE.EventDispatcher & { dollyIn: (s: number) => void; dollyOut: (s: number) => void; update: () => void }
  >(null);
  const pivot = useRef(new THREE.Vector3());
  const watch = useRef<THREE.Group>(null);
  const [roster, setRoster] = useState(sim.rosterId);

  useEffect(() => {
    fleetCam.zoomBy = (dir) => {
      const c = controls.current;
      if (!c) return;
      if (dir > 0) c.dollyIn(1.18);
      else c.dollyOut(1.18);
      c.update();
    };
    return () => {
      fleetCam.zoomBy = () => {};
    };
  }, []);

  useFrame(({ camera }, dt) => {
    syncStore();
    stepSim(dt);
    if (sim.rosterId !== roster) setRoster(sim.rosterId);
    let cx = 0,
      cy = 0,
      cz = 0;
    for (const d of sim.drones) {
      cx += d.x;
      cy += d.y;
      cz += d.z;
    }
    const n = Math.max(1, sim.drones.length);
    pivot.current.set(cx / n, cy / n, cz / n);
    const ctl = controls.current as unknown as { target?: THREE.Vector3 } | null;
    if (ctl?.target) ctl.target.lerp(pivot.current, 1 - Math.exp(-1.8 * Math.min(dt, 0.1)));
    if (watch.current) {
      watch.current.position.set(sim.watch.x, 0, sim.watch.z);
      watch.current.rotation.y = sim.watch.yaw;
      watch.current.visible = sim.briefing === "harvest" || sim.briefing === "free";
    }
    if (sim.juice > 0.04) {
      _punch.set(
        (Math.random() - 0.5) * sim.juice * 0.22,
        (Math.random() - 0.5) * sim.juice * 0.1,
        0,
      );
      camera.position.add(_punch);
    }
  });

  return (
    <>
      <NightLights />
      <SkyDome />
      <fog attach="fog" args={["#07090c", 40, 180]} />
      <Terrain />
      <FleetYard />
      <OakField />
      <TowerLine />
      <GroundClick />
      <OrbitControls
        ref={controls as never}
        enablePan
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={70}
        target={[0, 3, 0]}
      />
      <LiveSwarm />
      <HostileSwarm />
      <group ref={watch}>
        <WatchUnit />
      </group>
      {Array.from({ length: 8 }, (_, i) => (
        <Pickup key={`h-${i}`} index={i} />
      ))}
      {sim.hunt.map((pad) => (
        <HuntMarker key={`${roster}-${pad.id}`} id={pad.id} />
      ))}
      {sim.hops.map((hop) => (
        <HopMarker key={`${roster}-${hop.id}`} id={hop.id} />
      ))}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.9, 24]} />
        <meshBasicMaterial color="#7ee0d0" transparent opacity={0.45} />
      </mesh>
      <RallyMarker />
    </>
  );
}

function HuntMarker({ id }: { id: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const pad = sim.hunt.find((h) => h.id === id);
    if (!ref.current || !pad) return;
    ref.current.position.set(pad.x, 0.05, pad.z);
    ref.current.visible = pad.scored < 1;
  });
  const pad = sim.hunt.find((h) => h.id === id);
  const color =
    pad?.kind === "scout"
      ? "#7ee0d0"
      : pad?.kind === "relay"
        ? "#9ec4e8"
        : pad?.kind === "utility"
          ? "#e0a15a"
          : "#b5d46a";
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.55, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function HopMarker({ id }: { id: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const hop = sim.hops.find((h) => h.id === id);
    if (!ref.current || !hop) return;
    ref.current.position.set(hop.x, 0.06, hop.z);
  });
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.7, 24]} />
        <meshBasicMaterial color="#9ec4e8" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function RallyMarker() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(sim.rally.x, 0.1, sim.rally.z);
      const s = 1 + Math.sin(sim.time * 4) * 0.08;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.15, 28]} />
      <meshBasicMaterial color="#e0a15a" transparent opacity={0.7} />
    </mesh>
  );
}

function GroundClick() {
  const start = useRef({ x: 0, y: 0 });
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (dx * dx + dy * dy < 81) {
          e.stopPropagation();
          sim.setRally(e.point.x, e.point.z);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        sim.setRally(e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[220, 220]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export function HangarScene() {
  useFrame(({ camera, clock }, dt) => {
    syncStore();
    sim.mode = "hangar";
    sim.rally.x = 4;
    sim.rally.z = -1;
    sim.formation = "line";
    stepSim(dt * 0.4);
    const t = clock.elapsedTime * 0.18;
    camera.position.set(Math.sin(t) * 7.2 + 1.2, 2.7, Math.cos(t) * 8.4 + 3.2);
    camera.lookAt(0, 1.05, 0.4);
  });

  return (
    <>
      <NightLights hangar />
      <directionalLight position={[5, 5, 10]} intensity={2.8} color="#efe6cc" />
      <SkyDome />
      <fog attach="fog" args={["#0c1012", 70, 160]} />
      <Terrain hangar />
      <HangarShell />
      <CamoShelter />
      <mesh position={[0, 0.05, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 28]} />
        <meshStandardMaterial
          color="#7ee0d0"
          emissive="#7ee0d0"
          emissiveIntensity={0.35}
          roughness={0.6}
        />
      </mesh>
      <group position={[0, 0, 2.5]}>
        <Bike />
      </group>
      {AIRFRAMES.map((kind, i) => (
        <group key={kind} position={[-4.5 + i * 3, 1.15, -1]}>
          <HangarDrone kind={kind} index={i} />
        </group>
      ))}
      <LatticeTower position={[-22, 0, -28]} />
      <LatticeTower position={[18, 0, -34]} />
    </>
  );
}

function HangarDrone({ kind, index }: { kind: Airframe; index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const d = sim.drones[index];
    if (d) {
      ref.current.position.y = 0.05 + Math.sin(sim.time * 1.4 + index) * 0.08;
      ref.current.userData.airborne = true;
    }
  });
  return (
    <group ref={ref} userData={{ airborne: true }}>
      <Drone kind={kind} />
    </group>
  );
}

export function LibraryScene() {
  const id = useGame((s) => s.libraryId);
  const item = catalogById(id);
  const mesh = item.mesh ?? "scout";

  return (
    <>
      <NightLights hangar />
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 8, 28]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color="#161a18" metalness={0.4} roughness={0.45} />
      </mesh>
      <group position={[0, mesh === "bike" ? 0 : 0.8, 0]}>
        {mesh === "bike" && <Bike />}
        {mesh === "scout" && <Drone kind="scout" scale={1.8} />}
        {mesh === "relay" && <Drone kind="relay" scale={1.8} />}
        {mesh === "utility" && <Drone kind="utility" scale={1.8} />}
        {mesh === "cargo" && <Drone kind="cargo" scale={1.8} />}
        {mesh === "tower" && (
          <group scale={0.35} position={[0, 0, 0]}>
            <LatticeTower position={[0, 0, 0]} />
          </group>
        )}
        {mesh === "beacon" && <BeaconGlow color="#7ee0d0" scale={4} />}
        {mesh === "hostile" && <HostileDrone scale={2.2} />}
        {mesh === "pad" && (
          <group position={[0, -0.8, 0]}>
            <LandingPad position={[0, 0, 0]} />
          </group>
        )}
        {mesh === "crate" && (
          <group position={[0, -0.8, 0]}>
            <CrateStack position={[0, 0, 0]} />
            <FuelDrum position={[1.1, 0, 0.2]} />
          </group>
        )}
        {mesh === "gate" && (
          <group position={[0, -0.8, 0]} scale={0.55}>
            <CheckpointGate />
          </group>
        )}
        {mesh === "flood" && (
          <group position={[0, -0.8, 0]}>
            <Floodlight position={[0, 0, 0]} />
          </group>
        )}
        {mesh === "dish" && (
          <group position={[0, -0.8, 0]}>
            <CommsDish position={[0, 0, 0]} />
            <Generator position={[1.4, 0, 0.4]} />
          </group>
        )}
        {mesh === "tree" && <Drone kind="scout" />}
      </group>
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.8}
        enablePan={false}
        minDistance={3}
        maxDistance={16}
        target={[0, 0.8, 0]}
      />
    </>
  );
}
