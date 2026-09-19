import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
// Run with the Codex primary runtime in a temporary directory linked to its node_modules.
const out=process.argv[2]||'outputs/gridrunner-v724';
const workbook=Workbook.create(),sheet=workbook.worksheets.add('Build timeline');
sheet.showGridLines=false;sheet.tabColor='#273F54';
sheet.getRange('A1:F18').format.font={name:'Arial',size:11,color:'#253746'};
sheet.getRange('A1:F18').format.verticalAlignment='center';
for(const [c,width]of Object.entries({A:82,B:190,C:150,D:340,E:310,F:120}))sheet.getRange(`${c}1:${c}18`).format.columnWidthPx=width;
sheet.getRange('A2').values=[['GRIDRUNNER v7.24 — Build timeline']];sheet.getRange('A2').format.font={name:'Arial',size:17,bold:true,color:'#273F54'};sheet.getRange('A2:F2').format.rowHeight=30;
sheet.getRange('A3').values=[['As of September 16, 2026. Future dates are unassigned; yellow cells are editable target dates.']];sheet.getRange('A3:F3').format.rowHeight=24;
const rows=[
 ['Order','Milestone','State','Scope','Acceptance / dependency','Target date'],
 ['Previous','Collision and YOLO','Implemented','v7.23 foundation retained: local pixel detection, drone hull sweeps, rider surfaces and later-chapter solids.','Device inference speed and traversal playtesting.',null],
 [1,'Navigation and teaching','Implemented','Parent/back navigation; contextual field menu; seven saved, replayable interaction guides.','Keyboard, touch and controller focus/backtracking; first-use clarity.',null],
 [2,'Drone systems','Implemented','Six new formations; class idle motion; class-specific sensor packages and journal measurements.','Flight feel, clearance and evidence usability on target devices.',null],
 [3,'Relay House reasoning','Implemented','Four clues; branch/load constraints; startup surge; staged hints; saved intermediate state.','Fresh-player solve and pacing. Rules and unique final route checked automatically.',null],
 ['Next','Acceptance and tuning','Ready for playtest','Play phases 1–3 together; record and fix observed usability, motion, performance and difficulty issues.','Required before treating the implemented slice as player-accepted.',null],
 [4,'Density and hostile drone','Planned','Opening-route choices, salvage and cover; one surveillance drone with patrol, search and retreat.','Stable opening flow and clear perception / escape feedback.',null],
 [5,'Fleet scale and grids','Planned','Multiple same-class instances; scheduling, ownership and perch conflicts; regional power.','Phase 2 controls accepted; save migration and finite-energy invariants.',null],
 [6,'Communicator and intro','Planned','Original communicator, authored introduction/cinematic transition and Eclipse expansion.','Stable interaction hierarchy, fleet systems and opening gameplay.',null]
];
sheet.getRange('A5:F13').values=rows;sheet.getRange('A5:F5').format={fill:'#273F54',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:28,wrapText:true};
sheet.getRange('A6:F13').format.wrapText=true;sheet.getRange('A6:F13').format.rowHeight=64;
sheet.getRange('A6:A13').format.horizontalAlignment='center';sheet.getRange('F6:F13').format.fill='#FFF1CA';sheet.getRange('F6:F13').setNumberFormat('mmm d, yyyy');
sheet.getRange('C6:C13').dataValidation={rule:{type:'list',values:['Implemented','Ready for playtest','Planned','In progress','Accepted']}};
sheet.getRange('C6:C13').conditionalFormats.add('containsText',{text:'Ready for playtest',format:{fill:'#FFF1CA'}});
sheet.getRange('C6:C13').conditionalFormats.add('containsText',{text:'Accepted',format:{fill:'#E2EEE4'}});
sheet.getRange('A15').values=[['Implemented means code and automated checks are complete. It does not mean human playtest acceptance.']];
sheet.getRange('A16').values=[['Recommended path: acceptance and tuning, then a bounded phase-4 opening-route slice.']];
sheet.getRange('A17').values=[['Source: GRIDRUNNER v7.24 build report and project scope, September 16, 2026.']];
sheet.getRange('A15:F17').format.rowHeight=23;
workbook.recalculate();
console.log((await workbook.inspect({kind:'table',range:'Build timeline!A5:F13',include:'values,formulas',tableMaxRows:9,tableMaxCols:6,maxChars:2200})).ndjson);
console.log((await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},summary:'formula errors'})).ndjson);
await fs.mkdir(out,{recursive:true});const preview=await workbook.render({sheetName:sheet.name,range:'A1:F18',scale:1,format:'png'});await fs.writeFile(`${out}/timeline.png`,new Uint8Array(await preview.arrayBuffer()));
await (await SpreadsheetFile.exportXlsx(workbook)).save(`${out}/GRIDRUNNER-v7.24-timeline.xlsx`);
