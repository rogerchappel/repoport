/**
 * GitHub remote status helper.
 *
 * Pure functions to evaluate repo remote health without making network calls.
 * Broken status is determined by local git metadata only.
 */

const GITHUB_HOST = 'github.com';
const OWNER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const REPO_PATTERN = /^[a-z\d._-]+$/i;

function emptyResult(remoteUrl = null) {
  return { hasGitHubRemote: false, remoteUrl, repoOwner: null, repoName: null };
}

function cleanRepoName(value) {
  return String(value || '').replace(/\.git$/i, '').replace(/\/+$/g, '');
}

function normalizePathParts(pathname) {
  return pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isValidOwnerAndRepo(owner, repo) {
  return OWNER_PATTERN.test(owner) && REPO_PATTERN.test(repo) && repo !== '.' && repo !== '..';
}

function parseUrlStyleRemote(trimmed) {
  const candidate = trimmed.replace(/^git\+/, '');
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.hostname.toLowerCase() !== GITHUB_HOST) return null;

  const parts = normalizePathParts(parsed.pathname);
  if (parts.length !== 2) return null;

  const [owner, rawRepo] = parts;
  const repo = cleanRepoName(rawRepo);
  if (!isValidOwnerAndRepo(owner, repo)) return null;

  return { owner, repo };
}

function parseScpStyleRemote(trimmed) {
  const match = trimmed.match(/^(?:[^@\s]+@)?github\.com:([^\s/]+)\/([^\s/]+?)\/?$/i);
  if (!match) return null;

  const owner = match[1];
  const repo = cleanRepoName(match[2]);
  if (!isValidOwnerAndRepo(owner, repo)) return null;

  return { owner, repo };
}

/**
 * Check if a local repo has a valid GitHub remote configured.
 * @param {string} gitRemoteUrl - The output of `git remote get-url origin` or similar
 * @returns {{ hasGitHubRemote: boolean, remoteUrl: string | null, repoOwner: string | null, repoName: string | null }}
 */
export function parseGitHubRemote(gitRemoteUrl) {
  if (!gitRemoteUrl || typeof gitRemoteUrl !== 'string' || gitRemoteUrl.trim() === '') {
    return emptyResult();
  }

  const trimmed = gitRemoteUrl.trim();
  const parsed = parseUrlStyleRemote(trimmed) ?? parseScpStyleRemote(trimmed);

  if (!parsed) return emptyResult(trimmed);

  return {
    hasGitHubRemote: true,
    remoteUrl: trimmed,
    repoOwner: parsed.owner,
    repoName: parsed.repo,
  };
}

/**
 * Validate a GitHub remote URL for basic structural correctness.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidGitHubRemoteUrl(url) {
  const result = parseGitHubRemote(url);
  return result.hasGitHubRemote && result.repoOwner !== null && result.repoName !== null;
}
