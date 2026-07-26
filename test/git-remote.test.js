import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGitRemoteUrl, parseGitHubRemote } from '../src/scanner/git-remote.js';

test('parseGitRemoteUrl supports GitHub HTTPS remotes', () => {
  assert.deepEqual(parseGitRemoteUrl('https://github.com/octo/repo.git'), {
    host: 'github.com',
    owner: 'octo',
    name: 'repo',
    protocol: 'https',
    fullName: 'octo/repo',
    canonical: 'github.com/octo/repo',
    remoteUrl: 'https://github.com/octo/repo.git',
    isGitHub: true,
  });
});

test('parseGitRemoteUrl supports SSH SCP-like remotes', () => {
  assert.deepEqual(parseGitRemoteUrl('git@github.com:octo/repo.git'), {
    host: 'github.com',
    owner: 'octo',
    name: 'repo',
    protocol: 'ssh',
    fullName: 'octo/repo',
    canonical: 'github.com/octo/repo',
    remoteUrl: 'git@github.com:octo/repo.git',
    isGitHub: true,
  });
});

test('parseGitRemoteUrl supports SSH URLs', () => {
  assert.deepEqual(parseGitRemoteUrl('ssh://git@github.com/octo/repo'), {
    host: 'github.com',
    owner: 'octo',
    name: 'repo',
    protocol: 'ssh',
    fullName: 'octo/repo',
    canonical: 'github.com/octo/repo',
    remoteUrl: 'ssh://git@github.com/octo/repo',
    isGitHub: true,
  });
});

test('parseGitHubRemote rejects non-GitHub remotes', () => {
  assert.equal(parseGitHubRemote('git@gitlab.com:octo/repo.git'), null);
  assert.equal(parseGitHubRemote('not a remote'), null);
});

test('parseGitRemoteUrl rejects URLs with extra path segments', () => {
  assert.equal(parseGitRemoteUrl('https://github.com/octo/repo/issues'), null);
  assert.equal(parseGitRemoteUrl('git@github.com:octo/repo/extra.git'), null);
  assert.equal(parseGitRemoteUrl('ssh://git@github.com/octo/repo/pulls'), null);
});
