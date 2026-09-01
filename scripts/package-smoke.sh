#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"
EXPECTED_VERSION="$(node -p "require('./package.json').version")"
npm pack --pack-destination "$TMP_DIR" >/dev/null
PACKAGE_TGZ="$(find "$TMP_DIR" -maxdepth 1 -name 'repoport-*.tgz' -print -quit)"
test -n "$PACKAGE_TGZ"

mkdir -p "$TMP_DIR/app"
cd "$TMP_DIR/app"
npm init -y >/dev/null
npm install "$PACKAGE_TGZ" >/dev/null

node --input-type=module <<'EOF'
import { checkRepoHealth } from 'repoport';

const health = checkRepoHealth({
  lastCommitDate: new Date(),
  hasGit: true,
  remoteUrl: 'git@github.com:octo/alpha.git',
  isValidGitRepo: true
});

if (typeof checkRepoHealth !== 'function' || health.broken || health.stale) {
  throw new Error('The documented package-root health check is not usable');
}
EOF

if tar -tzf "$PACKAGE_TGZ" | grep -Eq '(^|/)src/.*\.test\.js$'; then
  echo 'Packed artifact contains internal test files' >&2
  exit 1
fi

npx repoport --help >/dev/null
test "$(npx repoport --version)" = "repoport v${EXPECTED_VERSION}"
mkdir -p "$TMP_DIR/repos/alpha"
git -C "$TMP_DIR/repos/alpha" init >/dev/null
git -C "$TMP_DIR/repos/alpha" config user.name "Repoport Smoke"
git -C "$TMP_DIR/repos/alpha" config user.email "repoport-smoke@example.com"
printf '# alpha\n' > "$TMP_DIR/repos/alpha/README.md"
git -C "$TMP_DIR/repos/alpha" add README.md
git -C "$TMP_DIR/repos/alpha" commit -m init >/dev/null
git -C "$TMP_DIR/repos/alpha" remote add origin https://github.com/octo/alpha.git

npx repoport --root "$TMP_DIR/repos" --json > "$TMP_DIR/report.json"
grep -q '"fullName": "octo/alpha"' "$TMP_DIR/report.json"
