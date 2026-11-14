// Real scanner wrapper. Install pinned tools in an ignored prefix; no runtime deps.
import { mkdir,writeFile,access } from 'node:fs/promises';import { resolve,join } from 'node:path';import { spawnSync } from 'node:child_process';
const root=resolve(process.env.STEVE_SCANNER_ROOT??'node_modules/.cache/steve-security-tools');await mkdir(root,{recursive:true});
const config=join(root,'secretlint.json');await writeFile(config,JSON.stringify({rules:[{id:'@secretlint/secretlint-rule-preset-recommend'}]}));
const patterns=['src/**/*','tests/**/*.{ts,tsx,mjs}','.github/**/*.yml','.env.example'];try{await access('.next/static');patterns.push('.next/static/**/*.js');}catch{/* Build separately to include browser bundles. */}
try{await access('test-results/adapter-lab-assets/client.js');patterns.push('test-results/adapter-lab-assets/client.js');}catch{};
const result=spawnSync(process.execPath,[join(root,'node_modules/secretlint/bin/secretlint.js'),'--secretlintrc',config,'--no-color',...patterns],{stdio:'inherit'});process.exitCode=result.status??1;
