// Managed port-4317 fixture check. Normal Next smoke uses its own port-3000 config.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

if (!process.env.STEVE_TOOLCHAIN || !process.env.STEVE_SCREENSHOTS) {
  throw new Error('Set STEVE_TOOLCHAIN and STEVE_SCREENSHOTS; see ../HANDOFF.md.');
}

const server = spawn(process.execPath, ['src/components/ui/examples/serve-preview.mjs'], {
  stdio: ['ignore', 'inherit', 'inherit'],
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview server exited with ${server.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:4317/');
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the fixture to start. */ }
    await delay(500);
  }
  if (!ready) throw new Error('Preview server did not become ready on port 4317');
  const check = spawn(process.execPath, ['src/components/ui/examples/browser-check.mjs'], { stdio: 'inherit' });
  process.exitCode = await new Promise((resolve, reject) => {
    check.on('error', reject);
    check.on('exit', code => resolve(code ?? 1));
  });
} finally {
  server.kill();
}
