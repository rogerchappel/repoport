import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

import { scanLocalProjects } from './scanner/local-projects.js';
import { matchLocalReposToGitHubRemotes } from './github/match-local-repos.js';
import { checkRepoHealth } from './scanner/staleDetector.js';
import { buildDashboardStatusesFromMatches, renderRepositoryDashboard } from './ui/dashboard-status.js';
import { parseGitHubRemote } from './scanner/git-remote.js';

const execFile = promisify(execFileCallback);

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.help) {
    process.stdout.write(`${buildHelpText()}\n`);
    return { code: 0, output: 'help' };
  }

  if (options.version) {
    process.stdout.write('repoport v0.1.0\n');
    return { code: 0, output: 'version' };
  }

  if (!options.root) {
    throw new Error('A projects path is required. Use --root <path> or set REPOPORT_ROOT.');
  }

  const root = path.resolve(options.root);
  const repositories = await scanLocalProjects(root, {
    maxDepth: options.maxDepth,
    includeNestedRepositories: options.includeNested,
    ignoreDirectories: options.ignore,
  });

  const localRepos = await Promise.all(repositories.map(async (repository) => enrichLocalRepository(repository)));
  const githubRepositories = dedupeGitHubRepositories(localRepos);
  const matches = matchLocalReposToGitHubRemotes(localRepos, githubRepositories);
  const healthByRepo = new Map(localRepos.map((repository) => [
    repository.path,
    checkRepoHealth({
      lastCommitDate: repository.lastCommitDate,
      hasGit: true,
      remoteUrl: repository.primaryRemote?.url ?? null,
      isValidGitRepo: repository.isValidGitRepo,
    }),
  ]));

  const dashboardRows = buildDashboardStatusesFromMatches(matches, healthByRepo);
  const dashboard = renderRepositoryDashboard(dashboardRows);

  if (options.json) {
    const payload = {
      scannedRoot: root,
      repositories: dashboardRows,
      generatedAt: new Date().toISOString(),
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return { code: 0, output: payload };
  }

  if (!dashboardRows.length) {
    process.stdout.write(`No git repositories found under ${root}\n`);
    return { code: 0, output: [] };
  }

  process.stdout.write(`${dashboard}\n`);
  return { code: 0, output: dashboardRows };
}

export function parseArgs(argv = []) {
  const options = {
    root: process.env.REPOPORT_ROOT ?? null,
    maxDepth: Infinity,
    includeNested: false,
    json: false,
    help: false,
    version: false,
    ignore: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--version' || argument === '-v') {
      options.version = true;
      continue;
    }
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--include-nested') {
      options.includeNested = true;
      continue;
    }
    if (argument === '--root') {
      options.root = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (argument.startsWith('--root=')) {
      options.root = argument.slice('--root='.length);
      continue;
    }
    if (argument === '--max-depth') {
      options.maxDepth = parseDepth(argv[index + 1]);
      index += 1;
      continue;
    }
    if (argument.startsWith('--max-depth=')) {
      options.maxDepth = parseDepth(argument.slice('--max-depth='.length));
      continue;
    }
    if (argument === '--ignore') {
      options.ignore = parseIgnore(argv[index + 1]);
      index += 1;
      continue;
    }
    if (argument.startsWith('--ignore=')) {
      options.ignore = parseIgnore(argument.slice('--ignore='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

export function buildHelpText() {
  return [
    'repoport - local-first repository fleet status dashboard',
    '',
    'Usage:',
    '  repoport --root <projects-path> [--json] [--max-depth <n>] [--include-nested]',
    '',
    'Options:',
    '  --root <path>        Scan this folder for git repositories',
    '  --json               Emit structured JSON instead of text rows',
    '  --max-depth <n>      Limit scan depth (a non-negative integer)',
    '  --include-nested     Continue scanning inside discovered repositories',
    '  --ignore <a,b,c>     Extra directory basenames to skip',
    '  -h, --help           Show this help',
    '  -v, --version        Show version',
    '',
    'Notes:',
    '  - repoport is local-first: it only reads local git metadata.',
    '  - No network calls or credential use are required for the MVP.',
  ].join('\n');
}

function parseDepth(value) {
  if (value === undefined) {
    throw new Error('--max-depth requires a value');
  }
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    throw new Error(`Invalid --max-depth value: ${value}. Expected a non-negative integer.`);
  }
  return Number(value);
}

function parseIgnore(value) {
  if (!value) {
    return [];
  }
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

async function enrichLocalRepository(repository) {
  const [remotes, status, lastCommitDate, isValidGitRepo] = await Promise.all([
    getGitRemotes(repository.path),
    getGitStatus(repository.path),
    getLastCommitDate(repository.path),
    verifyGitRepository(repository.path),
  ]);

  return {
    ...repository,
    remotes,
    primaryRemote: remotes.find((remote) => remote.name === 'origin') ?? remotes[0] ?? null,
    status,
    lastCommitDate,
    isValidGitRepo,
  };
}

async function getGitRemotes(repositoryPath) {
  const output = await git(repositoryPath, ['remote', '-v'], { allowFailure: true });
  if (!output) {
    return [];
  }
  const remotes = new Map();
  for (const line of output.split('\n')) {
    const match = line.trim().match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match) {
      continue;
    }
    const [, name, url] = match;
    if (!remotes.has(name)) {
      remotes.set(name, { name, url, parsed: parseGitHubRemote(url) });
    }
  }
  return Array.from(remotes.values());
}

async function getGitStatus(repositoryPath) {
  const output = await git(repositoryPath, ['status', '--porcelain=2', '--branch'], { allowFailure: true });
  if (!output) {
    return { dirty: false, ahead: 0, behind: 0 };
  }
  const lines = output.split('\n');
  const branchLine = lines.find((line) => line.startsWith('# branch.ab '));
  let ahead = 0;
  let behind = 0;
  if (branchLine) {
    const match = branchLine.match(/\+(\d+)\s+-(\d+)/);
    if (match) {
      ahead = Number.parseInt(match[1], 10) || 0;
      behind = Number.parseInt(match[2], 10) || 0;
    }
  }
  const dirty = lines.some((line) => line && !line.startsWith('#'));
  return { dirty, ahead, behind };
}

async function getLastCommitDate(repositoryPath) {
  const output = await git(repositoryPath, ['log', '-1', '--format=%cI'], { allowFailure: true });
  const trimmed = output?.trim();
  return trimmed ? new Date(trimmed) : null;
}

async function verifyGitRepository(repositoryPath) {
  const output = await git(repositoryPath, ['rev-parse', '--is-inside-work-tree'], { allowFailure: true });
  return output?.trim() === 'true';
}

function dedupeGitHubRepositories(localRepos) {
  const repositories = new Map();
  for (const localRepo of localRepos) {
    for (const remote of localRepo.remotes ?? []) {
      if (!remote.parsed) {
        continue;
      }
      const key = remote.parsed.fullName.toLowerCase();
      if (!repositories.has(key)) {
        repositories.set(key, {
          fullName: remote.parsed.fullName,
          owner: remote.parsed.owner,
          name: remote.parsed.name,
        });
      }
    }
  }
  return Array.from(repositories.values());
}

async function git(repositoryPath, args, { allowFailure = false } = {}) {
  try {
    const { stdout } = await execFile('git', args, { cwd: repositoryPath });
    return stdout;
  } catch (error) {
    if (allowFailure) {
      return null;
    }
    throw error;
  }
}
