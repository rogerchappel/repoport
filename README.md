# repoport 🔭

`repoport` is a local-first repo fleet dashboard for people with too many repositories and not enough browser tabs.

It scans a projects folder, reads local git metadata, matches GitHub remotes, and prints a compact status board showing dirty state, ahead/behind drift, and stale/broken warnings.

## What it does today

- scans a local folder for git repos and worktrees
- reads remotes, dirty state, ahead/behind, and last commit date
- matches GitHub-style remotes without calling the network
- flags stale or broken repos from local evidence only
- renders a text dashboard or JSON for other tools

## Local-first by design

repoport's MVP does **not** call GitHub APIs, publish data, or use stored credentials.
It only inspects local repository metadata already on disk.

That means:

- no hidden network traffic
- no background syncing
- no destructive repo actions
- predictable, fixture-testable behaviour

## Install

```sh
npm install
```

## Quickstart

```sh
node src/bin/repoport.js --root ~/Developer
```

JSON output:

```sh
node src/bin/repoport.js --root ~/Developer --json
```

Include nested repos:

```sh
node src/bin/repoport.js --root ~/Developer --include-nested --max-depth 3
```

## Example output

```text
octo/alpha [No PRs] [CI unknown] [Clean] [Up to date]
octo/beta [No PRs] [CI unknown] [Dirty] [Up to date]
```

## Development

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Docs

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Orchestration](docs/ORCHESTRATION.md)
- [Orchestration JSON](docs/orchestration.json)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Safety notes

repoport is a visibility tool, not an automation bot. It should help you notice repo problems early, not silently mutate your repos.

## License

MIT
