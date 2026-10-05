import type {Asset, Assessment, Dimension, DimensionResult, Evidence, Profile} from './types.ts';
export const METHODOLOGY_VERSION = '1.0-experimental';
export const WEIGHTS: Record<Dimension, number> = {backing:25,redemption:20,technology:20,governance:15,market:10,transparency:10};
export const DIMENSIONS = Object.keys(WEIGHTS) as Dimension[];
export const REFRESH_HOURS: Record<Profile,{market:number;documents:number;search:number}> = {economy:{market:24,documents:168,search:168},balanced:{market:1,documents:24,search:168},intensive:{market:.25,documents:6,search:24}};
export function validResult(r: DimensionResult, evidence: Evidence[], now: Date): boolean {
  return r.verified && !r.conflict && r.score !== null && Number.isFinite(r.score) && r.score >= 0 && r.score <= 100 &&
    !!r.relevant_until && new Date(r.relevant_until).getTime() > now.getTime() && r.evidence_ids.length > 0 &&
    r.evidence_ids.every(id=>evidence.some(e=>e.id===id && !!e.quote.trim() && !!e.document_hash));
}
export function calculate(dimensions: Record<Dimension,DimensionResult>, evidence:Evidence[], critical:Assessment['critical'], now=new Date()) {
  const valid = DIMENSIONS.filter(d=>validResult(dimensions[d], evidence, now));
  const completeness = valid.reduce((s,d)=>s+WEIGHTS[d],0);
  const conflict = DIMENSIONS.some(d=>dimensions[d].conflict);
  const score = critical==='none' && !conflict && valid.length===DIMENSIONS.length ? Math.round(DIMENSIONS.reduce((s,d)=>s+dimensions[d].score!*WEIGHTS[d]/100,0)*10)/10 : null;
  const status:Assessment['status'] = critical==='confirmed'?'critical':critical==='suspected'||conflict?'needs_review':score===null?'insufficient':'evaluated';
  return {score,completeness,status};
}
export function needsReview(previous:Assessment|null,next:Assessment):boolean {
  return !previous || previous.methodology_version!==next.methodology_version || previous.identity_signature!==next.identity_signature || next.critical!=='none' ||
    DIMENSIONS.some(d=>next.dimensions[d].conflict) || (previous.score===null)!==(next.score===null) ||
    (previous.score!==null && next.score!==null && Math.abs(previous.score-next.score)>=5);
}
export function publicAssessment(a:Assessment,now=new Date()):Assessment {return {...a,...calculate(a.dimensions,a.evidence,a.critical,now)};}
export function canonicalContract(contract:string):string {return /^0x[0-9a-f]+$/i.test(contract)?contract.toLowerCase():contract;}
export function identitySignature(a:Asset):string {return JSON.stringify({issuer:a.issuer,mechanism:a.mechanism,website:a.website,contracts:a.versions.filter(v=>v.contract).map(v=>[v.chain,canonicalContract(v.contract),v.bridged]).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)))});}
export function assessmentForAsset(a:Assessment,asset:Asset):Assessment {if(a.identity_signature===identitySignature(asset))return publicAssessment(a);const dimensions=Object.fromEntries(DIMENSIONS.map(d=>[d,{...a.dimensions[d],verified:false}])) as Assessment['dimensions'];return {...publicAssessment({...a,dimensions}),status:a.critical==='confirmed'?'critical':'needs_review',explanation:{ru:'Идентичность или версии контрактов изменились. Требуется новое исследование и проверка владельца.',en:'Identity or contract versions changed. New research and owner review are required.'}};}
export function isDue(last:string|null,hours:number,now=new Date()):boolean {return !last || !Number.isFinite(Date.parse(last)) || now.getTime()-Date.parse(last)>=hours*3600_000;}
export function validateQuote(quote:string,text:string):boolean {const n=(s:string)=>s.replace(/\s+/g,' ').trim();return n(quote).length>=12&&n(text).includes(n(quote));}
export function auditMatches(e:Evidence,asset:string,chain?:string,contract?:string):boolean {
  return e.asset_id===asset && (!chain||e.chain===chain) && (!contract||!!e.contract&&canonicalContract(e.contract)===canonicalContract(contract));
}
export function validCitations(ids: string[], retrieved: Evidence[]):boolean {return ids.length>0&&ids.every(id=>retrieved.some(e=>e.id===id));}
