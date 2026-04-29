# Orchestration Handoff

## Summary

- Workspace: default
- Repository: repoport
- Source: taskbrief + llm-orchestration (openai:gpt-4.1-mini)
- Total tasks: 6
- Dispatch now: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories
- Blocked tasks: repoport-display-pr-ci-dirty-and-ahead-behind-state-in-dashboard

## Dispatch Prompt

Dispatch Wave 1 first. These tasks may run concurrently:
- repoport-implement-local-projects-folder-scanning
- repoport-match-local-repos-to-github-remotes
- repoport-flag-stale-or-broken-repositories
Wait for the whole wave to finish and pass verification before dispatching the next sequential wave.

## LLM Refinement Notes

- The three medium-risk implementation tasks can run concurrently as they have no dependencies among them and can safely execute in parallel.
- The high-risk UI feature task is separated into its own wave to allow for human approval before dispatch and to avoid blocking other implementation tasks.
- The verification tests depend on all implementation tasks including the high-risk UI feature, so they run sequentially after all implementation tasks complete.
- Documentation depends on all implementation and verification tasks to ensure completeness and accuracy, so it is scheduled last.

## Sequential Waves

### Wave 1: Implementation core features

- Mode inside wave: concurrent
- Dispatch: now
- Tasks: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories

### Wave 2: High-risk UI feature

- Mode inside wave: sequential
- Dispatch: after_human_decision
- Tasks: repoport-display-pr-ci-dirty-and-ahead-behind-state-in-dashboard

### Wave 3: Verification / tests

- Mode inside wave: sequential
- Dispatch: after_dependencies
- Tasks: repoport-add-unit-and-fixture-tests-for-core-parsing-and-generation-behavior

### Wave 4: Documentation / examples

- Mode inside wave: sequential
- Dispatch: after_dependencies
- Tasks: repoport-write-readme-with-install-quickstart-and-safety-notes

## Task Dependencies

### repoport-implement-local-projects-folder-scanning: Implement local projects folder scanning

- Phase: implementation
- Repo: repoport
- Branch: agent/implement-local-projects-folder-scanning
- Risk: medium
- Depends on: None
- Can run concurrently with: repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories
- Dispatchable now: Yes
- Blocked by: None

### repoport-match-local-repos-to-github-remotes: Match local repos to GitHub remotes

- Phase: implementation
- Repo: repoport
- Branch: agent/match-local-repos-to-github-remotes
- Risk: medium
- Depends on: None
- Can run concurrently with: repoport-implement-local-projects-folder-scanning, repoport-flag-stale-or-broken-repositories
- Dispatchable now: Yes
- Blocked by: None

### repoport-flag-stale-or-broken-repositories: Flag stale or broken repositories

- Phase: implementation
- Repo: repoport
- Branch: agent/flag-stale-or-broken-repositories
- Risk: medium
- Depends on: None
- Can run concurrently with: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes
- Dispatchable now: Yes
- Blocked by: None

### repoport-display-pr-ci-dirty-and-ahead-behind-state-in-dashboard: Display PR, CI, dirty, and ahead-behind state in dashboard

- Phase: implementation
- Repo: repoport
- Branch: agent/display-pr-ci-dirty-and-ahead-behind-state-in-dashboard
- Risk: high
- Depends on: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories
- Can run concurrently with: None
- Dispatchable now: No
- Blocked by: approve high-risk scope before dispatch

### repoport-add-unit-and-fixture-tests-for-core-parsing-and-generation-behavior: Add unit and fixture tests for core parsing and generation behavior

- Phase: verification
- Repo: repoport
- Branch: agent/add-unit-and-fixture-tests-for-core-parsing-and-generation-behavior
- Risk: low
- Depends on: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories, repoport-display-pr-ci-dirty-and-ahead-behind-state-in-dashboard
- Can run concurrently with: None
- Dispatchable now: No
- Blocked by: None

### repoport-write-readme-with-install-quickstart-and-safety-notes: Write README with install, quickstart, and safety notes

- Phase: documentation
- Repo: repoport
- Branch: agent/write-readme-with-install-quickstart-and-safety-notes
- Risk: low
- Depends on: repoport-implement-local-projects-folder-scanning, repoport-match-local-repos-to-github-remotes, repoport-flag-stale-or-broken-repositories, repoport-display-pr-ci-dirty-and-ahead-behind-state-in-dashboard, repoport-add-unit-and-fixture-tests-for-core-parsing-and-generation-behavior
- Can run concurrently with: None
- Dispatchable now: No
- Blocked by: None

