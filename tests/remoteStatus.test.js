/**
 * Tests for remoteStatus.js
 */

import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import {
  parseGitHubRemote,
  isValidGitHubRemoteUrl,
} from '../src/github/remoteStatus.js';

describe('parseGitHubRemote', () => {
  test('parses HTTPS GitHub URL', () => {
    const result = parseGitHubRemote('https://github.com/owner/repo.git');
    assert.strictEqual(result.hasGitHubRemote, true);
    assert.strictEqual(result.repoOwner, 'owner');
    assert.strictEqual(result.repoName, 'repo');
  });

  test('parses HTTPS GitHub URL without .git suffix', () => {
    const result = parseGitHubRemote('https://github.com/owner/repo');
    assert.strictEqual(result.hasGitHubRemote, true);
    assert.strictEqual(result.repoName, 'repo');
  });

  test('parses SSH GitHub URL', () => {
    const result = parseGitHubRemote('git@github.com:owner/repo.git');
    assert.strictEqual(result.hasGitHubRemote, true);
    assert.strictEqual(result.repoOwner, 'owner');
    assert.strictEqual(result.repoName, 'repo');
  });

  test('returns no remote for empty string', () => {
    const result = parseGitHubRemote('');
    assert.strictEqual(result.hasGitHubRemote, false);
    assert.strictEqual(result.remoteUrl, null);
  });

  test('returns no remote for null', () => {
    const result = parseGitHubRemote(null);
    assert.strictEqual(result.hasGitHubRemote, false);
    assert.strictEqual(result.remoteUrl, null);
  });

  test('returns no remote for non-GitHub URL', () => {
    const result = parseGitHubRemote('https://gitlab.com/owner/repo.git');
    assert.strictEqual(result.hasGitHubRemote, false);
    assert.strictEqual(result.remoteUrl, 'https://gitlab.com/owner/repo.git');
  });

  test('parses URL with hyphenated owner and repo names', () => {
    const result = parseGitHubRemote('https://github.com/my-org/my-repo.git');
    assert.strictEqual(result.hasGitHubRemote, true);
    assert.strictEqual(result.repoOwner, 'my-org');
    assert.strictEqual(result.repoName, 'my-repo');
  });
});

describe('isValidGitHubRemoteUrl', () => {
  test('returns true for valid GitHub HTTPS URL', () => {
    assert.strictEqual(isValidGitHubRemoteUrl('https://github.com/owner/repo.git'), true);
  });

  test('returns true for valid GitHub SSH URL', () => {
    assert.strictEqual(isValidGitHubRemoteUrl('git@github.com:owner/repo.git'), true);
  });

  test('returns false for non-GitHub URL', () => {
    assert.strictEqual(isValidGitHubRemoteUrl('https://gitlab.com/owner/repo.git'), false);
  });

  test('returns false for empty string', () => {
    assert.strictEqual(isValidGitHubRemoteUrl(''), false);
  });
});
