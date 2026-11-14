// Isolated checks while Dallas's scaffold is unavailable. No app dependencies are modified.
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const toolchain = process.env.STEVE_TOOLCHAIN;
if (!toolchain) throw new Error('Set STEVE_TOOLCHAIN to the temporary verification toolchain; see HANDOFF.md.');
const require = createRequire(join(resolve(toolchain), 'package.json'));
const { build } = require('esbuild');
const entryPoint = process.argv[2] ?? 'tests/unit/steve-design.test.ts';
const output = join(toolchain, `${basename(entryPoint, '.ts')}.cjs`);
await build({
  entryPoints: [entryPoint], outfile: output,
  bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
  nodePaths: [join(toolchain, 'node_modules')],
});
const result = spawnSync(process.execPath, ['--test', output], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
