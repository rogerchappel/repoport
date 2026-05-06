export {
  parseGitRemoteUrl,
  parseGitHubRemote,
} from './scanner/git-remote.js';

export {
  runCli,
  parseArgs,
  buildHelpText,
} from './cli.js';

export {
  normalizeGitHubRepository,
  buildGitHubRepositoryIndex,
  matchLocalRepoToGitHubRemote,
  matchLocalReposToGitHubRemotes,
} from './github/match-local-repos.js';

export {
  scanLocalProjects,
} from './scanner/local-projects.js';

export {
  checkRepoHealth,
  detectBroken,
  detectStale,
  DEFAULT_STALE_THRESHOLD_MS,
} from './scanner/staleDetector.js';

export {
  parsePullRequestStatus,
  parseCiStatus,
  parseWorkingTreeStatus,
  parseAheadBehindStatus,
  buildRepositoryDashboardStatus,
  buildDashboardStatusesFromMatches,
  formatRepositoryDashboardRow,
  renderRepositoryDashboard,
} from './ui/dashboard-status.js';
