// Managed port-4317 fixture check. Normal Next smoke uses its own port-3000 config.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

if (!process.env.STEVE_TOOLCHAIN || !process.env.STEVE_SCREENSHOTS) {
  throw new Error('Set STEVE_TOOLCHAIN and STEVE_SCREENSHOTS; see ../HANDOFF.md.');
}

const profileSpec = 'tests/e2e/steve-profile.spec.ts';
const withProfile = process.argv[2] === '--profile';
const servers = [];
async function start(command, url) {
  const server = spawn(process.execPath, [command], { stdio: ['ignore', 'inherit', 'inherit'] });
  servers.push(server);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`${command} exited with ${server.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the server to start. */ }
    await delay(500);
  }
  if (!ready) throw new Error(`${command} did not become ready at ${url}`);
}
try {
  if (withProfile) await start('node_modules/next/dist/bin/next', 'http://127.0.0.1:3000/profile');
  await start('src/components/ui/examples/serve-preview.mjs', 'http://127.0.0.1:4317/');
  const check = spawn(process.execPath, [
    'src/components/ui/examples/browser-check.mjs',
    ...(withProfile ? [profileSpec] : []),
  ], { stdio: 'inherit' });
  process.exitCode = await new Promise((resolve, reject) => {
    check.on('error', reject);
    check.on('exit', code => resolve(code ?? 1));
  });
} finally {
  for (const server of servers) server.kill();
}
