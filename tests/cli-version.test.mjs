/** Run after npm run build: node --test tests/cli-version.test.mjs */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('CLI version in the published package', () => {
  let temporaryRoot;
  let manifestPath;
  let cliPath;
  let invocationDirectory;
  let originalManifest;

  before(() => {
    temporaryRoot = mkdtempSync(join(tmpdir(), 'scell-cli-version-'));
    const packed = JSON.parse(execFileSync('npm', [
      'pack', '--json', '--ignore-scripts', '--pack-destination', temporaryRoot,
    ], { cwd: projectRoot, encoding: 'utf8', timeout: 60_000 }));
    execFileSync('tar', ['-xzf', join(temporaryRoot, packed[0].filename), '-C', temporaryRoot], {
      timeout: 60_000,
    });
    const packageRoot = join(temporaryRoot, 'package');
    manifestPath = join(packageRoot, 'package.json');
    originalManifest = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(originalManifest);
    cliPath = resolve(packageRoot, manifest.bin['scell-mcp']);
    invocationDirectory = join(temporaryRoot, 'invocation');
    mkdirSync(invocationDirectory);
  });

  after(() => {
    if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
  });

  function assertCliVersion(version) {
    const environment = { ...process.env };
    delete environment.SCELL_API_KEY;
    const runCli = flag => execFileSync(process.execPath, [cliPath, flag], {
      cwd: invocationDirectory,
      env: environment,
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.equal(runCli('--version').trim(), version);
    assert.ok(
      runCli('--help').includes(`Scell.io MCP Configuration Generator v${version}\n`),
      `CLI help should display package version ${version}`,
    );
  }

  it('uses the extracted manifest for --version and --help from another cwd', () => {
    assertCliVersion(JSON.parse(originalManifest).version);
  });

  it('reflects a manifest-only version change without rebuilding the CLI', () => {
    const manifest = JSON.parse(originalManifest);
    const changedVersion = '987.654.321-cli-regression';
    assert.notEqual(manifest.version, changedVersion);
    try {
      writeFileSync(manifestPath, JSON.stringify({ ...manifest, version: changedVersion }));
      assertCliVersion(changedVersion);
    } finally {
      writeFileSync(manifestPath, originalManifest);
    }
  });
});
