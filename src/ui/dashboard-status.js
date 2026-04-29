function normalizeCount(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  return null;
}

function normalizeState(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : null;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

export function parsePullRequestStatus(repository = {}) {
  const candidateCount = firstDefined(
    normalizeCount(repository?.status?.pr?.openCount),
    normalizeCount(repository?.status?.pr?.count),
    normalizeCount(repository?.pullRequests?.openCount),
    normalizeCount(repository?.pullRequests?.totalCount),
    Array.isArray(repository?.pullRequests) ? repository.pullRequests.length : null,
    normalizeCount(repository?.openPullRequests),
    normalizeCount(repository?.prCount),
  );

  const candidateState = normalizeState(firstDefined(
    repository?.status?.pr?.state,
    repository?.pullRequests?.state,
    repository?.prState,
  ));

  const openCount = candidateCount ?? 0;
  const state = candidateState ?? (openCount > 0 ? 'OPEN' : 'NONE');

  return {
    state,
    openCount,
    label: openCount > 0 ? `PR ${openCount}` : 'No PRs',
    tone: openCount > 0 ? 'attention' : 'neutral',
  };
}

export function parseCiStatus(repository = {}) {
  const rawState = firstDefined(
    repository?.status?.ci?.state,
    repository?.ci?.state,
    repository?.workflowStatus,
    repository?.commitStatus?.state,
    repository?.defaultBranchRef?.target?.statusCheckRollup?.state,
  );

  const state = normalizeState(rawState);
  const normalized = state === 'SUCCESS' ? 'PASS'
    : state === 'FAILURE' || state === 'FAILED' || state === 'ERROR' ? 'FAIL'
      : state === 'PENDING' || state === 'IN_PROGRESS' || state === 'EXPECTED' ? 'PENDING'
        : state === 'CANCELLED' ? 'CANCELLED'
          : state === 'PASS' || state === 'FAIL' ? state
            : 'UNKNOWN';

  const tone = normalized === 'PASS' ? 'positive'
    : normalized === 'FAIL' ? 'critical'
      : normalized === 'PENDING' ? 'attention'
        : 'neutral';

  return {
    state: normalized,
    label: normalized === 'UNKNOWN' ? 'CI unknown' : `CI ${normalized.toLowerCase()}`,
    tone,
  };
}

export function parseWorkingTreeStatus(localRepo = {}) {
  const dirty = Boolean(firstDefined(
    localRepo?.status?.dirty,
    localRepo?.workingTree?.dirty,
    localRepo?.gitStatus?.isDirty,
    localRepo?.git?.dirty,
    localRepo?.isDirty,
  ));

  return {
    isDirty: dirty,
    label: dirty ? 'Dirty' : 'Clean',
    tone: dirty ? 'attention' : 'positive',
  };
}

export function parseAheadBehindStatus(localRepo = {}) {
  const ahead = normalizeCount(firstDefined(
    localRepo?.status?.ahead,
    localRepo?.gitStatus?.ahead,
    localRepo?.branch?.ahead,
    localRepo?.git?.ahead,
    localRepo?.ahead,
  )) ?? 0;

  const behind = normalizeCount(firstDefined(
    localRepo?.status?.behind,
    localRepo?.gitStatus?.behind,
    localRepo?.branch?.behind,
    localRepo?.git?.behind,
    localRepo?.behind,
  )) ?? 0;

  let sync = 'UP_TO_DATE';
  if (ahead > 0 && behind > 0) {
    sync = 'DIVERGED';
  } else if (ahead > 0) {
    sync = 'AHEAD';
  } else if (behind > 0) {
    sync = 'BEHIND';
  }

  return {
    ahead,
    behind,
    sync,
    label: sync === 'UP_TO_DATE' ? 'Up to date' : `↑${ahead} ↓${behind}`,
    tone: sync === 'UP_TO_DATE' ? 'positive' : 'attention',
  };
}

export function buildRepositoryDashboardStatus({
  localRepo = {},
  githubRepository = null,
  health = null,
} = {}) {
  const pr = parsePullRequestStatus(githubRepository ?? {});
  const ci = parseCiStatus(githubRepository ?? {});
  const dirty = parseWorkingTreeStatus(localRepo);
  const aheadBehind = parseAheadBehindStatus(localRepo);
  const repoHealth = {
    isBroken: Boolean(health?.isBroken),
    isStale: Boolean(health?.isStale),
    reasons: Array.isArray(health?.reasons) ? health.reasons : [],
  };

  const name = localRepo?.name
    ?? githubRepository?.name
    ?? githubRepository?.fullName?.split('/').at(-1)
    ?? localRepo?.path
    ?? 'unknown-repo';

  const fullName = githubRepository?.fullName
    ?? githubRepository?.nameWithOwner
    ?? name;

  return {
    name,
    fullName,
    path: localRepo?.path ?? null,
    pr,
    ci,
    dirty,
    aheadBehind,
    health: repoHealth,
  };
}

function formatHealthBadges(health) {
  const badges = [];

  if (health?.isBroken) {
    badges.push('BROKEN');
  }

  if (health?.isStale) {
    badges.push('STALE');
  }

  return badges;
}

export function buildDashboardStatusesFromMatches(matchResults = [], healthByRepo = new Map()) {
  return matchResults.map((match) => {
    const localRepo = match?.localRepo ?? {};
    const health = healthByRepo instanceof Map
      ? healthByRepo.get(localRepo.path) ?? healthByRepo.get(localRepo.name) ?? null
      : null;

    return buildRepositoryDashboardStatus({
      localRepo,
      githubRepository: match?.githubRepository ?? null,
      health,
    });
  });
}

export function formatRepositoryDashboardRow(status) {
  const healthBadges = formatHealthBadges(status.health);
  const parts = [
    status.fullName,
    `[${status.pr.label}]`,
    `[${status.ci.label}]`,
    `[${status.dirty.label}]`,
    `[${status.aheadBehind.label}]`,
    ...healthBadges.map((badge) => `[${badge}]`),
  ];

  return parts.join(' ');
}

export function renderRepositoryDashboard(statusEntries = []) {
  return statusEntries.map(formatRepositoryDashboardRow).join('\n');
}
