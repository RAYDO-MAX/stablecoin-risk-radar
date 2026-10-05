import {CATALOG} from '../src/lib/catalog';import type {Asset} from '../src/lib/types';import {settings,now,type Env} from './env';
export const LLAMA_IDS:Record<string,string>={usdt:'1',usdc:'2',usds:'209',dai:'5',usde:'146',pyusd:'120',rlusd:'250',usd1:'262',usdg:'286',usdd:'14'};
export async function seed(env:Env){await env.DB.batch(CATALOG.map(a=>env.DB.prepare('INSERT OR IGNORE INTO assets VALUES(?,?,1)').bind(a.id,JSON.stringify(a))));}
export async function updateMarket(env:Env){
 const r=await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`DeFiLlama HTTP ${r.status}`);
 const d=await r.json() as {peggedAssets:{id:string;symbol:string;price:number|null;circulating:{peggedUSD?:number};chains:string[]}[]};if(!Array.isArray(d.peggedAssets))throw new Error('Invalid market response');
 const rows=await env.DB.prepare('SELECT id,data FROM assets').all<{id:string;data:string}>();const at=now();const writes=[];
 for(const row of rows.results){const a=JSON.parse(row.data) as Asset;const p=d.peggedAssets.find(p=>p.id===LLAMA_IDS[row.id]&&p.symbol===a.symbol);if(!p)continue;const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
  const price=finite(p.price);const alert=price!==null&&Math.abs(price-1)>.02;
  Object.assign(a,{market_cap:finite(p.circulating?.peggedUSD),price,market_checked_at:at,market_source:'https://defillama.com/stablecoins',review_alert:alert||a.review_alert,versions:[...a.versions,...(p.chains||[]).filter(c=>!a.versions.some(v=>v.chain===c)).map(chain=>({chain,contract:'',status:'unassessed',bridged:null}))]});
  writes.push(env.DB.prepare('UPDATE assets SET data=? WHERE id=?').bind(JSON.stringify(a),row.id));
  if(alert)writes.push(env.DB.prepare('INSERT INTO events VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),a.id,'possible_depeg',JSON.stringify({price,source:a.market_source}),at));
 }
 const s=await settings(env);s.last_market_at=at;writes.push(env.DB.prepare("UPDATE settings SET data=json_set(data,'$.last_market_at',?) WHERE id=1").bind(at));await env.DB.batch(writes);
}
