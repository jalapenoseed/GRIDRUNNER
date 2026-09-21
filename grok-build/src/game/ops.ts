import type { Briefing } from "./types";

export type BriefingDef = {
  id: Briefing;
  title: string;
  tag: string;
  blurb: string;
  time: number;
  sizeHint: number;
  win: string;
};

export const BRIEFING_DEFS: BriefingDef[] = [
  {
    id: "harvest",
    title: "Night Harvest",
    tag: "Ops",
    blurb: "Send utility and cargo onto salvage cells. Stay out of WATCH-01. Bank six cells.",
    time: 120,
    sizeHint: 16,
    win: "Salvage banked",
  },
  {
    id: "drill",
    title: "Formation Drill",
    tag: "Training",
    blurb: "Hold wedge, line, then ring at 80% cohesion for three seconds each. Three minutes.",
    time: 180,
    sizeHint: 16,
    win: "Drill complete",
  },
  {
    id: "hunt",
    title: "Beacon Hunt",
    tag: "Training",
    blurb: "Put the requested airframe on the lit pad. Correct craft score; wrong craft dock points.",
    time: 90,
    sizeHint: 16,
    win: "Pads cleared",
  },
  {
    id: "relay",
    title: "Relay Hop",
    tag: "Ops",
    blurb: "Land three relays on the hop pads to light the northern feed. Scouts hold overwatch.",
    time: 150,
    sizeHint: 6,
    win: "Link live",
  },
  {
    id: "intercept",
    title: "Night Intercept",
    tag: "Ops",
    blurb: "Inbound contacts run the yard. Tag six with scouts before three reach the pad.",
    time: 100,
    sizeHint: 16,
    win: "Screen held",
  },
  {
    id: "free",
    title: "Free Flight",
    tag: "Lab",
    blurb: "Tap the yard to rally. Filter airframes, hold formation, launch and recall. No clock.",
    time: 0,
    sizeHint: 16,
    win: "Open field",
  },
];

export function briefingDef(id: Briefing) {
  return BRIEFING_DEFS.find((b) => b.id === id) ?? BRIEFING_DEFS[0];
}
