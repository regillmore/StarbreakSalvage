import { randomUUID } from 'node:crypto';
import { createSocket } from 'node:dgram';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), '..');
const defaultStateFile = resolve(
  projectRoot,
  'node_modules',
  '.cache',
  'starbreak-salvage',
  'smoke-host.json'
);
const healthPath = '/__starbreak_smoke__/health';
const stateVersion = 1;
const { command, options } = parseArguments(process.argv.slice(2));

try {
  switch (command) {
    case 'start':
      await startHost(options);
      break;
    case 'status':
      await showStatus(options);
      break;
    case 'stop':
      await stopHost(options);
      break;
    case 'help':
      showHelp();
      break;
    default:
      throw new Error(`Unknown smoke-host command: ${command}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ status: 'error', error: message })}\n`);
  } else {
    console.error(`Smoke host error: ${message}`);
  }
  process.exitCode = 1;
}

async function startHost(options) {
  const existing = await inspectHost(options);
  if (existing?.healthy) {
    if (existing.state.mode !== options.mode) {
      throw new Error(
        `A ${existing.state.mode} smoke host is already running at ${existing.state.browserUrl}. Stop it before starting ${options.mode} mode.`
      );
    }
    emitState({ ...existing.state, status: 'ready', reused: true }, options);
    return;
  }
  if (existing?.state && isProcessAlive(existing.state.pid)) {
    throw new Error(
      `Smoke-host state names live PID ${existing.state.pid}, but its ownership or app readiness could not be verified. Refusing to replace a potentially owned process.`
    );
  }

  removeState(options.stateFile);
  const token = randomUUID();
  let healthState = null;
  let requestShutdown = () => undefined;
  const shutdownRequested = new Promise((resolveShutdown) => {
    requestShutdown = resolveShutdown;
  });
  const healthPlugin = {
    name: 'starbreak-smoke-host-health',
    configureServer(server) {
      installHealthMiddleware(server.middlewares, () => healthState, requestShutdown);
    },
    configurePreviewServer(server) {
      installHealthMiddleware(server.middlewares, () => healthState, requestShutdown);
    }
  };
  const vite = await import('vite');
  const inlineConfig = {
    root: projectRoot,
    configFile: resolve(projectRoot, 'vite.config.ts'),
    logLevel: 'warn',
    plugins: [healthPlugin]
  };
  let server;
  if (options.mode === 'preview') {
    server = await vite.preview({
      ...inlineConfig,
      preview: { host: '0.0.0.0', port: options.port, strictPort: false }
    });
  } else {
    server = await vite.createServer({
      ...inlineConfig,
      server: { host: '0.0.0.0', port: options.port, strictPort: false }
    });
    await server.listen();
  }

  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    throw new Error('Vite did not publish a TCP listener.');
  }
  const port = address.port;
  const basePath = normalizeBasePath(server.config.base);
  const lanHost = await resolveLanAddress();
  const localOrigin = `http://127.0.0.1:${port}`;
  const browserOrigin = `http://${formatHost(lanHost)}:${port}`;
  healthState = {
    status: 'ready',
    token,
    pid: process.pid,
    mode: options.mode,
    port
  };
  const state = {
    version: stateVersion,
    token,
    pid: process.pid,
    mode: options.mode,
    port,
    bindHost: '0.0.0.0',
    lanHost,
    basePath,
    localUrl: `${localOrigin}${basePath}`,
    browserUrl: `${browserOrigin}${basePath}`,
    localHealthUrl: `${localOrigin}${healthPath}`,
    browserHealthUrl: `${browserOrigin}${healthPath}`,
    projectRoot,
    stateFile: options.stateFile,
    startedAt: new Date().toISOString()
  };
  writeState(options.stateFile, state);

  if (!(await urlIsReady(state.localUrl))) {
    await server.close();
    removeState(options.stateFile);
    throw new Error('Vite opened a listener but the application page did not become ready.');
  }
  emitState({ ...state, status: 'ready', reused: false }, options);

  const signalReceived = new Promise((resolveSignal) => {
    process.once('SIGINT', resolveSignal);
    process.once('SIGTERM', resolveSignal);
  });
  await Promise.race([shutdownRequested, signalReceived]);
  await server.close();
  const current = readState(options.stateFile);
  if (current?.token === token) removeState(options.stateFile);
}

