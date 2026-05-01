# repoport

`repoport` is a planned repo fleet dashboard for maintainers juggling many local
and GitHub repositories at once.

It is aimed at the "too many repos for browser tabs" problem: local dirty state,
PRs, CI health, ahead/behind status, stale branches, and release readiness in
one place.

## Why this exists

GitHub works well one repository at a time. It gets clumsy when you are trying
to supervise dozens or hundreds of OSS repos while agents are opening branches,
running checks, and producing PRs.

## Planned V1

The current product brief scopes `repoport` around:

- scanning a local project directory for git repositories
- matching remotes to GitHub repositories
- surfacing dirty state, PR state, CI state, and ahead/behind status
- flagging stale or broken repositories
- supporting a maintainable dashboard workflow for large repo fleets

## Current status

This repository is an early build surface. Product docs, orchestration notes,
and a few tests exist, but the full dashboard experience is not finished yet.

See [docs/PRD.md](docs/PRD.md) for the scoped V1.

## Development

```sh
pnpm install
node --test
```

Before opening a PR, run:

```sh
bash scripts/validate.sh
```

## Safety and local-first notes

`repoport` is meant to help with supervision, not to make destructive decisions
for you. Repo actions should stay inspectable and explicit.

## License

MIT
