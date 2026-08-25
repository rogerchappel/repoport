import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  buildGitHubRepositoryIndex,
  matchLocalRepoToGitHubRemote,
  matchLocalReposToGitHubRemotes,
  normalizeGitHubRepository,
} from '../src/github/match-local-repos.js';

const fixture = async (name) =>
  JSON.parse(await fs.readFile(new URL(`../tests/fixtures/github/${name}`, import.meta.url), 'utf8'));

test('normalizeGitHubRepository understands several GitHub payload shapes', () => {
  assert.equal(normalizeGitHubRepository({ fullName: 'octo/repo' }).canonical, 'octo/repo');
  assert.equal(normalizeGitHubRepository({ nameWithOwner: 'octo/repo' }).canonical, 'octo/repo');
  assert.equal(normalizeGitHubRepository({ owner: 'octo', name: 'repo' }).canonical, 'octo/repo');
  assert.equal(
    normalizeGitHubRepository({ cloneUrl: 'https://github.com/octo/repo.git' }).canonical,
    'octo/repo',
  );
});

test('normalizeGitHubRepository rejects malformed repository identities', () => {
  for (const identity of [
    'repo',
    '/repo',
    'owner/',
    'owner//repo',
    'owner/repo/issues',
    ' owner/repo',
    'owner/repo ',
  ]) {
    assert.equal(normalizeGitHubRepository({ fullName: identity }), null, identity);
  }

  for (const repository of [
    { owner: '', name: 'repo' },
    { owner: 'owner', name: '' },
    { owner: 'owner/team', name: 'repo' },
    { owner: 'owner', name: 'repo/issues' },
  ]) {
    assert.equal(normalizeGitHubRepository(repository), null);
  }
});

test('buildGitHubRepositoryIndex indexes repositories by owner/name', () => {
  const index = buildGitHubRepositoryIndex([
    { fullName: 'octo/repo' },
    { nameWithOwner: 'openclaw/stackforge' },
  ]);

  assert.equal(index.get('octo/repo').fullName, 'octo/repo');
  assert.equal(index.get('openclaw/stackforge').fullName, 'openclaw/stackforge');
});

test('matchLocalRepoToGitHubRemote prefers origin over other remotes', () => {
  const index = buildGitHubRepositoryIndex([
    { fullName: 'octo/repo' },
    { fullName: 'octo/fork' },
  ]);

  const match = matchLocalRepoToGitHubRemote(
    {
      path: '/tmp/repo',
      remotes: [
        { name: 'upstream', url: 'https://github.com/octo/repo.git' },
        { name: 'origin', url: 'git@github.com:octo/fork.git' },
      ],
    },
    index,
  );

  assert.equal(match.githubRepository.fullName, 'octo/fork');
  assert.equal(match.matchedRemote.name, 'origin');
});

test('matchLocalRepoToGitHubRemote ignores unsupported transports', () => {
  const index = buildGitHubRepositoryIndex([{ fullName: 'octo/repo' }]);
  const match = matchLocalRepoToGitHubRemote(
    { path: '/tmp/repo', remoteUrl: 'ftp://github.com/octo/repo.git' },
    index,
  );

  assert.equal(match.githubRepository, null);
  assert.equal(match.matchedRemote, null);
});

test('fixture data matches local repositories to GitHub repositories', async () => {
  const [localRepositories, githubRepositories] = await Promise.all([
    fixture('local-repos.json'),
    fixture('repositories.json'),
  ]);

  const matches = matchLocalReposToGitHubRemotes(localRepositories, githubRepositories);

  assert.equal(matches[0].githubRepository.fullName, 'roger/repoport');
  assert.equal(matches[0].matchedRemote.name, 'origin');
  assert.equal(matches[1].githubRepository.fullName, 'openclaw/stackforge');
  assert.equal(matches[1].matchedRemote.name, 'upstream');
  assert.equal(matches[2].githubRepository, null);
  assert.equal(matches[2].matchedRemote, null);
});
