export interface Env{
 DB:D1Database;DOCUMENTS:R2Bucket;FRONTEND_URL:string;API_URL:string;OWNER_GITHUB_ID:string;
 GITHUB_CLIENT_ID?:string;GITHUB_CLIENT_SECRET?:string;OPENROUTER_API_KEY?:string;TYPESAFE_API_KEY?:string;TAVILY_API_KEY?:string;
 QSTASH_TOKEN?:string;QSTASH_URL?:string;QSTASH_CURRENT_SIGNING_KEY?:string;QSTASH_NEXT_SIGNING_KEY?:string;
}
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export async function digest(value:string|ArrayBuffer){const data=typeof value==='string'?new TextEncoder().encode(value):value;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function settings(env:Env){return JSON.parse((await env.DB.prepare('SELECT data FROM settings WHERE id=1').first<{data:string}>())!.data);}
export function safeURL(s:unknown):string{if(typeof s!=='string'||s.length>2048)throw new Error('Invalid URL');const u=new URL(s);const host=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port||!host.includes('.')||host.includes(':')||/^[\d.]+$/.test(host)||/\.(local|internal|localhost)$/.test(host))throw new Error('Public HTTPS URL required');return u.href;}
export async function reserve(env:Env,key:string,provider:string,ceiling:number){
 const r=await env.DB.prepare(`INSERT INTO budget_ledger(id,month,provider,ceiling_usd,status,created_at) SELECT ?,?,?,?,'reserved',? WHERE ? <= COALESCE((SELECT json_extract(data,'$.monthly_budget_usd') FROM settings WHERE id=1),0) - COALESCE((SELECT sum(ceiling_usd) FROM budget_ledger WHERE month=?),0) ON CONFLICT(id) DO NOTHING`).bind(key,now().slice(0,7),provider,ceiling,now(),ceiling,now().slice(0,7)).run();
 if(r.meta.changes===0){const old=await env.DB.prepare('SELECT status FROM budget_ledger WHERE id=?').bind(key).first();if(!old)throw new Error('Monthly API budget exhausted');}
}
export async function settle(env:Env,key:string,actual?:number){await env.DB.prepare("UPDATE budget_ledger SET status='settled',actual_usd=? WHERE id=?").bind(actual??null,key).run();}
