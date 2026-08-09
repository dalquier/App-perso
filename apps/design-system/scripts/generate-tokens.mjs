import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(here,'../../../ProjectOS/design-system/tokens/design-tokens.json');
const output=path.resolve(here,'../src/generated/tokens.css');
const tokens=JSON.parse(await readFile(source,'utf8'));
const unit=(parts,value)=> typeof value==='number' ? (parts.includes('fontWeight')?'':parts.includes('motion')?'ms':'px') : '';
const lines=[];
function walk(value,parts=[]){for(const [key,item] of Object.entries(value)){const next=[...parts,key]; if(item && typeof item==='object') walk(item,next); else lines.push(`  --pos-${next.map(x=>x.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)).join('-')}: ${item}${unit(next,item)};`);}}
walk(tokens);
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,`/* GENERATED / DERIVED from ProjectOS/design-system/tokens/design-tokens.json. Do not edit. */\n:root {\n${lines.join('\n')}\n}\n`);
console.log(`Generated ${lines.length} CSS variables from ${path.relative(process.cwd(),source)}`);
