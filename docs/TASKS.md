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

V1 scope requires scanning local projects folder to identify repos for status display

## Allowed Paths

- src/scanner/
- src/utils/

## Forbidden Paths

- src/ui/
- src/network/

## Expected Commits

- feat: add local projects folder scanning module
- test: add tests for local folder scanning

## Verification

- Unit tests for folder scanning logic
- Fixture tests with sample local folder structures

## Stop Conditions

- Local projects folder scanning reliably detects repos
- Tests pass without errors

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement a module to scan the local projects folder and identify git repositories for further processing.

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

- src/scanner/
- src/github/

## Forbidden Paths

- src/ui/
- src/network/

## Expected Commits

- feat: implement GitHub remote matching for local repos
- test: add tests for remote matching

## Verification

- Unit tests for remote matching logic
- Fixture tests with mock GitHub remotes

## Stop Conditions

- Local repos correctly matched to GitHub remotes
- Tests pass without errors

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Develop functionality to match local git repositories to their GitHub remote URLs for status retrieval.

---

# Task Brief: Display PR, CI, dirty, and ahead-behind state in dashboard

## Objective

Show pull request, continuous integration, local dirty state, and ahead-behind commit status in the app dashboard

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

- src/ui/
- src/github/
- src/scanner/

## Forbidden Paths

- src/network/

## Expected Commits

- feat: add PR, CI, dirty, and ahead-behind state display
- test: add tests for status display components

## Verification

- Unit tests for status parsing and display logic
- Manual verification of UI status indicators

## Stop Conditions

- Dashboard correctly displays PR, CI, dirty, and ahead-behind states
- Tests and manual checks confirm accuracy

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Implement UI components and backend logic to display PR, CI, local dirty, and ahead-behind commit states in the dashboard.

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

- src/ui/
- src/scanner/
- src/github/

## Forbidden Paths

- src/network/

## Expected Commits

- feat: add stale and broken repo detection and flagging
- test: add tests for stale/broken repo logic

## Verification

- Unit tests for stale/broken detection logic
- Manual verification of flagged repos

## Stop Conditions

- Stale and broken repos are correctly flagged in the UI
- Tests and manual checks confirm detection accuracy

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Create detection logic and UI indicators to flag stale or broken repositories in the dashboard.

---

# Task Brief: Write README with install, quickstart, and safety notes

## Objective

Provide clear documentation for installation, quickstart usage, and safety considerations

## Repository

repoport

## Suggested Branch

agent/write-readme-with-install-quickstart-and-safety-notes

## Task Type

documentation

## Risk Level

Low

## Context

Source: llm (openai:gpt-4.1-mini)

Verification requires README to document local-first behavior and no hidden network or credential usage

## Allowed Paths

- README.md

## Forbidden Paths

- src/

## Expected Commits

- docs: add README with install, quickstart, and safety notes

## Verification

- README includes install instructions
- README includes quickstart guide
- README documents safety and local-first behavior

## Stop Conditions

- README is complete and reviewed
- Documentation covers all required topics

## Review Pack Required

No.

## Human Decision Needed

- None

## Agent Prompt

Write comprehensive README documentation covering installation, quickstart, and safety notes for repoport.

---

# Task Brief: Add unit and fixture tests for core parsing and generation behavior

## Objective

Ensure core parsing and generation logic is covered by unit and fixture tests

## Repository

repoport

## Suggested Branch

agent/add-unit-and-fixture-tests-for-core-parsing-and-generation-behavior

## Task Type

test

## Risk Level

Low

## Context

Source: llm (openai:gpt-4.1-mini)

Verification requires tests for core functionality to maintain quality and reliability

## Allowed Paths

- tests/
- src/scanner/
- src/github/

## Forbidden Paths

- src/ui/

## Expected Commits

- test: add unit and fixture tests for core parsing and generation

## Verification

- All core parsing and generation functions have tests
- Tests pass consistently

## Stop Conditions

- Test coverage meets project standards
- No test failures

## Review Pack Required

Yes.

## Human Decision Needed

- None

## Agent Prompt

Develop unit and fixture tests to cover core parsing and generation behavior in repoport.
