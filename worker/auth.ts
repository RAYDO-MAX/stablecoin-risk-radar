import {digest,now,id,type Env} from './env';
export async function owner(request:Request,env:Env){const token=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9-]{72,74})$/)?.[1];if(!token)return false;const s=await env.DB.prepare('SELECT github_id FROM sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token),now()).first<{github_id:string}>();return s?.github_id===env.OWNER_GITHUB_ID;}
export async function startAuth(env:Env){if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)return Response.json({error:'GitHub OAuth application has not been configured'}, {status:503});
 const state=id()+id();await env.DB.prepare('INSERT INTO oauth_states VALUES(?,?)').bind(await digest(state),new Date(Date.now()+600000).toISOString()).run();
 const u=new URL('https://github.com/login/oauth/authorize');u.searchParams.set('client_id',env.GITHUB_CLIENT_ID);u.searchParams.set('redirect_uri',env.API_URL+'/auth/callback');u.searchParams.set('state',state);
 return new Response(null,{status:302,headers:{Location:u.href,'Set-Cookie':`radar_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/auth/`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
export async function callback(request:Request,env:Env){const url=new URL(request.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');const cookie=request.headers.get('Cookie')?.match(/(?:^|;\s*)radar_state=([^;]+)/)?.[1];
 if(!state||!code||state!==cookie||!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)return Response.json({error:'Invalid OAuth state'},{status:403});
 const r=await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash=? AND expires_at>? RETURNING state_hash').bind(await digest(state),now()).first();if(!r)return Response.json({error:'Expired OAuth state'},{status:403});
 const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:env.API_URL+'/auth/callback'}),signal:AbortSignal.timeout(15000)});
 const token=await tokenResponse.json() as {access_token?:string};if(!token.access_token)return Response.json({error:'GitHub login failed'},{status:403});
 const ur=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token.access_token}`,Accept:'application/vnd.github+json','User-Agent':'stablecoin-risk-radar'},signal:AbortSignal.timeout(10000)});const user=await ur.json() as {id?:number};
 if(String(user.id)!==env.OWNER_GITHUB_ID)return Response.json({error:'Owner access only'},{status:403});
 const session=id()+id();await env.DB.prepare('INSERT INTO sessions VALUES(?,?,?)').bind(await digest(session),env.OWNER_GITHUB_ID,new Date(Date.now()+86400000).toISOString()).run();
 return new Response(null,{status:302,headers:{Location:env.FRONTEND_URL+'#session='+session,'Set-Cookie':'radar_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/auth/','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
