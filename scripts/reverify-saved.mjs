// Explicit maintenance action; preserves source versions and old assessments.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {verificationRequest,claimVerification,VERIFIER_VERSION} from '../worker/verification.ts';
import {assessment} from '../worker/assessment.ts';import {METHODOLOGY_VERSION,identitySignature} from '../src/lib/scoring.ts';
const [backupPath,outputPath,mode]=process.argv.slice(2);
if(!backupPath||!outputPath||fs.existsSync(outputPath)||!['apply','preview'].includes(mode))throw new Error('Usage: node --import ./scripts/ts-runtime.mjs scripts/reverify-saved.mjs PRIVATE_BACKUP NEW_PRIVATE_RESULTS apply|preview');
const b=JSON.parse(fs.readFileSync(backupPath));if(b.schema_version!==1)throw new Error('Invalid backup');
const quote=s=>"'"+String(s).replace(/'/g,"''")+"'";
const sql=statement=>JSON.parse(execFileSync('npx',['wrangler','d1','execute','stablecoin-risk-radar','--remote','--json','--command',statement],{encoding:'utf8',maxBuffer:10*1024*1024}));
const sqlFile=statement=>{const filename=outputPath+'.sql';fs.writeFileSync(filename,statement,{mode:0o600,flag:'wx'});try{return execFileSync('npx',['wrangler','d1','execute','stablecoin-risk-radar','--remote','--json','--file',filename],{encoding:'utf8',maxBuffer:10*1024*1024});}finally{fs.rmSync(filename,{force:true});}};
const results=[];const secret=mode==='apply'?JSON.parse(fs.readFileSync('.secrets/cloudflare.json')):{};
for(const row of b.assets){
 const asset=JSON.parse(row.data);const previous=b.assessments.filter(a=>a.asset_id===asset.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];if(!previous)continue;
 const existing=mode==='apply'?sql(`SELECT a.data FROM assessments a JOIN events e ON json_extract(CASE WHEN json_valid(e.data) THEN e.data ELSE '{}' END,'$.next_id')=a.id WHERE a.asset_id=${quote(asset.id)} AND json_extract(CASE WHEN json_valid(e.data) THEN e.data ELSE '{}' END,'$.previous_id')=${quote(previous.id)} AND json_extract(a.data,'$.methodology_version')=${quote(METHODOLOGY_VERSION)} ORDER BY a.created_at DESC LIMIT 1;`)[0]?.results[0]:null;
 if(existing){const next=JSON.parse(existing.data);results.push({asset:asset.id,assessment:next,previous_id:previous.id,reused:true});fs.writeFileSync(outputPath,JSON.stringify({methodology:METHODOLOGY_VERSION,results}),{mode:0o600});console.log(JSON.stringify({asset:asset.id,reused:true}));continue;}
 const old=JSON.parse(previous.data);const oldFacts=b.facts.filter(f=>f.assessment_id===previous.id);const claims=oldFacts.map(f=>JSON.parse(f.verification).claim);const docs=b.documents.filter(d=>claims.some(c=>c.document_id===d.id));
 const job='reverify-'+crypto.randomUUID();const at=new Date().toISOString(),month=at.slice(0,7);let jev={model:'not-called',answers:{}};
 if(mode==='apply'&&claims.length){
  const reserved=sql(`INSERT INTO budget_ledger(id,month,provider,ceiling_usd,status,created_at) SELECT ${quote(job)},${quote(month)},'jev-reverification',0.02,'reserved',${quote(at)} WHERE 0.02 <= (SELECT json_extract(data,'$.monthly_budget_usd') FROM settings WHERE id=1) - COALESCE((SELECT sum(ceiling_usd) FROM budget_ledger WHERE month=${quote(month)} AND status!='cancelled'),0);`);if(reserved[0]?.meta.changes!==1)throw new Error('Budget exhausted; no new paid request');
  for(let offset=0;offset<claims.length;offset+=8){const batch=claims.slice(offset,offset+8);const r=await fetch('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:'Bearer '+secret.TYPESAFE_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(verificationRequest(asset,batch,docs)),signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error('Reverification provider HTTP '+r.status+'; reservation retained, previous assessment untouched');const reply=await r.json();if(!reply.answers||typeof reply.model!=='string')throw new Error('Invalid Jev response');jev.model=reply.model;for(const [k,v] of Object.entries(reply.answers)){const mapped=k.replace(/^claim_(\d+)_/,(_,i)=>'claim_'+(Number(i)+offset)+'_');jev.answers[mapped]=v;}jev.usage??={input_tokens:0,output_tokens:0};jev.usage.input_tokens+=reply.usage?.input_tokens||0;jev.usage.output_tokens+=reply.usage?.output_tokens||0;}
  fs.writeFileSync(outputPath+'.'+asset.id+'.provider.json',JSON.stringify(jev),{mode:0o600});
  sql(`UPDATE budget_ledger SET status='settled' WHERE id=${quote(job)};`);
 }
 const data={claims,explanation:{ru:'Повторная проверка сохранённых источников по методике 1.1. Подтверждённые факты и разрешённые критерии указаны отдельно; недостающие сведения не означают небезопасность монеты.',en:'Saved sources reverified under methodology 1.1. Source-backed facts and resolved criteria are distinct; missing information does not establish that a coin is unsafe.'},critical_suspected:old.critical==='suspected'};
 const next=assessment(asset,docs,data,jev.answers,jev.model,job);
 const current=mode==='apply'?sql(`SELECT data FROM assets WHERE id=${quote(asset.id)};`)[0]?.results[0]:row;if(!current||identitySignature(JSON.parse(current.data))!==identitySignature(asset))throw new Error('Identity changed during verification; no assessment applied');
 if(mode==='apply'){
  const statements=[`INSERT INTO assessments VALUES(${quote(job)},${quote(asset.id)},${quote(JSON.stringify(next))},0,${quote(at)},NULL);`];
  next.evidence.forEach((e,i)=>{const v=e.verification;const verification={claim:claims[i],checks:v,judgment:{type:'noul',noul:v.verified?v.confidence:0},answers:Object.fromEntries(Object.entries(jev.answers).filter(([k])=>k.startsWith('claim_'+i+'_'))),verifier_version:VERIFIER_VERSION,model:jev.model};statements.push(`INSERT INTO facts VALUES(${quote(e.id)},${quote(job)},${quote(e.document_id)},${quote(JSON.stringify(e))},${quote(JSON.stringify(verification))});`);});
  statements.push(`UPDATE assessments SET reviewed_at=${quote(at)} WHERE asset_id=${quote(asset.id)} AND published=0 AND reviewed_at IS NULL AND id!=${quote(job)};`);
  statements.push(`INSERT INTO jobs(id,asset_id,kind,status,stage,created_at,updated_at,input) VALUES(${quote(job)},${quote(asset.id)},'reverification','completed','owner_review',${quote(at)},${quote(at)},${quote(JSON.stringify({previous_id:previous.id,methodology_version:METHODOLOGY_VERSION}))});`);
  statements.push(`INSERT INTO events VALUES(${quote(job+'-superseded')},${quote(asset.id)},'verification_updated',${quote(JSON.stringify({previous_id:previous.id,next_id:job,methodology_version:METHODOLOGY_VERSION}))},${quote(at)});`);
  sqlFile(statements.join('\n'));
 }
 results.push({asset:asset.id,assessment:next,usage:jev.usage,previous_id:previous.id});console.log(JSON.stringify({asset:asset.id,candidates:claims.length,facts:next.evidence.filter(e=>e.verification.verified).length,criteria:next.evidence.filter(e=>e.verification.criterion_verified).length,score:next.score,mode}));
 // Keep completed results recoverable even if a later provider or budget fails.
 fs.writeFileSync(outputPath,JSON.stringify({created_at:new Date().toISOString(),methodology:METHODOLOGY_VERSION,results}),{mode:0o600});
}
