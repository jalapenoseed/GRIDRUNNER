import {demoRequested, applyDemoSettings, demoSaveKey, DEMO_SAVE_PREFIX} from './dist/demo-boot.js';

const fail = (m) => { console.error('verify-demo: ' + m); process.exit(1); };
if (!demoRequested('?mode=demo', '', '/index.html')) fail('mode=demo');
if (!demoRequested('', '#demo', '/x')) fail('hash demo');
if (!demoRequested('', '', '/GRIDRUNNER/demo.html')) fail('demo.html path');
if (demoRequested('', '', '/index.html')) fail('plain index should be off');
if (demoSaveKey('manual1') !== DEMO_SAVE_PREFIX + 'manual1') fail('save key');
const s = applyDemoSettings({music: 1, graphics: 'ULTRA', tutorialEnabled: false, difficulty: 'survival'});
if (s.graphics !== 'LOW' || s.difficulty !== 'explorer' || !s.tutorialEnabled) fail('settings overlay');
if (s.music > 0.2) fail('music cap');
console.log('verify-demo: ok');
