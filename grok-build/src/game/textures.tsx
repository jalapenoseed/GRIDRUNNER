import { useTexture } from "@react-three/drei";
import { createContext, useContext, useLayoutEffect, type ReactNode } from "react";
import * as THREE from "three";
import { assetUrl } from "./assets";

export type GameTextures = {
  earth: THREE.Texture;
  earthRough: THREE.Texture;
  metal: THREE.Texture;
  metalRough: THREE.Texture;
  camo: THREE.Texture;
  concrete: THREE.Texture;
  bark: THREE.Texture;
  sky: THREE.Texture;
  glow: THREE.Texture;
};

const Ctx = createContext<GameTextures | null>(null);

function makeGlow() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(210,255,250,0.7)");
  grd.addColorStop(0.45, "rgba(80,180,170,0.22)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

let glowCache: THREE.Texture | null = null;

export function TextureProvider({ children }: { children: ReactNode }) {
  const maps = useTexture({
    earth: assetUrl("assets/textures/earth.jpg"),
    earthRough: assetUrl("assets/textures/earth_rough.jpg"),
    metal: assetUrl("assets/textures/metal.jpg"),
    metalRough: assetUrl("assets/textures/metal_rough.jpg"),
    camo: assetUrl("assets/textures/camo.jpg"),
    concrete: assetUrl("assets/textures/concrete.jpg"),
    bark: assetUrl("assets/textures/bark.jpg"),
    sky: assetUrl("assets/textures/sky.jpg"),
  });

  useLayoutEffect(() => {
    const color = [maps.earth, maps.metal, maps.camo, maps.concrete, maps.bark, maps.sky];
    for (const t of color) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
    for (const t of [maps.earthRough, maps.metalRough]) {
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 4;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
    maps.earth.repeat.set(10, 10);
    maps.earthRough.repeat.set(10, 10);
    maps.metal.repeat.set(2, 2);
    maps.metalRough.repeat.set(2, 2);
    maps.camo.repeat.set(2, 2);
    maps.concrete.repeat.set(4, 4);
    maps.bark.repeat.set(1, 2);
    maps.sky.wrapS = maps.sky.wrapT = THREE.ClampToEdgeWrapping;
    maps.sky.mapping = THREE.EquirectangularReflectionMapping;
  }, [maps]);

  const value: GameTextures = {
    ...maps,
    glow: (glowCache ??= makeGlow()),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGameTextures() {
  const v = useContext(Ctx);
  if (!v) throw new Error("TextureProvider missing");
  return v;
}
