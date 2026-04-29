import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parsePullRequestStatus,
  parseCiStatus,
  parseWorkingTreeStatus,
  parseAheadBehindStatus,
  buildRepositoryDashboardStatus,
  buildDashboardStatusesFromMatches,
  formatRepositoryDashboardRow,
  renderRepositoryDashboard,
} from '../src/ui/dashboard-status.js';

test('parsePullRequestStatus extracts open PR counts from GitHub-like payloads', () => {
  assert.deepEqual(
    parsePullRequestStatus({ pullRequests: { totalCount: 3 } }),
    {
      state: 'OPEN',
      openCount: 3,
      label: 'PR 3',
      tone: 'attention',
    },
  );

  assert.deepEqual(
    parsePullRequestStatus({ status: { pr: { openCount: 0, state: 'merged' } } }),
    {
      state: 'MERGED',
      openCount: 0,
      label: 'No PRs',
      tone: 'neutral',
    },
  );
});

test('parseCiStatus normalizes several CI states', () => {
  assert.deepEqual(
    parseCiStatus({ defaultBranchRef: { target: { statusCheckRollup: { state: 'SUCCESS' } } } }),
    {
      state: 'PASS',
      label: 'CI pass',
      tone: 'positive',
    },
  );

  assert.deepEqual(
    parseCiStatus({ ci: { state: 'failure' } }),
    {
      state: 'FAIL',
      label: 'CI fail',
      tone: 'critical',
    },
  );

  assert.deepEqual(
    parseCiStatus({}),
    {
      state: 'UNKNOWN',
      label: 'CI unknown',
      tone: 'neutral',
    },
  );
});

test('parseWorkingTreeStatus and parseAheadBehindStatus reflect local git state', () => {
  assert.deepEqual(
    parseWorkingTreeStatus({ gitStatus: { isDirty: true } }),
    {
      isDirty: true,
      label: 'Dirty',
      tone: 'attention',
    },
  );

  assert.deepEqual(
    parseAheadBehindStatus({ branch: { ahead: 2, behind: 1 } }),
    {
      ahead: 2,
      behind: 1,
      sync: 'DIVERGED',
      label: '↑2 ↓1',
      tone: 'attention',
    },
  );

  assert.deepEqual(
    parseAheadBehindStatus({}),
    {
      ahead: 0,
      behind: 0,
      sync: 'UP_TO_DATE',
      label: 'Up to date',
      tone: 'positive',
    },
  );
});

test('buildRepositoryDashboardStatus composes local, GitHub, and health data', () => {
  const status = buildRepositoryDashboardStatus({
    localRepo: {
      name: 'repoport',
      path: '/tmp/repoport',
      status: { dirty: true, ahead: 4, behind: 0 },
    },
    githubRepository: {
      fullName: 'roger/repoport',
      pullRequests: { totalCount: 2 },
      ci: { state: 'pending' },
    },
    health: {
      isBroken: false,
      isStale: true,
      reasons: [],
    },
  });

  assert.equal(status.fullName, 'roger/repoport');
  assert.equal(status.pr.openCount, 2);
  assert.equal(status.ci.state, 'PENDING');
  assert.equal(status.dirty.isDirty, true);
  assert.equal(status.aheadBehind.sync, 'AHEAD');
  assert.equal(status.health.isStale, true);
});

test('buildDashboardStatusesFromMatches composes Wave 1 match results into dashboard rows', () => {
  const rows = buildDashboardStatusesFromMatches(
    [{
      localRepo: {
        name: 'repoport',
        path: '/tmp/repoport',
        status: { dirty: false, ahead: 1, behind: 0 },
      },
      githubRepository: {
        fullName: 'roger/repoport',
        pullRequests: { totalCount: 1 },
        ci: { state: 'success' },
      },
    }],
    new Map([['/tmp/repoport', { isBroken: false, isStale: true, reasons: [] }]]),
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].fullName, 'roger/repoport');
  assert.equal(rows[0].health.isStale, true);
});

test('formatRepositoryDashboardRow and renderRepositoryDashboard create readable rows', () => {
  const rows = [
    buildRepositoryDashboardStatus({
      localRepo: { name: 'repoport', status: { dirty: false, ahead: 0, behind: 0 } },
      githubRepository: {
        fullName: 'roger/repoport',
        pullRequests: { totalCount: 1 },
        ci: { state: 'success' },
      },
    }),
    buildRepositoryDashboardStatus({
      localRepo: { name: 'broken-repo', status: { dirty: true, ahead: 0, behind: 3 } },
      githubRepository: { fullName: 'roger/broken-repo' },
      health: { isBroken: true, isStale: false, reasons: ['missing remote'] },
    }),
  ];

  assert.equal(
    formatRepositoryDashboardRow(rows[0]),
    'roger/repoport [PR 1] [CI pass] [Clean] [Up to date]',
  );

  assert.equal(
    renderRepositoryDashboard(rows),
    [
      'roger/repoport [PR 1] [CI pass] [Clean] [Up to date]',
      'roger/broken-repo [No PRs] [CI unknown] [Dirty] [↑0 ↓3] [BROKEN]',
    ].join('\n'),
  );
});
