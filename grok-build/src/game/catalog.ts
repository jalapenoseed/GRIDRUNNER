import { SPECS, type Airframe } from "./types";
import { assetUrl } from "./assets";

export type CatalogKind = "scene" | "airframe" | "vehicle" | "texture" | "prop";

export type CatalogItem = {
  id: string;
  title: string;
  kind: CatalogKind;
  role: string;
  still: string;
  mesh?:
    | "bike"
    | Airframe
    | "tower"
    | "beacon"
    | "tree"
    | "hostile"
    | "pad"
    | "crate"
    | "gate"
    | "flood"
    | "dish";
  notes: string;
};

export const CATALOG: CatalogItem[] = [
  {
    id: "field-target",
    title: "Field Run target",
    kind: "scene",
    role: "Dream Loop still",
    still: assetUrl("assets/targets/field-sm.jpg"),
    notes:
      "Chase camera, wet service road, lattice towers, escort wedge, sodium substation. Live Field Run is built to this frame.",
  },
  {
    id: "fleet-ops",
    title: "Fleet Ops target",
    kind: "scene",
    role: "Dream Loop still",
    still: assetUrl("assets/targets/fleet-ops-sm.jpg"),
    notes:
      "Mobile command HUD over a wedge on the wet yard. Cohesion, air count, launch/recall. Live Fleet Commander is built to this frame.",
  },
  {
    id: "hangar-ops",
    title: "Hangar briefing target",
    kind: "scene",
    role: "Dream Loop still",
    still: assetUrl("assets/targets/hangar-ops-sm.jpg"),
    notes: "Workshop bay with briefing cards for Night Harvest, Formation Drill, Beacon Hunt.",
  },
  {
    id: "scout",
    title: SPECS.scout.label,
    kind: "airframe",
    role: SPECS.scout.role,
    still: assetUrl("assets/library/scout.jpg"),
    mesh: "scout",
    notes: "Fast/light survey craft. Cyan beacon, slim fuselage, four-arm layout. Mass 2.4 kg.",
  },
  {
    id: "relay",
    title: SPECS.relay.label,
    kind: "airframe",
    role: SPECS.relay.role,
    still: assetUrl("assets/library/relay.jpg"),
    mesh: "relay",
    notes: "Radio hop. Dish and twin antennas, pale-blue beacon. Lands ahead to extend coverage.",
  },
  {
    id: "utility",
    title: SPECS.utility.label,
    kind: "airframe",
    role: SPECS.utility.role,
    still: assetUrl("assets/library/utility.jpg"),
    mesh: "utility",
    notes: "Harvest and repair. Box hull, claw, amber beacon. Trades agility for equipment.",
  },
  {
    id: "cargo",
    title: SPECS.cargo.label,
    kind: "airframe",
    role: SPECS.cargo.role,
    still: assetUrl("assets/library/cargo.jpg"),
    mesh: "cargo",
    notes: "Payload hauler. Wide hull, side pods, lime beacon. Heaviest of the four.",
  },
  {
    id: "bike",
    title: "Field bike",
    kind: "vehicle",
    role: "Expedition mount",
    still: assetUrl("assets/library/bike.jpg"),
    mesh: "bike",
    notes: "Dual-sport electric. LED headlight, PBR frame, knobby tires. Chase-cam Field Run.",
  },
  {
    id: "hostile",
    title: "WATCH contact",
    kind: "airframe",
    role: "Inbound interceptor",
    still: assetUrl("assets/library/scout.jpg"),
    mesh: "hostile",
    notes: "Dark hull, red beacon. Night Intercept tags these before they reach the pad.",
  },
  {
    id: "earth",
    title: "Wet earth albedo",
    kind: "texture",
    role: "PBR ground",
    still: assetUrl("assets/textures/earth.jpg"),
    notes: "Night packed clay with pebble scatter. Paired roughness map for wet sheen.",
  },
  {
    id: "metal",
    title: "Aircraft aluminum",
    kind: "texture",
    role: "PBR hull",
    still: assetUrl("assets/textures/metal.jpg"),
    notes: "Brushed graphite coating, panel seams, rivets. Hull and bike frame.",
  },
  {
    id: "camo",
    title: "Workshop camo",
    kind: "texture",
    role: "Cloth",
    still: assetUrl("assets/textures/camo.jpg"),
    notes: "Olive-drab canopy cloth for the packed starting shelter.",
  },
  {
    id: "concrete",
    title: "Hangar slab",
    kind: "texture",
    role: "PBR floor",
    still: assetUrl("assets/textures/concrete.jpg"),
    notes: "Wet workshop concrete, oil staining, hairline cracks.",
  },
  {
    id: "tower",
    title: "Lattice tower",
    kind: "prop",
    role: "Grid furniture",
    still: assetUrl("assets/targets/field-sm.jpg"),
    mesh: "tower",
    notes: "High-voltage pylon with cyan insulators and sagging conductors.",
  },
  {
    id: "beacon",
    title: "Aircraft beacon",
    kind: "prop",
    role: "ID light",
    still: assetUrl("assets/library/scout.jpg"),
    mesh: "beacon",
    notes: "Luminous core, additive glare, distance falloff, brief white strobe.",
  },
  {
    id: "pad",
    title: "Landing pad",
    kind: "prop",
    role: "Yard mark",
    still: assetUrl("assets/targets/fleet-ops-sm.jpg"),
    mesh: "pad",
    notes: "Painted ring and chevron. Rally origin for Fleet Commander.",
  },
  {
    id: "crate",
    title: "Yard stores",
    kind: "prop",
    role: "Clutter",
    still: assetUrl("assets/textures/metal.jpg"),
    mesh: "crate",
    notes: "Crate stack and fuel drums. Hangar and roadside furniture.",
  },
  {
    id: "gate",
    title: "Bank gate",
    kind: "prop",
    role: "Field checkpoint",
    still: assetUrl("assets/targets/field-sm.jpg"),
    mesh: "gate",
    notes: "Cyan arch on the service road. Bank a wave by riding through it.",
  },
  {
    id: "flood",
    title: "Floodlight",
    kind: "prop",
    role: "Yard lamp",
    still: assetUrl("assets/targets/hangar-ops-sm.jpg"),
    mesh: "flood",
    notes: "Pole lamp with a sodium wash. Marks the edge of the operating yard.",
  },
  {
    id: "dish",
    title: "Comms dish",
    kind: "prop",
    role: "Relay furniture",
    still: assetUrl("assets/library/relay.jpg"),
    mesh: "dish",
    notes: "Yard dish and generator. Visual stand-in for the northern feed.",
  },
];

export function catalogById(id: string) {
  return CATALOG.find((c) => c.id === id) ?? CATALOG[3];
}
