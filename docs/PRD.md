# repoport

Status: ready

## Scorecard

Total: 83/100
Band: build now
Last scored: 2026-04-29
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 18/20 | Directly addresses a repeated workflow pain. |
| Demand signal | 18/20 | Strong source signal or internal demand. |
| V1 buildability | 16/20 | Feasible, but platform/integration risk remains. |
| Differentiation | 12/15 | Clear wedge versus adjacent tools. |
| Agentic workflow leverage | 13/15 | Indirectly useful for agent workflows. |
| Distribution potential | 6/10 | Has demo/content potential. |

## Pitch

A macOS repo fleet dashboard for OSS sprint maintainers: repo health, PRs, CI, local dirty state, stale branches, release readiness, and agent ownership.

## Why It Matters

Roger wants 200+ repos. Browser GitHub does not scale for that. A menu/app dashboard creates non-CLI value and supports the repo-count goal.

## Qualification

RepoBar validates repo-status-in-menubar demand. Roger’s 65-to-200 repo target creates unusually strong internal pain.

Source / adjacent research: Inspired by steipete/RepoBar, GitHub repo menu bar app with 1,232 stars / 70 forks checked 2026-04-29.

Decision: build now

## V1 Scope

- Scan local projects folder
- Match remotes to GitHub repos
- Show PR/CI/dirty/ahead-behind state
- Flag stale or broken repos

## Out of Scope

- Full GitHub client
- Org-wide enterprise analytics
- Auto-merging

## Verification

- Unit or fixture tests for core parsing/generation behavior.
- README with install, quickstart, and safety notes.
- Local-first behavior documented clearly.
- No hidden network, credential, or publish behavior.

## Agent Prompt

Build `repoport` as a macOS menu bar app or Tauri desktop app that keeps local and GitHub repo state visible.
