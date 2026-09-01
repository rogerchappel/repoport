import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { parseArgs, buildHelpText } from '../src/cli.js';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');

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

test('parseArgs retains equals-separated values', () => {
  assert.deepEqual(parseArgs(['--root=/tmp/repos', '--max-depth=2', '--ignore=dist,node_modules']), {
    root: '/tmp/repos',
    json: false,
    maxDepth: 2,
    includeNested: false,
    help: false,
    version: false,
    ignore: ['dist', 'node_modules'],
  });
});

test('parseArgs rejects non-canonical max depths', () => {
  for (const value of ['2oops', '2.5', '-1', '', ' 2']) {
    assert.throws(
      () => parseArgs([`--max-depth=${value}`]),
      { message: `Invalid --max-depth value: ${value}. Expected a non-negative integer.` },
    );
  }
});

test('parseArgs accepts only safe integer max depths', () => {
  assert.equal(
    parseArgs([`--max-depth=${Number.MAX_SAFE_INTEGER}`]).maxDepth,
    Number.MAX_SAFE_INTEGER,
  );

  for (const value of [
    `${Number.MAX_SAFE_INTEGER + 1}`,
    '9999999999999999999999999999999999999999',
  ]) {
    assert.throws(
      () => parseArgs([`--max-depth=${value}`]),
      { message: `Invalid --max-depth value: ${value}. Expected a non-negative safe integer.` },
    );
  }
});

test('parseArgs rejects absent values for value-taking options', () => {
  for (const option of ['--root', '--max-depth', '--ignore']) {
    assert.throws(
      () => parseArgs([option]),
      { message: `${option} requires a value` },
    );
  }
});

test('parseArgs does not consume following options as values', () => {
  for (const option of ['--root', '--max-depth', '--ignore']) {
    assert.throws(
      () => parseArgs([option, '--json']),
      { message: `${option} requires a value` },
    );
  }
});

test('CLI reports invalid max depths with a nonzero exit', async () => {
  await assert.rejects(
    execFileAsync('node', ['src/bin/repoport.js', '--root', '.', '--max-depth=2oops'], {
      cwd: path.resolve(import.meta.dirname, '..'),
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Invalid --max-depth value: 2oops.*non-negative integer/);
      return true;
    },
  );
});

test('CLI version matches package metadata', async () => {
  const fixturePath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-version-'));

  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
    packageJson.version = '9.8.7';
    await fs.writeFile(path.join(fixturePath, 'package.json'), JSON.stringify(packageJson));
    await fs.cp(path.join(projectRoot, 'src'), path.join(fixturePath, 'src'), { recursive: true });

    const { stdout, stderr } = await execFileAsync('node', ['src/bin/repoport.js', '--version'], {
      cwd: fixturePath,
    });

    assert.equal(stdout, 'repoport v9.8.7\n');
    assert.equal(stderr, '');
  } finally {
    await fs.rm(fixturePath, { recursive: true, force: true });
  }
});

test('CLI reports missing option values with a nonzero exit without swallowing --json', async () => {
  for (const option of ['--root', '--max-depth', '--ignore']) {
    for (const trailingArguments of [[], ['--json']]) {
      await assert.rejects(
        execFileAsync('node', ['src/bin/repoport.js', option, ...trailingArguments], {
          cwd: path.resolve(import.meta.dirname, '..'),
        }),
        (error) => {
          assert.equal(error.code, 1);
          assert.equal(error.stdout, '');
          assert.match(error.stderr, new RegExp(`${option} requires a value`));
          return true;
        },
      );
    }
  }
});

test('CLI reports a missing root with a nonzero exit in text and JSON modes', async () => {
  const fixturePath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-missing-root-'));
  const missingPath = path.join(fixturePath, 'does-not-exist');

  try {
    for (const rootArguments of [['--root', missingPath], []]) {
      for (const outputArguments of [[], ['--json']]) {
        await assert.rejects(
          execFileAsync('node', ['src/bin/repoport.js', ...rootArguments, ...outputArguments], {
            cwd: path.resolve(import.meta.dirname, '..'),
            env: { ...process.env, REPOPORT_ROOT: missingPath },
          }),
          (error) => {
            assert.equal(error.code, 1);
            assert.equal(error.stdout, '');
            assert.match(error.stderr, /ENOENT/);
            assert.match(error.stderr, new RegExp(missingPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            return true;
          },
        );
      }
    }
  } finally {
    await fs.rm(fixturePath, { recursive: true, force: true });
  }
});

test('CLI succeeds with an empty result for an existing empty root', async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-empty-root-'));

  try {
    const textResult = await execFileAsync('node', ['src/bin/repoport.js', '--root', rootPath], {
      cwd: path.resolve(import.meta.dirname, '..'),
    });
    assert.match(textResult.stdout, /No git repositories found under/);
    assert.equal(textResult.stderr, '');

    const jsonResult = await execFileAsync('node', ['src/bin/repoport.js', '--root', rootPath, '--json'], {
      cwd: path.resolve(import.meta.dirname, '..'),
    });
    assert.deepEqual(JSON.parse(jsonResult.stdout).repositories, []);
    assert.equal(jsonResult.stderr, '');
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
});

test('buildHelpText documents local-first behavior', () => {
  const help = buildHelpText();
  assert.match(help, /local-first/);
  assert.match(help, /No network calls/);
  assert.match(help, /--max-depth <n>.*non-negative integer/);
  assert.match(help, /--ignore <a,b,c>.*in addition to defaults/);
});

test('CLI custom ignores preserve default ignored directories', async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-ignore-'));

  try {
    await makeGitRepo(rootPath, 'visible');
    await makeGitRepo(path.join(rootPath, 'vendor'), 'vendored');
    await makeGitRepo(path.join(rootPath, 'node_modules'), 'dependency');

    const { stdout } = await execFileAsync('node', [
      'src/bin/repoport.js',
      '--root', rootPath,
      '--ignore', 'vendor',
      '--json',
    ], { cwd: path.resolve(import.meta.dirname, '..') });

    const payload = JSON.parse(stdout);
    assert.deepEqual(payload.repositories.map((repository) => repository.name), ['visible']);
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
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

test('CLI excludes repositories reached through unsupported transports', async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-cli-transports-'));

  try {
    await makeGitRepo(rootPath, 'secure', { remoteUrl: 'git+https://github.com/octo/secure.git' });
    await makeGitRepo(rootPath, 'insecure', { remoteUrl: 'http://github.com/octo/insecure.git' });

    const { stdout } = await execFileAsync('node', ['src/bin/repoport.js', '--root', rootPath, '--json'], {
      cwd: path.resolve(import.meta.dirname, '..'),
    });

    const payload = JSON.parse(stdout);
    const secure = payload.repositories.find((repository) => repository.fullName === 'octo/secure');
    const insecure = payload.repositories.find((repository) => repository.name === 'insecure');
    assert.equal(secure.health.isBroken, false);
    assert.equal(insecure.fullName, 'insecure');
    assert.equal(insecure.health.isBroken, true);
    assert.deepEqual(insecure.health.reasons, ['remote URL is not a valid GitHub URL']);
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
});
