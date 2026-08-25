# repoport

Local-first helpers for checking repository freshness and GitHub remote health.

## Status

This is an early JavaScript module. The current implementation exposes pure local health checks for stale repositories, broken git metadata, and GitHub remote URL parsing. It does not call the GitHub API.

## Install

```sh
npm ci
```

Contributors should use `npm ci` so local verification installs the exact
dependency graph recorded in `package-lock.json`, matching CI.

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

Use `parseGitHubRemote` from `src/github/remoteStatus.js` when you need to
normalize supported GitHub clone remotes.

## CLI

Render a local repository dashboard from a projects directory:

```sh
npm run smoke
node src/bin/repoport.js --root /path/to/projects
node src/bin/repoport.js --root /path/to/projects --json
node src/bin/repoport.js --root /path/to/projects --max-depth 2
node src/bin/repoport.js --root /path/to/projects --ignore vendor,generated
```

The CLI is local-first. It reads git metadata from checkouts under `--root`,
matches GitHub remotes from local URLs, and does not call the GitHub API.
A `--root` path (or `REPOPORT_ROOT` path) that does not exist is treated as an
error and exits nonzero in both text and JSON modes. An existing directory with
no Git repositories is valid and produces an empty result.
`--max-depth` accepts only non-negative integers such as `0`, `1`, or `2`.
`--ignore` adds comma-separated directory basenames to the default ignores
(`.cache`, `.git`, `.hg`, `.svn`, `coverage`, `dist`, and `node_modules`); it
does not replace them.
GitHub remotes must use clone-style `https://`, SCP-style SSH,
`ssh://`, or `git+https://` syntax with exactly an `owner/repository` path.
Other schemes, including plain `http://`, are rejected. Browser page URLs such
as `/owner/repository/issues` are not treated as repository remotes.

The exported `scanLocalProjects(projectsPath, options)` API follows the same
root semantics: a missing path rejects with the filesystem error, while an
existing empty directory resolves to an empty array. The
`options.ignoreDirectories` value is an iterable of extra directory basenames
to ignore while the defaults remain active.

### Dashboard status inputs

The public `parsePullRequestStatus` and `parseAheadBehindStatus` helpers accept
counts as non-negative safe integers or canonical decimal strings (`"0"`,
`"1"`, `"12"`). Signed, padded, fractional, empty, boolean, or mixed-content
values are treated as unavailable and fall back to zero. The public
`parseWorkingTreeStatus` helper considers a repository dirty only when the
selected `dirty`/`isDirty` field is the boolean `true`; strings such as
`"true"` and `"false"` are not boolean status values and fall back to clean.

## Verify

```sh
npm test
npm run smoke
npm run release:readiness
npm run release:check
```

`release:readiness` checks repository metadata, packed file declarations,
package smoke coverage, the committed lockfile and reproducible CI install
contract, and workflow placeholder cleanup before the broader release check
runs.

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
