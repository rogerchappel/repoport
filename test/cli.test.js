import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { parseArgs, buildHelpText } from '../src/cli.js';

const execFileAsync = promisify(execFile);

async function makeGitRepo(rootPath, name, { remoteUrl, dirty = false } = {}) {
  const repoPath = path.join(rootPath, name);
  await fs.mkdir(repoPath, { recursive: true });
  await execFileAsync('git', ['init'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.name', 'Repoport Test'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.email', 'repoport@example.com'], { cwd: repoPath });
  await fs.writeFile(path.join(repoPath, 'README.md'), `# ${name}\n`);
  await execFileAsync('git', ['add', '.'], { cwd: repoPath });
  await execFileAsync('git', ['commit', '-m', 'init'], { cwd: repoPath });

  if (remoteUrl) {
    await execFileAsync('git', ['remote', 'add', 'origin', remoteUrl], { cwd: repoPath });
  }

  if (dirty) {
    await fs.writeFile(path.join(repoPath, 'dirty.txt'), 'uncommitted\n');
  }

  return repoPath;
}

test('parseArgs understands root/json/depth/nested options', () => {
  assert.deepEqual(parseArgs(['--root', '/tmp/repos', '--json', '--max-depth', '2', '--include-nested', '--ignore', 'dist,node_modules']), {
    root: '/tmp/repos',
    json: true,
    maxDepth: 2,
    includeNested: true,
    help: false,
    version: false,
    ignore: ['dist', 'node_modules'],
  });
});

test('buildHelpText documents local-first behavior', () => {
  const help = buildHelpText();
  assert.match(help, /local-first/);
  assert.match(help, /No network calls/);
});

test('CLI renders dashboard rows for fixture repos', async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-'));

  try {
    await makeGitRepo(rootPath, 'alpha', { remoteUrl: 'https://github.com/octo/alpha.git' });
    await makeGitRepo(rootPath, 'beta', { remoteUrl: 'git@github.com:octo/beta.git', dirty: true });

    const { stdout } = await execFileAsync('node', ['src/bin/repoport.js', '--root', rootPath], {
      cwd: path.resolve(import.meta.dirname, '..'),
    });

    assert.match(stdout, /octo\/alpha \[No PRs\] \[CI unknown\] \[Clean\]/);
    assert.match(stdout, /octo\/beta \[No PRs\] \[CI unknown\] \[Dirty\]/);
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
});

test('CLI emits JSON payloads', async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-json-'));

  try {
    await makeGitRepo(rootPath, 'alpha', { remoteUrl: 'https://github.com/octo/alpha.git' });

    const { stdout } = await execFileAsync('node', ['src/bin/repoport.js', '--root', rootPath, '--json'], {
      cwd: path.resolve(import.meta.dirname, '..'),
    });

    const payload = JSON.parse(stdout);
    assert.equal(payload.repositories.length, 1);
    assert.equal(payload.repositories[0].fullName, 'octo/alpha');
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
});
