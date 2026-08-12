import { describe, it, expect, vi } from 'vitest';
import { createSessionRefresher, isAuthEndpoint } from './sessionRefresh';

/** A promise you can settle from the outside, for controlling timing. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createSessionRefresher', () => {
  it('resolves with the value from the wrapped function', async () => {
    const refresh = createSessionRefresher(async () => 'new-token');
    await expect(refresh()).resolves.toBe('new-token');
  });

  it('calls the wrapped function once for concurrent callers', async () => {
    const gate = deferred();
    const refreshFn = vi.fn(() => gate.promise);
    const refresh = createSessionRefresher(refreshFn);

    // Five requests 401 at the same time, as a dashboard would produce.
    const results = Promise.all([refresh(), refresh(), refresh(), refresh(), refresh()]);
    gate.resolve('shared-token');

    expect(await results).toEqual(Array(5).fill('shared-token'));
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('hands every concurrent caller the same promise', () => {
    const refresh = createSessionRefresher(() => deferred().promise);
    expect(refresh()).toBe(refresh());
  });

  it('starts a fresh request once the previous one has settled', async () => {
    const refreshFn = vi
      .fn()
      .mockResolvedValueOnce('token-1')
      .mockResolvedValueOnce('token-2');
    const refresh = createSessionRefresher(refreshFn);

    await expect(refresh()).resolves.toBe('token-1');
    await expect(refresh()).resolves.toBe('token-2');
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('propagates a rejection to every concurrent caller', async () => {
    const gate = deferred();
    const refresh = createSessionRefresher(() => gate.promise);

    const first = refresh();
    const second = refresh();
    gate.reject(new Error('refresh token rejected'));

    await expect(first).rejects.toThrow('refresh token rejected');
    await expect(second).rejects.toThrow('refresh token rejected');
  });

  it('does not latch onto a failure — a later call retries', async () => {
    const refreshFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('recovered-token');
    const refresh = createSessionRefresher(refreshFn);

    await expect(refresh()).rejects.toThrow('transient');
    await expect(refresh()).resolves.toBe('recovered-token');
  });

  it('handles a wrapped function that throws synchronously', async () => {
    const refresh = createSessionRefresher(() => {
      throw new Error('boom');
    });

    await expect(refresh()).rejects.toThrow('boom');
    // State must still be cleared, so the next call is not stuck.
    await expect(refresh()).rejects.toThrow('boom');
  });
});

describe('isAuthEndpoint', () => {
  it.each([
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/google',
    '/auth/github',
    'http://localhost:5000/api/auth/login',
  ])('treats %s as an auth endpoint', (url) => {
    expect(isAuthEndpoint(url)).toBe(true);
  });

  it.each(['/auth/me', '/dashboard', '/api/documents', '/users/123'])(
    'treats %s as an ordinary endpoint',
    (url) => {
      expect(isAuthEndpoint(url)).toBe(false);
    }
  );

  it('returns false for a missing url rather than throwing', () => {
    expect(isAuthEndpoint(undefined)).toBe(false);
    expect(isAuthEndpoint('')).toBe(false);
  });
});
