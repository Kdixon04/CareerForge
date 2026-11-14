// Component fixture unit checks with the separate preview toolchain.
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const toolchain = process.env.STEVE_TOOLCHAIN;
if (!toolchain) throw new Error('Set STEVE_TOOLCHAIN to the temporary verification toolchain; see HANDOFF.md.');
const require = createRequire(join(resolve(toolchain), 'package.json'));
const { build } = require('esbuild');
const output = join(toolchain, 'steve-design-unit.cjs');
await build({
  entryPoints: [resolve('src/components/ui/examples/steve-design.unit.ts')], outfile: output,
  bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
  nodePaths: [join(toolchain, 'node_modules')],
});
const result = spawnSync(process.execPath, ['--test', output], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
