import type {Asset} from './types';
import {publicAssessment} from './scoring';
export const backend=import.meta.env.VITE_API_URL as string|undefined;
const tokenKey='radar-owner-session';
const hash=new URLSearchParams(location.hash.slice(1));
if(hash.has('session')){sessionStorage.setItem(tokenKey,hash.get('session')!);history.replaceState(null,'',location.pathname+location.search);}
const listeners=new Set<(event:string,session:unknown)=>void>();
export async function request<T>(path:string,body?:unknown):Promise<T>{
 if(!backend)throw new Error('Backend not configured');
 const token=sessionStorage.getItem(tokenKey);
 const r=await fetch(`${backend}/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await r.json() as T & {error?:string};if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data;
}
export const auth={
 async getSession(){let session=null;if(sessionStorage.getItem(tokenKey)){try{await request('session');session={active:true};}catch{sessionStorage.removeItem(tokenKey);}}return {data:{session}};},
 onAuthStateChange(fn:(event:string,session:unknown)=>void){listeners.add(fn);return {data:{subscription:{unsubscribe:()=>{listeners.delete(fn);}}}};},
 async signOut(){try{await request('logout',{});}finally{sessionStorage.removeItem(tokenKey);listeners.forEach(f=>f('SIGNED_OUT',null));}},
};
export async function loadAssets():Promise<Asset[]>{return (await request<{assets:Asset[]}>('public')).assets.map(a=>({...a,assessment:a.assessment?publicAssessment(a.assessment):null}));}
export async function login(){if(backend)location.assign(`${backend}/auth/github`);}
