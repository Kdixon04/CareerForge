import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

if (!process.env.STEVE_TOOLCHAIN) throw new Error('Set STEVE_TOOLCHAIN; see HANDOFF.md.');
const toolchain = resolve(process.env.STEVE_TOOLCHAIN);
const require = createRequire(join(toolchain, 'package.json'));
const ts = require('typescript');
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
}
await collect('src/components');
const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  strict: true, noEmit: true, esModuleInterop: true,
  types: ['node'], typeRoots: [join(toolchain, 'node_modules/@types')],
  baseUrl: toolchain, paths: {
    react: ['node_modules/@types/react'], 'react/*': ['node_modules/@types/react/*'],
    'react-dom/*': ['node_modules/@types/react-dom/*'],
    '@playwright/test': ['node_modules/@playwright/test'],
  },
});
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCurrentDirectory: () => process.cwd(), getCanonicalFileName: path => path, getNewLine: () => '\n',
}));
console.log(`${files.length} Steve component/test files checked; ${diagnostics.length} diagnostics.`);
process.exitCode = diagnostics.length ? 1 : 0;
