# repoport

Local-first helpers for checking repository freshness and GitHub remote health.

## Status

This is an early JavaScript module. The current implementation exposes pure local health checks for stale repositories, broken git metadata, and GitHub remote URL parsing. It does not call the GitHub API.

## Install

```sh
npm install
```

## Use

Import the health helpers from the package source while the package is still pre-release:

```js
import { checkRepoHealth } from "./src/scanner/staleDetector.js";

const health = checkRepoHealth({
  lastCommitDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  hasGit: true,
  remoteUrl: "git@github.com:owner/repo.git",
  isValidGitRepo: true
});

console.log(health);
```

Use `parseGitHubRemote` from `src/github/remoteStatus.js` when you need to normalize HTTPS or SSH GitHub remotes.

## Verify

```sh
npm test
```

## Limitations

- Freshness is based on local metadata supplied by the caller.
- Broken-remote checks validate URL shape only; they do not confirm repository existence or permissions.
- There is no CLI yet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
