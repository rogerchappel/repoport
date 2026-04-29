# Task Brief: Implement local projects folder scanning

## Objective

Enable the app to scan the user's local projects folder to discover repositories

## Repository

repoport

## Suggested Branch

agent/implement-local-projects-folder-scanning

## Task Type

feature

## Risk Level

Medium

## Context

Source: llm (openai:gpt-4.1-mini)

V1 scope requires scanning local projects folder to identify repos for status tracking

## Allowed Paths

- src/scanner
- src/utils
- src/main

## Forbidden Paths

- src/network
- src/enterprise_analytics

## Expected Commits

- feat: add local projects folder scanning module
- test: add tests for folder scanning

## Verification

- Unit tests for folder scanning logic
- Fixture tests simulating various folder structures

## Stop Conditions

- Local projects folder scanning reliably detects repos
- No crashes or hangs during scanning

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement scanning of the local projects folder to detect repositories for repoport.

---

# Task Brief: Match local repos to GitHub remotes

## Objective

Match discovered local repositories to their corresponding GitHub remotes

## Repository

repoport

## Suggested Branch

agent/match-local-repos-to-github-remotes

## Task Type

feature

## Risk Level

Medium

## Context

Source: llm (openai:gpt-4.1-mini)

V1 scope requires matching local repos to GitHub remotes to fetch PR and CI status

## Allowed Paths

- src/scanner
- src/github_integration
- src/utils

## Forbidden Paths

- src/enterprise_analytics
- src/auto_merge

## Expected Commits

- feat: implement GitHub remote matching for local repos
- test: add tests for remote matching

## Verification

- Unit tests for remote matching logic
- Fixture tests with various remote URL formats

## Stop Conditions

- Local repos correctly matched to GitHub remotes
- No false positives or mismatches

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement logic to match local repositories to their GitHub remotes for repoport.

---

# Task Brief: Display PR, CI, dirty, and ahead-behind state in dashboard

## Objective

Show pull request status, continuous integration status, local dirty state, and ahead-behind commit counts in the dashboard

## Repository

repoport

## Suggested Branch

agent/display-pr-ci-dirty-and-ahead-behind-state-in-dashboard

## Task Type

feature

## Risk Level

High

## Context

Source: llm (openai:gpt-4.1-mini)

Core feature to provide repo health and status visibility in the macOS menu bar app

## Allowed Paths

- src/ui
- src/github_integration
- src/scanner

## Forbidden Paths

- src/enterprise_analytics
- src/auto_merge

## Expected Commits

- feat: add PR, CI, dirty, and ahead-behind state display
- test: add tests for status display components

## Verification

- Unit tests for status fetching and display logic
- Manual verification of UI updates with test repos

## Stop Conditions

- Dashboard correctly displays PR, CI, dirty, and ahead-behind states
- No incorrect or stale data shown

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement dashboard display of PR, CI, local dirty, and ahead-behind commit states.

---

# Task Brief: Flag stale or broken repositories

## Objective

Identify and flag repositories that are stale or broken in the dashboard

## Repository

repoport

## Suggested Branch

agent/flag-stale-or-broken-repositories

## Task Type

feature

## Risk Level

Medium

## Context

Source: llm (openai:gpt-4.1-mini)

V1 scope includes flagging stale or broken repos to alert maintainers

## Allowed Paths

- src/ui
- src/scanner
- src/utils

## Forbidden Paths

- src/enterprise_analytics
- src/auto_merge

## Expected Commits

- feat: add stale and broken repo detection and flagging
- test: add tests for stale/broken repo detection

## Verification

- Unit tests for stale/broken detection logic
- Manual testing with known stale/broken repos

## Stop Conditions

- Stale and broken repos are correctly flagged in the UI
- No false positives or missed flags

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement detection and flagging of stale or broken repositories in repoport.

---

# Task Brief: Document local-first behavior and usage in README

## Objective

Provide clear documentation on local-first behavior, installation, quickstart, and safety notes

## Repository

repoport

## Suggested Branch

agent/document-local-first-behavior-and-usage-in-readme

## Task Type

documentation

## Risk Level

Low

## Context

Source: llm (openai:gpt-4.1-mini)

Verification requires README to cover install, quickstart, local-first behavior, and no hidden network or credential usage

## Allowed Paths

- README.md
- docs/

## Forbidden Paths

- src/

## Expected Commits

- docs: add install and quickstart instructions
- docs: document local-first behavior and safety notes

## Verification

- README includes install instructions
- README explains local-first behavior
- README states no hidden network or credential usage

## Stop Conditions

- README updated with required documentation
- Documentation reviewed and approved

## Review Pack Required

No.

## Human Decision Needed

- None

## Agent Prompt

Write README documentation covering installation, quickstart, local-first behavior, and safety notes.
