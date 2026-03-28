/**
 * Wraps an async Express handler so thrown/rejected errors flow into next().
 * Keeps controllers consistent under Express 4.
 */
export default function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
