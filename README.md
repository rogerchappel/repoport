# repoport

Local-first helpers for checking repository freshness and GitHub remote health.

## Status

This is an early JavaScript module. The current implementation exposes pure local health checks for stale repositories, broken git metadata, and GitHub remote URL parsing. It does not call the GitHub API.

## Install

```sh
npm install
```

## Use

Import the health helpers from the installed package:

```js
import { checkRepoHealth } from "repoport";

const health = checkRepoHealth({
  lastCommitDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  hasGit: true,
  remoteUrl: "git@github.com:owner/repo.git",
  isValidGitRepo: true
});

console.log(health);
```

Use `parseGitHubRemote` from `src/github/remoteStatus.js` when you need to normalize HTTPS or SSH GitHub remotes.

## CLI

Render a local repository dashboard from a projects directory:

```sh
npm run smoke
node src/bin/repoport.js --root /path/to/projects
node src/bin/repoport.js --root /path/to/projects --json
node src/bin/repoport.js --root /path/to/projects --max-depth 2
```

The CLI is local-first. It reads git metadata from checkouts under `--root`,
matches GitHub remotes from local URLs, and does not call the GitHub API.
`--max-depth` accepts only non-negative integers such as `0`, `1`, or `2`.
GitHub remotes must be clone-style HTTPS or SSH URLs with exactly an
`owner/repository` path; browser page URLs such as `/owner/repository/issues`
are not treated as repository remotes.

## Verify

```sh
npm test
npm run smoke
npm run release:readiness
npm run release:check
```

`release:readiness` checks repository metadata, packed file declarations,
package smoke coverage, and workflow placeholder cleanup before the broader
release check runs.

## Limitations

- Freshness is based on local metadata supplied by the caller.
- Broken-remote checks validate URL shape only; they do not confirm repository existence or permissions.
- The CLI reports local repository state only; remote PR and CI status are placeholders until network-backed providers are added.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
