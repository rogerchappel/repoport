/**
 * GitHub remote status helper.
 *
 * Pure functions to evaluate repo remote health without making network calls.
 * Broken status is determined by local git metadata only.
 */

/**
 * Check if a local repo has a valid GitHub remote configured.
 * @param {string} gitRemoteUrl - The output of `git remote get-url origin` or similar
 * @returns {{ hasGitHubRemote: boolean, remoteUrl: string | null, repoOwner: string | null, repoName: string | null }}
 */
export function parseGitHubRemote(gitRemoteUrl) {
  if (!gitRemoteUrl || typeof gitRemoteUrl !== 'string' || gitRemoteUrl.trim() === '') {
    return { hasGitHubRemote: false, remoteUrl: null, repoOwner: null, repoName: null };
  }

  const trimmed = gitRemoteUrl.trim();
  const githubPattern = /github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i;
  const match = trimmed.match(githubPattern);

  if (!match) {
    return { hasGitHubRemote: false, remoteUrl: trimmed, repoOwner: null, repoName: null };
  }

  return {
    hasGitHubRemote: true,
    remoteUrl: trimmed,
    repoOwner: match[1],
    repoName: match[2].replace(/\.git$/, ''),
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
