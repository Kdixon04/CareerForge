// Opt-in test-only SSR/hydration server; never imported by production routes.
import { build } from 'esbuild';import { mkdir } from 'node:fs/promises';import { spawn } from 'node:child_process';
if(process.env.STEVE_ADAPTER_LAB!=='test-double'||process.env.NODE_ENV==='production')throw new Error('Local test-double lab is disabled');
await mkdir('test-results/adapter-lab-assets',{recursive:true});
await build({entryPoints:['src/components/ui/student-data/testing/lab-server.ts'],outfile:'test-results/adapter-lab-assets/server.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',target:'es2022'});
await build({entryPoints:['src/components/ui/student-data/testing/lab-client.tsx'],outfile:'test-results/adapter-lab-assets/client.js',bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'}});
const child=spawn(process.execPath,['test-results/adapter-lab-assets/server.mjs'],{stdio:'inherit',env:process.env});
process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());child.on('exit',code=>process.exit(code??1));
