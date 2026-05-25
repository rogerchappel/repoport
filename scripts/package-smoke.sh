#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"
npm pack --pack-destination "$TMP_DIR" >/dev/null
PACKAGE_TGZ="$(find "$TMP_DIR" -maxdepth 1 -name 'repoport-*.tgz' -print -quit)"
test -n "$PACKAGE_TGZ"

mkdir -p "$TMP_DIR/app"
cd "$TMP_DIR/app"
npm init -y >/dev/null
npm install "$PACKAGE_TGZ" >/dev/null

npx repoport --help >/dev/null
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
