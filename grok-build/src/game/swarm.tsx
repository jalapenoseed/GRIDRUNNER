import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Drone, HostileDrone } from "./craft";
import { sim } from "./sim";
import type { Airframe } from "./types";

const MAX = 24;
const MAX_HOSTILE = 12;

function SwarmSlot({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [kind, setKind] = useState<Airframe>(sim.drones[index]?.kind ?? "scout");

  useFrame(({ clock }) => {
    const g = group.current;
    const d = sim.drones[index];
    if (!g) return;
    if (!d) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(d.x, d.y, d.z);
    g.rotation.y = d.yaw;
    g.userData.airborne = d.airborne;
    const focused = sim.focus === "all" || sim.focus === d.kind;
    g.scale.setScalar(d.airborne ? (focused ? 1.62 : 1.45) : 1.12);
    if (d.kind !== kind) setKind(d.kind);
    if (ring.current) {
      ring.current.visible = focused && d.airborne;
      const s = 1.1 + Math.sin(clock.elapsedTime * 4 + index) * 0.08;
      ring.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={group}>
      <Drone kind={kind} />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.55, 0.7, 20]} />
        <meshBasicMaterial color="#e0a15a" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function LiveSwarm() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!light.current) return;
    let x = 0,
      y = 0,
      z = 0,
      n = 0;
    for (const d of sim.drones) {
      if (!d.airborne) continue;
      x += d.x;
      y += d.y;
      z += d.z;
      n++;
    }
    if (n) light.current.position.set(x / n, y / n + 1.1, z / n);
    light.current.intensity = n ? 7.5 : 0;
  });
  return (
    <group>
      {Array.from({ length: MAX }, (_, i) => (
        <SwarmSlot key={i} index={i} />
      ))}
      <pointLight ref={light} color="#7ee0d0" distance={20} />
    </group>
  );
}

function HostileSlot({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    const h = sim.hostiles[index];
    if (!g) return;
    if (!h || !h.alive) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(h.x, h.y, h.z);
    g.rotation.y = h.yaw;
  });
  return (
    <group ref={group} visible={false}>
      <HostileDrone />
    </group>
  );
}

export function HostileSwarm() {
  return (
    <group>
      {Array.from({ length: MAX_HOSTILE }, (_, i) => (
        <HostileSlot key={i} index={i} />
      ))}
    </group>
  );
}
