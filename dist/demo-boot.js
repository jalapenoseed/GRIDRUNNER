// Quiet Field demo entry. Does not rewrite campaign saves or delete systems.
export const DEMO_SAVE_PREFIX = 'gridrunner.demo.save.';
export const DEMO_SETTINGS_KEY = 'gridrunner.demo.settings';

export function demoRequested(search = '', hash = '', path = '') {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const mode = String(q.get('mode') || q.get('demo') || '').toLowerCase();
  if (['1', 'true', 'yes', 'demo'].includes(mode)) return true;
  if (String(hash).toLowerCase().includes('demo')) return true;
  return /(?:^|\/)demo\.html$/i.test(path || '');
}

export function liveDemo(loc = globalThis.location) {
  if (typeof globalThis !== 'undefined' && globalThis.GRIDRUNNER_DEMO === true) return true;
  if (!loc) return false;
  return demoRequested(loc.search || '', loc.hash || '', loc.pathname || '');
}

export function applyDemoShell(doc = globalThis.document) {
  if (!doc) return;
  doc.documentElement?.classList.add('gridrunner-demo');
  doc.body?.classList.add('gridrunner-demo');
  if (doc.title) doc.title = 'GRIDRUNNER — Quiet Field demo';
}

export function applyDemoSettings(settings) {
  if (!settings || typeof settings !== 'object') return settings;
  Object.assign(settings, {
    tutorialEnabled: true,
    graphics: 'LOW',
    reduceMotion: true,
    lightning: false,
    randomEnvironment: false,
    autoWeather: false,
    movingSun: false,
    weather: 'dusk',
    difficulty: 'explorer',
    navigation: false,
    charging: false,
    dronePanel: false,
    quest: true,
    radio: true,
    scanOverlay: false,
    visor: false,
    interference: false,
    music: Math.min(Number(settings.music) || 0.15, 0.2)
  });
  return settings;
}

export function demoSaveKey(slot) {
  return DEMO_SAVE_PREFIX + String(slot || 'auto');
}

export function demoStartCopy() {
  return {
    eyebrow: 'QUIET FIELD / DEMO',
    lead: 'On foot. Motorcycle ahead. One scout. No fleet test, no YOLO, no campaign save collision.',
    steps: 'Walk to the bike (F / BIKE). Salvage the first crate (E / USE). Launch and recall the scout (Q / DRONE). Talk to Mara (E / USE).',
    button: 'PLAY THE FIRST MILE'
  };
}
