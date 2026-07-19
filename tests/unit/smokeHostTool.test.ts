import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const scriptPath = resolve(projectRoot, 'scripts', 'smoke-host.mjs');
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('browser smoke host tool', () => {
  it('starts, reports, reuses, serves, and tears down an owned Vite instance', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'starbreak-smoke-host-'));
    temporaryDirectories.push(directory);
    const stateFile = resolve(directory, 'state.json');
    const commonArguments = ['--json', '--port', '0', '--state-file', stateFile];
    let host: ChildProcess | null = null;

    const run = async (command: string) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [scriptPath, command, ...commonArguments],
        { cwd: projectRoot, windowsHide: true, timeout: 20_000 }
      );
      return JSON.parse(stdout.trim()) as Record<string, unknown>;
    };

    try {
      host = spawn(process.execPath, [scriptPath, 'start', ...commonArguments], {
        cwd: projectRoot,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      const first = await waitForReadyState(host);
      expect(first).toMatchObject({ status: 'ready', mode: 'dev', reused: false });
      expect(first.browserUrl).toMatch(/^http:\/\/[^/]+:\d+\/StarbreakSalvage\/$/);
      expect(first.localUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/StarbreakSalvage\/$/);

      const page = await fetch(String(first.localUrl));
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('<title>Starbreak Salvage</title>');

      const status = await run('status');
      expect(status).toMatchObject({
        status: 'ready',
        pid: first.pid,
        port: first.port,
        browserUrl: first.browserUrl
      });

      const reused = await run('start');
      expect(reused).toMatchObject({
        status: 'ready',
        reused: true,
        pid: first.pid,
        port: first.port
      });

      const stopped = await run('stop');
      await waitForExit(host);
      host = null;
      expect(stopped).toMatchObject({ status: 'stopped', alreadyStopped: false, pid: first.pid });

      const stoppedAgain = await run('stop');
      expect(stoppedAgain).toMatchObject({ status: 'stopped', alreadyStopped: true });
    } finally {
      if (host && host.exitCode === null) {
        await run('stop').catch(() => host?.kill());
        await waitForExit(host);
      }
    }
  }, 30_000);
});

function waitForReadyState(host: ChildProcess): Promise<Record<string, unknown>> {
  return new Promise((resolveState, rejectState) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(
      () => rejectState(new Error(`Smoke host timed out.\n${stderr}`)),
      15_000
    );
    host.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
      const lineEnd = stdout.indexOf('\n');
      if (lineEnd < 0) return;
      clearTimeout(timeout);
      resolveState(JSON.parse(stdout.slice(0, lineEnd)) as Record<string, unknown>);
    });
    host.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    host.once('exit', (code) => {
      clearTimeout(timeout);
      rejectState(new Error(`Smoke host exited early with ${code}.\n${stderr}`));
    });
  });
}

function waitForExit(host: ChildProcess): Promise<void> {
  if (host.exitCode !== null) return Promise.resolve();
  return new Promise((resolveExit) => host.once('exit', () => resolveExit()));
}
