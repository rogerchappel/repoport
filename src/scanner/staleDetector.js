/**
 * Stale and broken repository detector.
 *
 * Pure functions to evaluate repo health status.
 * No network calls — only local metadata.
 */

import { isValidGitHubRemoteUrl } from '../github/remoteStatus.js';

/**
 * Default stale threshold in milliseconds (180 days).
 */
export const DEFAULT_STALE_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Determine if a repo is stale based on last commit date.
 * @param {Date | number | null} lastCommitDate - Date of last commit, or epoch timestamp
 * @param {number} [thresholdMs] - Stale threshold in ms (defaults to DEFAULT_STALE_THRESHOLD_MS)
 * @returns {{ isStale: boolean, daysSinceLastCommit: number | null }}
 */
export function detectStale(lastCommitDate, thresholdMs = DEFAULT_STALE_THRESHOLD_MS) {
  if (lastCommitDate === null || lastCommitDate === undefined) {
    return { isStale: true, daysSinceLastCommit: null };
  }

  const commitDate = lastCommitDate instanceof Date ? lastCommitDate : new Date(lastCommitDate);
  if (isNaN(commitDate.getTime())) {
    return { isStale: true, daysSinceLastCommit: null };
  }

  const now = new Date();
  const diffMs = now.getTime() - commitDate.getTime();
  const daysSince = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  return {
    isStale: diffMs > thresholdMs,
    daysSinceLastCommit: daysSince,
  };
}

/**
 * Determine if a repo is broken based on local git health signals.
 * @param {{ hasGit: boolean, remoteUrl: string | null, isValidGitRepo: boolean }} repoMeta
 * @returns {{ isBroken: boolean, reasons: string[] }}
 */
export function detectBroken(repoMeta) {
  const reasons = [];

  if (!repoMeta || typeof repoMeta !== 'object') {
    return { isBroken: true, reasons: ['no repo metadata provided'] };
  }

  if (!repoMeta.hasGit) {
    reasons.push('no .git directory found');
  }

  if (!repoMeta.isValidGitRepo) {
    reasons.push('invalid git repository state');
  }

  if (!repoMeta.remoteUrl) {
    reasons.push('no remote URL configured');
  } else if (!isValidGitHubRemoteUrl(repoMeta.remoteUrl)) {
    reasons.push('remote URL is not a valid GitHub URL');
  }

  return {
    isBroken: reasons.length > 0,
    reasons,
  };
}

/**
 * Combined health check: returns stale and broken status together.
 * @param {{ lastCommitDate: Date | number | null, hasGit: boolean, remoteUrl: string | null, isValidGitRepo: boolean }} repoMeta
 * @param {number} [staleThresholdMs]
 * @returns {{ isStale: boolean, daysSinceLastCommit: number | null, isBroken: boolean, reasons: string[] }}
 */
export function checkRepoHealth(repoMeta, staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS) {
  const stale = detectStale(repoMeta?.lastCommitDate ?? null, staleThresholdMs);
  const broken = detectBroken({
    hasGit: repoMeta?.hasGit ?? false,
    remoteUrl: repoMeta?.remoteUrl ?? null,
    isValidGitRepo: repoMeta?.isValidGitRepo ?? false,
  });

  return {
    isStale: stale.isStale,
    daysSinceLastCommit: stale.daysSinceLastCommit,
    isBroken: broken.isBroken,
    reasons: broken.reasons,
  };
}
