import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const toolchain = resolve(process.env.STEVE_TOOLCHAIN ?? '');
if (!process.env.STEVE_TOOLCHAIN || !process.env.STEVE_SCREENSHOTS) throw new Error('Set STEVE_TOOLCHAIN and STEVE_SCREENSHOTS; see HANDOFF.md.');
const require = createRequire(join(toolchain, 'package.json'));
const { build } = require('esbuild');
const entryPoint = process.argv[2] ?? 'src/components/ui/examples/steve-design.spec.ts';
const testName = basename(entryPoint, '.ts');
const testDir = join(toolchain, 'steve-browser-tests', testName);
await mkdir(testDir, { recursive: true });
await mkdir(process.env.STEVE_SCREENSHOTS, { recursive: true });
await build({ entryPoints: [resolve(entryPoint)], outfile: join(testDir, `${testName}.cjs`), bundle: true, platform: 'node', format: 'cjs', external: ['@playwright/test'] });
const config = join(toolchain, `${testName}.config.cjs`);
await writeFile(config, `module.exports = ${JSON.stringify({
  testDir, testMatch: `**/${testName}.cjs`, workers: 1, timeout: 30000,
  reporter: 'list', outputDir: join(process.env.STEVE_SCREENSHOTS, 'test-results'),
  use: { launchOptions: { executablePath: process.env.STEVE_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }, trace: 'retain-on-failure' },
})};`);
const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', '--config', config], { stdio: 'inherit', env: { ...process.env, STEVE_COMPONENT_TESTS: '1' } });
process.exitCode = result.status ?? 1;
