import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import * as THREE from "three";
import { FieldScene, FleetScene, HangarScene, LibraryScene } from "./scenes";
import { TextureProvider } from "./textures";
import type { Mode } from "./types";

export function CanvasRoot({ mode }: { mode: Mode }) {
  return (
    <Canvas
      camera={{ fov: 48, position: [4.5, 3.2, 11], near: 0.1, far: 420 }}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      style={{ width: "100%", height: "100%", display: "block", background: "#05070b" }}
    >
      <Suspense fallback={null}>
        <TextureProvider>
          {mode === "field" && <FieldScene />}
          {mode === "fleet" && <FleetScene />}
          {mode === "hangar" && <HangarScene />}
          {mode === "library" && <LibraryScene />}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.55}
              intensity={1.05}
              mipmapBlur
              luminanceSmoothing={0.15}
            />
            <Vignette eskil={false} offset={0.22} darkness={0.68} />
          </EffectComposer>
        </TextureProvider>
      </Suspense>
    </Canvas>
  );
}
