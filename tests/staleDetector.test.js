/**
 * Tests for staleDetector.js
 */

import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import {
  detectStale,
  detectBroken,
  checkRepoHealth,
  DEFAULT_STALE_THRESHOLD_MS,
} from '../src/scanner/staleDetector.js';

describe('detectStale', () => {
  test('returns stale: true when lastCommitDate is null', () => {
    const result = detectStale(null);
    assert.strictEqual(result.isStale, true);
    assert.strictEqual(result.daysSinceLastCommit, null);
  });

  test('returns stale: true when lastCommitDate is undefined', () => {
    const result = detectStale(undefined);
    assert.strictEqual(result.isStale, true);
    assert.strictEqual(result.daysSinceLastCommit, null);
  });

  test('returns stale: true for a date 200 days ago', () => {
    const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const result = detectStale(oldDate);
    assert.strictEqual(result.isStale, true);
    assert.ok(result.daysSinceLastCommit >= 199 && result.daysSinceLastCommit <= 201);
  });

  test('returns stale: false for a date 30 days ago', () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = detectStale(recentDate);
    assert.strictEqual(result.isStale, false);
    assert.ok(result.daysSinceLastCommit >= 29 && result.daysSinceLastCommit <= 31);
  });

  test('respects custom threshold', () => {
    const customThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    const date60DaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = detectStale(date60DaysAgo, customThreshold);
    assert.strictEqual(result.isStale, true);
  });

  test('returns stale: true for invalid date', () => {
    const result = detectStale('not-a-date');
    assert.strictEqual(result.isStale, true);
    assert.strictEqual(result.daysSinceLastCommit, null);
  });

  test('works with epoch timestamp', () => {
    const recentEpoch = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
    const result = detectStale(recentEpoch);
    assert.strictEqual(result.isStale, false);
  });
});

describe('detectBroken', () => {
  test('returns broken: true with reasons when no metadata', () => {
    const result = detectBroken(null);
    assert.strictEqual(result.isBroken, true);
    assert.ok(result.reasons.length > 0);
  });

  test('returns broken: false for valid repo with GitHub remote', () => {
    const result = detectBroken({
      hasGit: true,
      remoteUrl: 'https://github.com/owner/repo.git',
      isValidGitRepo: true,
    });
    assert.strictEqual(result.isBroken, false);
    assert.strictEqual(result.reasons.length, 0);
  });

  test('returns broken: true when hasGit is false', () => {
    const result = detectBroken({
      hasGit: false,
      remoteUrl: 'https://github.com/owner/repo.git',
      isValidGitRepo: true,
    });
    assert.strictEqual(result.isBroken, true);
    assert.ok(result.reasons.includes('no .git directory found'));
  });

  test('returns broken: true when isValidGitRepo is false', () => {
    const result = detectBroken({
      hasGit: true,
      remoteUrl: 'https://github.com/owner/repo.git',
      isValidGitRepo: false,
    });
    assert.strictEqual(result.isBroken, true);
    assert.ok(result.reasons.includes('invalid git repository state'));
  });

  test('returns broken: true when remoteUrl is missing', () => {
    const result = detectBroken({
      hasGit: true,
      remoteUrl: null,
      isValidGitRepo: true,
    });
    assert.strictEqual(result.isBroken, true);
    assert.ok(result.reasons.includes('no remote URL configured'));
  });

  test('returns broken: true when remoteUrl is not GitHub', () => {
    const result = detectBroken({
      hasGit: true,
      remoteUrl: 'https://gitlab.com/owner/repo.git',
      isValidGitRepo: true,
    });
    assert.strictEqual(result.isBroken, true);
    assert.ok(result.reasons.includes('remote URL is not a valid GitHub URL'));
  });

  test('accepts SSH-format GitHub remote', () => {
    const result = detectBroken({
      hasGit: true,
      remoteUrl: 'git@github.com:owner/repo.git',
      isValidGitRepo: true,
    });
    assert.strictEqual(result.isBroken, false);
  });
});

describe('checkRepoHealth', () => {
  test('combines stale and broken checks', () => {
    const health = checkRepoHealth({
      lastCommitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      hasGit: true,
      remoteUrl: 'https://github.com/owner/repo.git',
      isValidGitRepo: true,
    });

    assert.strictEqual(health.isStale, false);
    assert.strictEqual(health.isBroken, false);
    assert.strictEqual(health.reasons.length, 0);
  });

  test('detects both stale and broken in one call', () => {
    const health = checkRepoHealth({
      lastCommitDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      hasGit: false,
      remoteUrl: null,
      isValidGitRepo: false,
    });

    assert.strictEqual(health.isStale, true);
    assert.strictEqual(health.isBroken, true);
    assert.ok(health.reasons.length > 0);
  });

  test('respects custom stale threshold', () => {
    const customThreshold = 30 * 24 * 60 * 60 * 1000;
    const health = checkRepoHealth(
      {
        lastCommitDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        hasGit: true,
        remoteUrl: 'https://github.com/owner/repo.git',
        isValidGitRepo: true,
      },
      customThreshold,
    );
    assert.strictEqual(health.isStale, true);
    assert.strictEqual(health.isBroken, false);
  });
});
