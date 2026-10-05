import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const [output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw new Error('Provide a new private output path');
const tables=['assets','settings','assessments','documents','facts','jobs','budget_ledger','events'];
const query=tables.map(table=>'SELECT * FROM '+table).join(';');
let raw;try{raw=execFileSync('npx',['wrangler','d1','execute','stablecoin-risk-radar','--remote','--json','--command',query],{encoding:'utf8',maxBuffer:30*1024*1024});}catch{throw new Error('Read-only research export failed; check Wrangler access and retry. No backup was written.');}const result=JSON.parse(raw);
if(!Array.isArray(result)||result.length!==tables.length||result.some(r=>r.success!==true||!Array.isArray(r.results)))throw new Error('Incomplete export; no backup written');
const backup={schema_version:1,created_at:new Date().toISOString(),...Object.fromEntries(tables.map((t,i)=>[t,result[i].results]))};
fs.writeFileSync(output,JSON.stringify(backup),{mode:0o600,flag:'wx'});
for(const table of tables)console.log(table+': '+backup[table].length);console.log('Private research backup saved. Sessions, OAuth state and the derived FTS index are excluded; R2 archive objects require a separate backup.');
