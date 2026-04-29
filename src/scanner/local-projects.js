import fs from 'node:fs/promises';
import path from 'node:path';
import { relativePosixPath } from '../utils/path.js';

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  '.cache',
  '.git',
  '.hg',
  '.svn',
  'coverage',
  'dist',
  'node_modules',
]);

/**
 * @typedef {object} LocalRepository
 * @property {string} path Absolute repository path.
 * @property {string} name Directory basename.
 * @property {string} relativePath POSIX-style path relative to the scan root.
 * @property {string} gitPath Path to the repository's .git directory or file.
 * @property {'directory'|'file'} gitPathType Whether .git is a directory or gitfile.
 */

/**
 * @typedef {object} ScanLocalProjectsOptions
 * @property {number} [maxDepth=Infinity] Maximum directory depth below root to inspect.
 * @property {Iterable<string>} [ignoreDirectories] Directory basenames to skip.
 * @property {boolean} [includeNestedRepositories=false] Descend into discovered repos to find nested repos.
 */

/**
 * Discover Git repositories under a local projects folder.
 *
 * A repository is any directory containing a `.git` directory or a `.git` file
 * (for worktrees and submodules). Results are deterministic and sorted by
 * relative path. Missing roots return an empty list; other filesystem errors are
 * surfaced so callers can show actionable failures.
 *
 * @param {string} projectsPath Local projects folder to scan.
 * @param {ScanLocalProjectsOptions} [options]
 * @returns {Promise<LocalRepository[]>}
 */
export async function scanLocalProjects(projectsPath, options = {}) {
  if (!projectsPath || typeof projectsPath !== 'string') {
    throw new TypeError('scanLocalProjects requires a projectsPath string');
  }

  const rootPath = path.resolve(projectsPath);
  const maxDepth = options.maxDepth ?? Infinity;

  if (typeof maxDepth !== 'number' || Number.isNaN(maxDepth) || maxDepth < 0) {
    throw new TypeError('maxDepth must be a non-negative number');
  }

  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORED_DIRECTORIES);
  const includeNestedRepositories = options.includeNestedRepositories ?? false;
  const repositories = [];

  let rootStats;
  try {
    rootStats = await fs.stat(rootPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  if (!rootStats.isDirectory()) {
    throw new TypeError(`projectsPath must be a directory: ${projectsPath}`);
  }

  await walkDirectory(rootPath, 0);

  return repositories.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  async function walkDirectory(directoryPath, depth) {
    const repository = await describeRepository(rootPath, directoryPath);
    if (repository) {
      repositories.push(repository);

      if (!includeNestedRepositories) {
        return;
      }
    }

    if (depth >= maxDepth) {
      return;
    }

    let entries;
    try {
      entries = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'EACCES' || error?.code === 'EPERM') {
        return;
      }
      throw error;
    }

    await Promise.all(entries
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
      .filter((entry) => !ignoreDirectories.has(entry.name))
      .map((entry) => walkDirectory(path.join(directoryPath, entry.name), depth + 1)));
  }
}

async function describeRepository(rootPath, directoryPath) {
  const gitPath = path.join(directoryPath, '.git');

  let gitStats;
  try {
    gitStats = await fs.lstat(gitPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  if (!gitStats.isDirectory() && !gitStats.isFile()) {
    return null;
  }

  return {
    path: directoryPath,
    name: path.basename(directoryPath),
    relativePath: relativePosixPath(rootPath, directoryPath),
    gitPath,
    gitPathType: gitStats.isDirectory() ? 'directory' : 'file',
  };
}
