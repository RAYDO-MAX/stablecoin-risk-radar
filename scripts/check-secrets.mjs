import {execFileSync} from 'node:child_process';import {readFileSync} from 'node:fs';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const patterns=[/sk-or-v1-[a-f0-9]{40,}/,/apikey_[a-f0-9]{24,}_/,/gh[pousr]_[A-Za-z0-9]{25,}/,/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,/tvly-[A-Za-z0-9_-]{20,}/];
const bad=[];for(const f of files){if(/(^|\/)\.env(\.|$)/.test(f)&&!f.endsWith('.env.example')){bad.push(f);continue;}try{const s=readFileSync(f,'utf8');if(patterns.some(p=>p.test(s)))bad.push(f);}catch{}}
if(bad.length){console.error('Potential secret in repository file(s): '+bad.join(', '));process.exit(1);}console.log(`Secret scan passed: ${files.length} repository files checked.`);
