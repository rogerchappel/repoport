import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateReleaseReadiness } from '../scripts/validate-release-readiness.mjs';

function fixture({ lockfile = true, install = 'npm ci' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'repoport-readiness-'));
  fs.mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    repository: 'owner/repo',
    files: ['src'],
    scripts: { 'package:smoke': 'true', 'release:check': 'true' },
  }));
  if (lockfile) fs.writeFileSync(path.join(root, 'package-lock.json'), '{}');
  fs.writeFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), `${install}\nnpm run release:check\n`);
  return root;
}

test('release readiness accepts a lockfile and npm ci workflow', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(validateReleaseReadiness(root), []);
});

test('release readiness rejects a missing lockfile', (t) => {
  const root = fixture({ lockfile: false });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.ok(validateReleaseReadiness(root).some((failure) => failure.includes('package-lock.json')));
});

test('release readiness rejects npm install fallback', (t) => {
  const root = fixture({ install: 'npm install' });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const failures = validateReleaseReadiness(root);
  assert.ok(failures.some((failure) => failure.includes('npm ci')));
  assert.ok(failures.some((failure) => failure.includes('npm install')));
});
