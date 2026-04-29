import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanLocalProjects } from './local-projects.js';

async function withFixture(callback) {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repoport-local-projects-'));

  try {
    await callback(rootPath);
  } finally {
    await fs.rm(rootPath, { recursive: true, force: true });
  }
}

async function makeRepository(directoryPath, gitKind = 'directory') {
  await fs.mkdir(directoryPath, { recursive: true });

  if (gitKind === 'file') {
    await fs.writeFile(path.join(directoryPath, '.git'), 'gitdir: ../.git/worktrees/example\n');
    return;
  }

  await fs.mkdir(path.join(directoryPath, '.git'), { recursive: true });
}

test('scanLocalProjects discovers repositories under a projects folder', async () => {
  await withFixture(async (projectsPath) => {
    await makeRepository(path.join(projectsPath, 'alpha'));
    await makeRepository(path.join(projectsPath, 'nested', 'bravo'));
    await fs.mkdir(path.join(projectsPath, 'notes'), { recursive: true });

    const repositories = await scanLocalProjects(projectsPath);

    assert.deepEqual(repositories.map((repository) => ({
      name: repository.name,
      relativePath: repository.relativePath,
      gitPathType: repository.gitPathType,
    })), [
      { name: 'alpha', relativePath: 'alpha', gitPathType: 'directory' },
      { name: 'bravo', relativePath: 'nested/bravo', gitPathType: 'directory' },
    ]);
  });
});

test('scanLocalProjects supports gitfile repositories such as worktrees', async () => {
  await withFixture(async (projectsPath) => {
    await makeRepository(path.join(projectsPath, 'worktree-repo'), 'file');

    const repositories = await scanLocalProjects(projectsPath);

    assert.equal(repositories.length, 1);
    assert.equal(repositories[0].relativePath, 'worktree-repo');
    assert.equal(repositories[0].gitPathType, 'file');
  });
});

test('scanLocalProjects skips nested repositories by default once a repo is found', async () => {
  await withFixture(async (projectsPath) => {
    await makeRepository(path.join(projectsPath, 'parent'));
    await makeRepository(path.join(projectsPath, 'parent', 'packages', 'child'));

    assert.deepEqual(
      (await scanLocalProjects(projectsPath)).map((repository) => repository.relativePath),
      ['parent'],
    );

    assert.deepEqual(
      (await scanLocalProjects(projectsPath, { includeNestedRepositories: true })).map((repository) => repository.relativePath),
      ['parent', 'parent/packages/child'],
    );
  });
});

test('scanLocalProjects respects maxDepth and ignored directory options', async () => {
  await withFixture(async (projectsPath) => {
    await makeRepository(path.join(projectsPath, 'top'));
    await makeRepository(path.join(projectsPath, 'group', 'deep'));
    await makeRepository(path.join(projectsPath, 'vendor', 'ignored'));

    assert.deepEqual(
      (await scanLocalProjects(projectsPath, { maxDepth: 1 })).map((repository) => repository.relativePath),
      ['top'],
    );

    assert.deepEqual(
      (await scanLocalProjects(projectsPath, { ignoreDirectories: ['vendor'] })).map((repository) => repository.relativePath),
      ['group/deep', 'top'],
    );
  });
});

test('scanLocalProjects returns an empty list for a missing projects folder', async () => {
  await withFixture(async (projectsPath) => {
    const missingPath = path.join(projectsPath, 'does-not-exist');

    assert.deepEqual(await scanLocalProjects(missingPath), []);
  });
});

test('scanLocalProjects rejects invalid roots and options', async () => {
  await withFixture(async (projectsPath) => {
    const filePath = path.join(projectsPath, 'not-a-directory');
    await fs.writeFile(filePath, 'hello');

    await assert.rejects(() => scanLocalProjects(), /projectsPath string/);
    await assert.rejects(() => scanLocalProjects(filePath), /must be a directory/);
    await assert.rejects(() => scanLocalProjects(projectsPath, { maxDepth: -1 }), /maxDepth/);
  });
});