async function showStatus(options) {
  const inspected = await inspectHost(options);
  if (!inspected?.healthy) {
    if (inspected?.state && isProcessAlive(inspected.state.pid)) {
      emitState({ ...inspected.state, status: 'unhealthy' }, options);
      process.exitCode = 1;
      return;
    }
    if (inspected?.state && !isProcessAlive(inspected.state.pid)) {
      removeState(options.stateFile);
    }
    emitState({ status: 'stopped', stateFile: options.stateFile }, options);
    process.exitCode = 1;
    return;
  }
  emitState({ ...inspected.state, status: 'ready', reused: true }, options);
}

async function stopHost(options) {
  const state = readState(options.stateFile);
  if (!state) {
    emitState({ status: 'stopped', alreadyStopped: true, stateFile: options.stateFile }, options);
    return;
  }

  const health = await readHealth(state.localHealthUrl);
  if (!health || health.token !== state.token || health.pid !== state.pid) {
    if (!isProcessAlive(state.pid)) {
      removeState(options.stateFile);
      emitState({ status: 'stopped', alreadyStopped: true, stateFile: options.stateFile }, options);
      return;
    }
    throw new Error(
      `Refusing to stop PID ${state.pid}: its smoke-host ownership endpoint could not be verified.`
    );
  }

  const stopAccepted = await requestHostStop(state);
  if (!stopAccepted) {
    throw new Error(`The smoke host rejected its authenticated shutdown request.`);
  }
  for (let attempt = 0; attempt < 100 && isProcessAlive(state.pid); attempt += 1) {
    await delay(50);
  }
  if (isProcessAlive(state.pid)) process.kill(state.pid, 'SIGKILL');
  removeState(options.stateFile);
  emitState(
    { status: 'stopped', alreadyStopped: false, pid: state.pid, stateFile: options.stateFile },
    options
  );
}

async function inspectHost(options) {
  const state = readState(options.stateFile);
  if (!state || state.version !== stateVersion || state.projectRoot !== projectRoot) return null;
  if (!isProcessAlive(state.pid)) return { state, healthy: false };

  const health = await readHealth(state.localHealthUrl);
  if (!health || health.token !== state.token || health.pid !== state.pid) {
    return { state, healthy: false };
  }

  const currentAddress = await resolveLanAddress();
  const browserOrigin = `http://${formatHost(currentAddress)}:${state.port}`;
  const refreshed = {
    ...state,
    lanHost: currentAddress,
    browserUrl: `${browserOrigin}${state.basePath}`,
    browserHealthUrl: `${browserOrigin}${healthPath}`
  };
  if (JSON.stringify(refreshed) !== JSON.stringify(state)) {
    writeState(options.stateFile, refreshed);
  }
  return { state: refreshed, healthy: await urlIsReady(refreshed.localUrl) };
}

function installHealthMiddleware(middlewares, getState, requestShutdown) {
  middlewares.use(healthPath, (request, response) => {
    const state = getState();
    if (request.method === 'POST') {
      if (!state || request.headers['x-starbreak-smoke-token'] !== state.token) {
        response.statusCode = 403;
        response.end('Forbidden');
        return;
      }
      response.statusCode = 202;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ status: 'stopping', pid: state.pid }));
      queueMicrotask(requestShutdown);
      return;
    }
    response.statusCode = state ? 200 : 503;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(state ?? { status: 'starting' }));
  });
}

function parseArguments(args) {
  let command = args[0] ?? 'start';
  let optionArgs = args.slice(1);
  if (command.startsWith('--')) {
    optionArgs = args;
    command = 'start';
  }
  if (command === '--help' || command === '-h') command = 'help';

  const values = new Map();
  const flags = new Set();
  for (let index = 0; index < optionArgs.length; index += 1) {
    const argument = optionArgs[index];
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const equalsAt = argument.indexOf('=');
    if (equalsAt > 0) {
      values.set(argument.slice(2, equalsAt), argument.slice(equalsAt + 1));
      continue;
    }
    const key = argument.slice(2);
    if (key === 'json') {
      flags.add(key);
      continue;
    }
    const value = optionArgs[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    index += 1;
  }

  const mode = values.get('mode') ?? process.env.STARBREAK_SMOKE_MODE ?? 'dev';
  if (mode !== 'dev' && mode !== 'preview') {
    throw new Error(`Smoke-host mode must be dev or preview, received: ${mode}`);
  }
  const parsedPort = Number.parseInt(
    values.get('port') ?? process.env.STARBREAK_SMOKE_PORT ?? '4175',
    10
  );
  if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error('Smoke-host port must be between 0 and 65535.');
  }
  const stateFile = resolve(
    values.get('state-file') ?? process.env.STARBREAK_SMOKE_STATE ?? defaultStateFile
  );
  return {
    command,
    options: { json: flags.has('json'), mode, port: parsedPort, stateFile }
  };
}

