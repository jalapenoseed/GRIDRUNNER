/** 5-row bitmap letters for fleet word shows. # = occupied. */
const GLYPH: Record<string, string[]> = {
  G: ["####", "#...", "#.##", "#..#", "####"],
  R: ["###.", "#..#", "###.", "#.#.", "#..#"],
  I: [".#.", ".#.", ".#.", ".#.", ".#."],
  D: ["###.", "#..#", "#..#", "#..#", "###."],
  U: ["#..#", "#..#", "#..#", "#..#", "####"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".##.", "#..#", "#..#", "#..#", ".##."],
  P: ["###.", "#..#", "###.", "#...", "#..."],
  S: ["####", "#...", "####", "...#", "####"],
};

export const SPELL_WORDS = {
  grid: "GRID",
  run: "RUN",
  ops: "OPS",
} as const;

export type SpellId = keyof typeof SPELL_WORDS;

export function spellSlots(word: string, origin: { x: number; z: number }, scale = 2.1) {
  const letters = word.toUpperCase().split("");
  const cells: { x: number; y: number; z: number }[] = [];
  let cursor = 0;
  const gap = 1.2;
  for (const ch of letters) {
    const g = GLYPH[ch];
    if (!g) continue;
    const rows = g.length;
    const cols = Math.max(...g.map((r) => r.length));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== "#") continue;
        cells.push({
          x: origin.x + (cursor + c - (cols - 1) / 2) * scale,
          y: 3.4 + (rows - 1 - r) * 0.12,
          z: origin.z + (r - (rows - 1) / 2) * scale,
        });
      }
    }
    cursor += cols + gap;
  }
  const mid = cursor / 2;
  for (const p of cells) p.x -= mid * scale * 0.15;
  return cells;
}
