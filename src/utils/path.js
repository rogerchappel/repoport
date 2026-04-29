import path from 'node:path';

/**
 * Return a stable, POSIX-style relative path for scanner results.
 *
 * Node's path.relative uses platform separators. The scanner API returns POSIX
 * separators so snapshots and downstream matching behave consistently across
 * macOS, Linux, and Windows.
 *
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
export function relativePosixPath(from, to) {
  const relativePath = path.relative(from, to);
  return relativePath.split(path.sep).join(path.posix.sep) || '.';
}
