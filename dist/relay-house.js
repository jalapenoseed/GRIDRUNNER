import {ITEMS,transform} from './survival.js';
export const RELAY_SITE={id:'relay-house',name:'RELAY HOUSE / 147.20',leg:1,x:-86,y:9,z:-86};
export const RELAY_HOTSPOTS=[
 {id:'generator',room:'yard',x:-59,y:1.7,z:-75,label:'Service generator / wrench'},
 {id:'bench',room:'yard',x:-59,y:1.7,z:-89,label:'Equipment workbench'},
 {id:'cook',room:'kitchen',x:-77,y:4.7,z:-75,label:'Speak to Len / cabin caretaker'},
 {id:'fridge',room:'kitchen',x:-72,y:4.7,z:-81,label:'Inspect refrigerator circuit'},
 {id:'toolbox',room:'cellar',x:-93,y:1.5,z:-101,label:'Open maintenance toolbox'},
 {id:'radio',room:'cellar',x:-77,y:1.7,z:-101,label:'Service radio rack'},
 {id:'terminal',room:'office',x:-76,y:4.7,z:-96,label:'Use office CRT'},
 {id:'board',room:'office',x:-78,y:5,z:-104,label:'Read carrier frequency scrap'},
 {id:'bunk',room:'bunk',x:-89,y:4.7,z:-99,label:'Read operator notebook'},
 {id:'dish',room:'roof',x:-78,y:10.5,z:-94,label:'Drone / align rooftop dish'}
];
export const EVIDENCE={
 service:{title:'Maintenance label',text:'The generator governor seized. Use a wrench in the yard. The kitchen needs a protected fuse; the cellar toolbox holds a spare.'},
 identity:{title:'Caretaker’s folded note',text:'Len hands over a login fragment: GHOST-. “The rest is the whole-number part of the carrier pinned in the office.”'},
 carrier:{title:'Frequency scrap',text:'147.20 MHz / NORTH. The prefix note and this frequency identify the old terminal account.'},
 schematic:{title:'Operator’s notebook',text:'Wind a radio coil from copper and insulation. At a powered workbench, combine the coil, electronics and wire into a signal filter. Install the filter in the cellar rack. The roof dish is jammed; only a drone can reach its service latch.'},
 log:{title:'An intentional reroute',text:'The last operator rerouted a live voice through the “dead” tower. The recurring broadcast is a cover. Align the roof dish and tune 147.20 to receive the hidden carrier.'},
 signal:{title:'Someone changed the message',text:'“The line did not fail. We opened it. The tower holds our route north. Bring the archive.” The carrier includes a valid tower authentication token.'}
};
const FLAGS=['visited','generatorFixed','fuseTaken','fuseSeated','power','noteRead','frequencyRead','schematicRead','loggedIn','dishAligned','filterInstalled','radioTuned','discovered','cacheTaken'];
export function createRelayHouse(){return {version:1,...Object.fromEntries(FLAGS.map(k=>[k,false])),frequency:0,selected:'',evidence:[]};}
export function validateRelayHouse(raw){if(raw===undefined)return createRelayHouse();if(!raw||raw.version!==1)throw Error('Invalid relay house');const out=createRelayHouse();for(const k of FLAGS){if(typeof raw[k]!=='boolean')throw Error('Invalid relay flag');out[k]=raw[k];}if(![0,147.2].includes(raw.frequency)||typeof raw.selected!=='string'||raw.selected&&!Object.hasOwn(ITEMS,raw.selected)||!Array.isArray(raw.evidence)||raw.evidence.length>Object.keys(EVIDENCE).length||new Set(raw.evidence).size!==raw.evidence.length||raw.evidence.some(id=>!Object.hasOwn(EVIDENCE,id)))throw Error('Invalid relay evidence');out.frequency=raw.frequency;out.selected=raw.selected;out.evidence=[...raw.evidence];if(out.power&&(!out.generatorFixed||!out.fuseSeated)||out.radioTuned&&(!out.power||!out.dishAligned||!out.filterInstalled||out.frequency!==147.2)||out.discovered&&!out.radioTuned||out.loggedIn&&(!out.noteRead||!out.frequencyRead))throw Error('Inconsistent relay progression');return out;}
export function recordEvidence(r,id){if(!r.evidence.includes(id))r.evidence.push(id);}
export function relayObjective(r){if(r.discovered)return 'Carrier decoded. The token opens the northern tower.';if(!r.fuseTaken)return 'Explore the cellar. Follow the stairs down beside the bunk room.';if(!r.fuseSeated)return 'Bring the protected fuse to Len in the kitchen.';if(!r.generatorFixed)return 'Free the yard generator with a wrench.';if(!r.frequencyRead||!r.noteRead)return 'Join Len’s note with the carrier scrap in the office.';if(!r.loggedIn)return 'Log in at the office CRT using the two clues.';if(!r.filterInstalled)return 'Read the notebook, wind a coil, build and install a signal filter.';if(!r.dishAligned)return 'Fly to the roof and release the dish service latch.';if(r.frequency!==147.2)return 'Use the terminal to tune the carrier from the scrap.';return 'Listen at the cellar radio rack.';}
export function useRelay(r,id,{mode='foot',inv={},capacity=24,selected=r.selected}={}){
 r.visited=true;const fail=message=>({message,event:'use'}),ok=(message,event='evidence')=>({message,event});
 if(mode==='drone'&&id!=='dish')return fail('Return to your rider for hands-on work.');
 const have=(item)=>inv[item]>0,chosen=item=>selected===item||!selected&&have(item);
 if(id==='generator'){recordEvidence(r,'service');if(r.power)return fail('Generator running. The cabin circuit is stable.');if(!r.generatorFixed){if(!have('wrench')||!chosen('wrench'))return fail('The governor is seized. Select a wrench in Pack, then use the generator.');r.generatorFixed=true;}r.power=r.generatorFixed&&r.fuseSeated;return ok(r.power?'Generator running. Kitchen lights and terminal are online.':'Governor freed. Fit the kitchen fuse to close the circuit.','generatorCrank');}
 if(id==='toolbox'){if(r.fuseTaken)return fail('Toolbox empty. The maintenance label stays in your journal.');const error=transform(inv,{}, {fuse:1,copper:2,plastic:1,wire:1,electronics:1},capacity);if(error)return fail(error);r.fuseTaken=true;recordEvidence(r,'service');return ok('Protected fuse, copper, insulation, wire and a board recovered. Len needs the fuse.');}
 if(id==='cook'){if(r.fuseSeated)return fail('Len: “The note prefix and office carrier make the account. Try the terminal upstairs.”');if(!have('fuse')||!chosen('fuse'))return fail('Len: “The kitchen circuit is dead. Bring me the protected fuse from the cellar.”');inv.fuse--;r.fuseSeated=true;r.noteRead=true;r.power=r.generatorFixed;recordEvidence(r,'identity');if(r.selected==='fuse')r.selected='';return ok('Fuse seated. Len gives you a folded note: GHOST-. Read it in Journal.','fridge');}
 if(id==='fridge')return fail(r.power?'The compressor kicks in. Fresh food, but no one has slept here recently.':'A dead compressor and an empty protected fuse socket. Len has been keeping watch.');
 if(id==='board'){r.frequencyRead=true;recordEvidence(r,'carrier');return ok('Carrier scrap recorded: 147.20 MHz.');}
 if(id==='bunk'){r.schematicRead=true;recordEvidence(r,'schematic');return ok('Signal filter and reserve-cell schematics learned. See Pack / Fieldwork.');}
 if(id==='bench')return {message:r.power?'Workbench powered. Fabricate the signal filter here.':'Unpowered workbench. Restore the cabin circuit first.',panel:'supplies',event:'use'};
 if(id==='terminal')return r.power?{panel:'relayTerminal',event:'terminal',message:'RELAY OS / carrier console'}:fail('CRT is dark. Repair the yard generator and kitchen circuit.');
 if(id==='dish'){if(mode!=='drone')return fail('The roof service latch requires your FPV drone.');if(!r.power)return fail('Dish actuator has no power. Restore the house first.');if(r.dishAligned)return fail('Dish already points north.');r.dishAligned=true;return ok('Dish latch released. The reflector turns north. Return to the cellar receiver.','carrierLock');}
 if(id==='radio'){
  if(!r.power)return fail('No power at the radio rack.');
  if(!r.filterInstalled){if(!have('signalFilter')||!chosen('signalFilter'))return fail('Carrier drowned in static. Build a signal filter at the powered workbench and bring it here.');inv.signalFilter--;r.filterInstalled=true;if(r.selected==='signalFilter')r.selected='';return ok('Signal filter installed. Align the dish and tune the carrier in the office.','craft');}
  if(!r.dishAligned)return fail('Receiver ready. The roof dish is still misaligned.');if(r.frequency!==147.2)return fail('Wrong carrier. Tune the office console to the frequency scrap.');
  if(r.discovered)return fail('The hidden carrier is recorded. Its tower token stays in your journal.');r.radioTuned=r.discovered=true;recordEvidence(r,'signal');return {...ok(EVIDENCE.signal.text,'discovery'),discovery:true};
 }
 return fail('A dust-covered part of the old relay station.');
}
export function terminalCommand(r,command){
 const line=String(command).trim().slice(0,120),[verb,...args]=line.toLowerCase().split(/\s+/);if(!r.power)return 'NO POWER';
 if(verb==='exit')return 'EXIT';
 if(verb==='login'){if(!r.noteRead||!r.frequencyRead)return 'ACCOUNT INCOMPLETE / inspect Len’s note and the office carrier scrap.';if(args.join(' ').toUpperCase()!=='GHOST-147')return 'ACCOUNT UNKNOWN';r.loggedIn=true;recordEvidence(r,'log');return 'GHOST-147 ACCEPTED / list · read · ping · dump · tune · exit';}
 if(!r.loggedIn)return 'LOCKED / login <prefix><whole-number carrier>. Find both clues.';
 if(verb==='list')return 'FILES / operator.log · carrier.txt · filter.sch';
 if(verb==='read'){if(args[0]==='filter.sch'){r.schematicRead=true;recordEvidence(r,'schematic');return EVIDENCE.schematic.text;}recordEvidence(r,'log');return EVIDENCE.log.text;}
 if(verb==='ping')return `GENERATOR ${r.power?'ONLINE':'OFFLINE'} / DISH ${r.dishAligned?'NORTH':'MISALIGNED'} / FILTER ${r.filterInstalled?'READY':'MISSING'} / CARRIER ${r.frequency.toFixed(2)}`;
 if(verb==='dump')return r.discovered?EVIDENCE.signal.text:'ARCHIVE WAITING / power + north dish + filtered carrier required. Listen at the cellar rack.';
 if(verb==='tune'){if(!r.frequencyRead||Number(args[0])!==147.2)return 'NO LOCK / frequency differs from the carrier scrap.';r.frequency=147.2;return '147.20 MHz SET / listen at the cellar radio rack.';}
 return 'COMMANDS / list · read [file] · ping · dump · tune <MHz> · exit';
}
