// Local maintenance tools share the exact TypeScript verifier with the Worker.
import {registerHooks,createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url);const {transformSync}=require('esbuild');
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier)){const u=new URL(specifier+'.ts',context.parentURL);if(fs.existsSync(u))return next(u.href,context);}return next(specifier,context);},load(url,context,next){if(url.endsWith('.ts'))return {format:'module',source:transformSync(fs.readFileSync(new URL(url),'utf8'),{loader:'ts',format:'esm',target:'es2022'}).code,shortCircuit:true};return next(url,context);}});