async function resolveLanAddress() {
  const routedAddress = await resolveRoutedAddress();
  if (routedAddress && isUsableAddress(routedAddress)) return routedAddress;

  const candidates = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter(
      (entry) =>
        (entry.family === 'IPv4' || entry.family === 4) &&
        !entry.internal &&
        isUsableAddress(entry.address)
    )
    .map((entry) => entry.address)
    .sort((left, right) => addressPriority(right) - addressPriority(left));
  return candidates[0] ?? '127.0.0.1';
}

function resolveRoutedAddress() {
  return new Promise((resolveAddress) => {
    const socket = createSocket('udp4');
    let settled = false;
    const finish = (address) => {
      if (settled) return;
      settled = true;
      socket.close();
      resolveAddress(address);
    };
    const timeout = setTimeout(() => finish(null), 250);
    socket.once('error', () => {
      clearTimeout(timeout);
      finish(null);
    });
    socket.connect(53, '1.1.1.1', () => {
      clearTimeout(timeout);
      const address = socket.address();
      finish(typeof address === 'string' ? null : address.address);
    });
  });
}

function isUsableAddress(address) {
  return address !== '0.0.0.0' && address !== '127.0.0.1' && !address.startsWith('169.254.');
}

function addressPriority(address) {
  if (address.startsWith('192.168.')) return 400;
  if (address.startsWith('10.')) return 300;
  const [first, second] = address.split('.').map(Number);
  if (first === 172 && second >= 16 && second <= 31) return 200;
  if (first === 100 && second >= 64 && second <= 127) return 100;
  return 0;
}

function formatHost(host) {
  return host.includes(':') ? `[${host}]` : host;
}

function normalizeBasePath(basePath) {
  const leading = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return leading.endsWith('/') ? leading : `${leading}/`;
}

async function readHealth(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(800) });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function requestHostStop(state) {
  try {
    const response = await fetch(state.localHealthUrl, {
      method: 'POST',
      headers: { 'x-starbreak-smoke-token': state.token },
      signal: AbortSignal.timeout(1200)
    });
    return response.status === 202;
  } catch {
    return false;
  }
}

async function urlIsReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
    return response.ok;
  } catch {
    return false;
  }
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readState(stateFile) {
  if (!existsSync(stateFile)) return null;
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(stateFile, state) {
  mkdirSync(dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  rmSync(stateFile, { force: true });
  renameSync(temporary, stateFile);
}

function removeState(stateFile) {
  rmSync(stateFile, { force: true });
}

function emitState(state, options) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(state)}\n`);
    return;
  }
  if (state.status === 'ready') {
    console.log(`Smoke host ${state.reused ? 'already ready' : 'ready'}.`);
    console.log(`Browser URL: ${state.browserUrl}`);
    console.log(`Local URL:   ${state.localUrl}`);
    console.log(`Mode: ${state.mode} | PID: ${state.pid} | Port: ${state.port}`);
    console.log(`State: ${state.stateFile}`);
    console.log('Stop: npm run smoke:stop');
    return;
  }
  if (state.status === 'unhealthy') {
    console.log(
      `Smoke host PID ${state.pid} is present but failed ownership or application readiness checks.`
    );
    return;
  }
  console.log(state.alreadyStopped ? 'Smoke host is already stopped.' : 'Smoke host stopped.');
}

function showHelp() {
  console.log(`Starbreak Salvage browser smoke host

Usage:
  node scripts/smoke-host.mjs start [--mode dev|preview] [--port 4175] [--json]
  node scripts/smoke-host.mjs status [--json]
  node scripts/smoke-host.mjs stop [--json]

Start stays attached to its managed shell. Status publishes the current LAN browser URL,
and stop authenticates the project-owned process before terminating it.`);
}
