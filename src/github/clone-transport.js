const URL_CLONE_PROTOCOLS = new Set(['https:', 'ssh:', 'git+https:']);

export function parseCloneUrl(remoteUrl) {
  let parsed;

  try {
    parsed = new URL(remoteUrl);
  } catch {
    return null;
  }

  return URL_CLONE_PROTOCOLS.has(parsed.protocol.toLowerCase()) ? parsed : null;
}

export function isScpStyleSshRemote(remoteUrl) {
  return /^(?:[^@\s/:]+@)?[^\s/:]+:[^\s]+$/.test(remoteUrl);
}
