// Isolated SSR + hydration fixture; NOT the CareerForge application or its API.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const toolchain = process.env.STEVE_TOOLCHAIN;
if (!toolchain) throw new Error('Set STEVE_TOOLCHAIN; see ../HANDOFF.md.');
const require = createRequire(join(resolve(toolchain), 'package.json'));
const { build } = require('esbuild');
const React = require('react');
const { renderToString } = require('react-dom/server');
const nodePaths = [join(toolchain, 'node_modules')];
await build({ entryPoints: ['src/components/ui/examples/DesignPreview.tsx'], outfile: join(toolchain, 'steve-preview.cjs'), bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/*'], nodePaths });
await build({ entryPoints: ['src/components/ui/examples/preview-client.tsx'], outfile: join(toolchain, 'steve-preview.js'), bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', nodePaths, define: { 'process.env.NODE_ENV': '"development"' } });
await build({ entryPoints: ['src/components/theme/theme.ts'], outfile: join(toolchain, 'steve-theme.cjs'), bundle: true, platform: 'node', format: 'cjs' });
const { DesignPreview } = require(join(toolchain, 'steve-preview.cjs'));
const { THEME_INIT_SCRIPT } = require(join(toolchain, 'steve-theme.cjs'));
const assets = new Map([
  ['/preview.js', [join(toolchain, 'steve-preview.js'), 'text/javascript']],
  ['/tokens.css', ['src/styles/tokens.css', 'text/css']],
  ['/components.css', ['src/styles/components.css', 'text/css']],
  ['/preview.css', ['src/components/ui/examples/preview.css', 'text/css']],
  ['/brand/careerforge.webp', ['public/brand/careerforge.webp', 'image/webp']],
]);
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    res.setHeader('Cache-Control', 'no-store');
    if (pathname === '/favicon.ico') {
      res.writeHead(204); res.end();
    } else if (assets.has(pathname)) {
      const [path, type] = assets.get(pathname);
      res.writeHead(200, { 'Content-Type': type });
      res.end(await readFile(path));
    } else if (['/', '/profile', '/saved', '/jobs'].includes(pathname)) {
      const html = renderToString(React.createElement(DesignPreview, { currentPath: pathname }));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Career Forge · component preview</title><script>${THEME_INIT_SCRIPT}</script><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components.css"><link rel="stylesheet" href="/preview.css"></head><body><div id="root">${html}</div><script type="module" src="/preview.js"></script></body></html>`);
    } else {
      res.writeHead(404); res.end('Not found');
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500); res.end('Preview unavailable');
  }
});
server.listen(4317, '127.0.0.1', () => console.log('Component fixture: http://127.0.0.1:4317 — no database/AI'));
