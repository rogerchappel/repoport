const SCP_LIKE_GITHUB_REMOTE = /^(?<protocol>[^@]+@)?(?<host>[^:]+):(?<path>.+)$/;

function stripDotGit(value) {
  return value.endsWith('.git') ? value.slice(0, -4) : value;
}

function cleanPathname(pathname = '') {
  return stripDotGit(pathname.replace(/^\/+/, '').replace(/\/+$/, ''));
}

function splitOwnerAndName(pathname) {
  const parts = cleanPathname(pathname).split('/').filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const [owner, name] = parts;

  if (!owner || !name) {
    return null;
  }

  return { owner, name };
}

function fromStandardUrl(remoteUrl) {
  let url;

  try {
    url = new URL(remoteUrl);
  } catch {
    return null;
  }

  const details = splitOwnerAndName(url.pathname);

  if (!details) {
    return null;
  }

  return {
    host: url.hostname.toLowerCase(),
    owner: details.owner,
    name: details.name,
    protocol: url.protocol.replace(/:$/, '').toLowerCase(),
  };
}

function fromScpLikeUrl(remoteUrl) {
  const match = remoteUrl.match(SCP_LIKE_GITHUB_REMOTE);

  if (!match?.groups?.host || !match.groups.path) {
    return null;
  }

  const details = splitOwnerAndName(match.groups.path);

  if (!details) {
    return null;
  }

  return {
    host: match.groups.host.toLowerCase(),
    owner: details.owner,
    name: details.name,
    protocol: 'ssh',
  };
}

export function parseGitRemoteUrl(remoteUrl) {
  if (typeof remoteUrl !== 'string') {
    return null;
  }

  const trimmed = remoteUrl.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = trimmed.includes('://')
    ? fromStandardUrl(trimmed)
    : fromScpLikeUrl(trimmed);

  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    fullName: `${parsed.owner}/${parsed.name}`,
    canonical: `${parsed.host}/${parsed.owner}/${parsed.name}`.toLowerCase(),
    remoteUrl: trimmed,
    isGitHub: parsed.host === 'github.com',
  };
}

export function parseGitHubRemote(remoteUrl) {
  const parsed = parseGitRemoteUrl(remoteUrl);
  return parsed?.isGitHub ? parsed : null;
}
