import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.STARBREAK_PREVIEW_PORT ?? '4174', 10);
const basePath = '/StarbreakSalvage/';
const origin = `http://${host}:${port}`;
const preview = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    host,
    '--port',
    String(port),
    '--strictPort'
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
);
let processOutput = '';
preview.stdout.on('data', (chunk) => {
  processOutput += chunk.toString();
});
preview.stderr.on('data', (chunk) => {
  processOutput += chunk.toString();
});

try {
  const index = await waitForPreview(`${origin}${basePath}`);
  const assetPaths = [...index.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
    (match) => match[1]
  );
  if (assetPaths.length < 2) {
    throw new Error(`Expected hashed JavaScript and CSS assets, found: ${assetPaths.join(', ')}`);
  }

  console.log(`INDEX 200 ${basePath}`);
  for (const assetPath of assetPaths) {
    const assetUrl = new URL(assetPath, origin);
    if (!assetUrl.pathname.startsWith(basePath)) {
      throw new Error(`Asset escaped the GitHub Pages base path: ${assetUrl.pathname}`);
    }
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Asset returned ${response.status}: ${assetUrl.pathname}`);
    }
    console.log(`ASSET ${response.status} ${assetUrl.pathname}`);
  }
} finally {
  preview.kill();
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error(`Preview exited before smoke completed.\n${processOutput}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return response.text();
    } catch {
      // The preview server is still starting.
    }
    await delay(100);
  }
  throw new Error(`Preview did not become ready.\n${processOutput}`);
}
