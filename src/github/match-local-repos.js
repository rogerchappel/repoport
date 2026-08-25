import { parseGitHubRemote } from '../scanner/git-remote.js';

function normalizeRemoteList(localRepo) {
  if (Array.isArray(localRepo?.remotes)) {
    return localRepo.remotes;
  }

  if (Array.isArray(localRepo?.gitRemotes)) {
    return localRepo.gitRemotes;
  }

  return [];
}

function normalizeRemote(remote) {
  if (!remote) {
    return null;
  }

  if (typeof remote === 'string') {
    return { name: 'origin', url: remote };
  }

  if (typeof remote.url !== 'string') {
    return null;
  }

  return {
    name: typeof remote.name === 'string' && remote.name ? remote.name : 'origin',
    url: remote.url,
  };
}

function remotePriority(remoteName) {
  if (remoteName === 'origin') {
    return 0;
  }

  if (remoteName === 'upstream') {
    return 1;
  }

  return 2;
}

function normalizeIdentity(owner, name) {
  if (
    typeof owner !== 'string'
    || typeof name !== 'string'
    || !owner
    || !name
    || owner.trim() !== owner
    || name.trim() !== name
    || owner.includes('/')
    || name.includes('/')
  ) {
    return null;
  }

  return { owner, name };
}

export function normalizeGitHubRepository(repo) {
  const candidates = [
    repo?.fullName,
    repo?.nameWithOwner,
    repo?.repository,
    repo?.path,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const identity = normalizeIdentity(...candidate.split('/'));
      if (!identity || candidate.split('/').length !== 2) {
        continue;
      }
      const { owner, name } = identity;
      return {
        ...repo,
        owner,
        name,
        fullName: `${owner}/${name}`,
        canonical: `${owner}/${name}`.toLowerCase(),
      };
    }
  }

  const identity = normalizeIdentity(repo?.owner, repo?.name);
  if (identity) {
    const { owner, name } = identity;
    return {
      ...repo,
      owner,
      name,
      fullName: `${owner}/${name}`,
      canonical: `${owner}/${name}`.toLowerCase(),
    };
  }

  const remoteCandidates = [repo?.cloneUrl, repo?.sshUrl, repo?.url, repo?.htmlUrl];

  for (const remoteUrl of remoteCandidates) {
    const parsed = parseGitHubRemote(remoteUrl);

    if (parsed) {
      return {
        ...repo,
        owner: parsed.owner,
        name: parsed.name,
        fullName: parsed.fullName,
        canonical: parsed.fullName.toLowerCase(),
      };
    }
  }

  return null;
}

export function buildGitHubRepositoryIndex(repositories) {
  const index = new Map();

  for (const repository of repositories ?? []) {
    const normalized = normalizeGitHubRepository(repository);

    if (normalized) {
      index.set(normalized.canonical, normalized);
    }
  }

  return index;
}

export function matchLocalRepoToGitHubRemote(localRepo, repositoryIndex) {
  const remotes = normalizeRemoteList(localRepo)
    .map(normalizeRemote)
    .filter(Boolean)
    .sort((left, right) => remotePriority(left.name) - remotePriority(right.name));

  for (const remote of remotes) {
    const parsed = parseGitHubRemote(remote.url);

    if (!parsed) {
      continue;
    }

    const githubRepository = repositoryIndex.get(parsed.fullName.toLowerCase());

    if (githubRepository) {
      return {
        localRepo,
        githubRepository,
        matchedRemote: {
          ...remote,
          parsed,
        },
      };
    }
  }

  return {
    localRepo,
    githubRepository: null,
    matchedRemote: null,
  };
}

export function matchLocalReposToGitHubRemotes(localRepositories, githubRepositories) {
  const repositoryIndex = githubRepositories instanceof Map
    ? githubRepositories
    : buildGitHubRepositoryIndex(githubRepositories);

  return (localRepositories ?? []).map((localRepo) =>
    matchLocalRepoToGitHubRemote(localRepo, repositoryIndex),
  );
}
