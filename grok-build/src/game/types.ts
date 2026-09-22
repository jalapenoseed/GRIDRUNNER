export type Mode = "hangar" | "field" | "fleet" | "library";
export type Formation = "wedge" | "trail" | "line" | "orbit" | "ring" | "grid" | "run" | "ops";
export type Sensor = "off" | "thermal" | "uv" | "nv";
export type Airframe = "scout" | "relay" | "utility" | "cargo";
export type Briefing = "free" | "drill" | "hunt" | "harvest" | "relay" | "intercept";
export type DroneTask = "form" | "harvest" | "relay" | "recall" | "hold" | "intercept" | "guard";
export type FleetOp = "form" | "harvest" | "relay" | "recall";
export type Focus = "all" | Airframe;
export type CamView = "chase" | "hood" | "shoulder" | "drone" | "orbit";
export type EscortStance = "escort" | "guard" | "harvest";

export const FORMATIONS: Formation[] = ["wedge", "trail", "line", "orbit", "ring"];
export const SPELLS: Formation[] = ["grid", "run", "ops"];
export const ALL_FORMS: Formation[] = [...FORMATIONS, ...SPELLS];
export const AIRFRAMES: Airframe[] = ["scout", "relay", "utility", "cargo"];
export const BRIEFINGS: Briefing[] = ["harvest", "drill", "hunt", "relay", "intercept", "free"];
export const FLEET_SIZES = [6, 16, 24] as const;
export const DRILL_SEQUENCE: Formation[] = ["wedge", "line", "ring"];
export const FOCUSES: Focus[] = ["all", "scout", "relay", "utility", "cargo"];
export const CAM_VIEWS: CamView[] = ["chase", "hood", "shoulder", "drone", "orbit"];
export const STANCES: EscortStance[] = ["escort", "guard", "harvest"];

export const BEACON: Record<Airframe, string> = {
  scout: "#7ee0d0",
  relay: "#9ec4e8",
  utility: "#e0a15a",
  cargo: "#b5d46a",
};

export const SPECS: Record<
  Airframe,
  { mass: number; speed: number; label: string; role: string }
> = {
  scout: { mass: 2.4, speed: 16, label: "Scout", role: "Survey / FPV" },
  relay: { mass: 3.1, speed: 12, label: "Relay", role: "Radio hop" },
  utility: { mass: 4.6, speed: 9, label: "Utility", role: "Harvest" },
  cargo: { mass: 5.8, speed: 8, label: "Cargo", role: "Payload" },
};

export const FIELD_WAVES = [
  { need: 4, dropZ: -62, z0: -16, gap: 12 },
  { need: 5, dropZ: -148, z0: -78, gap: 14 },
  { need: 6, dropZ: -200, z0: -160, gap: 12 },
] as const;
