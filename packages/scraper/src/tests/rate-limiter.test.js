/**
 * Tests for rate limiter, retry, and utility functions.
 * These tests verify behavior without external dependencies.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter, sleep, jitter, withRetry } from '../rate-limiter.js';

describe('RateLimiter', () => {
  it('should create with default options', () => {
    const limiter = new RateLimiter();
    assert.equal(limiter.maxTokens, 2);
    assert.equal(limiter.refillRate, 2);
    assert.equal(limiter.minDelay, 500);
  });

  it('should create with custom options', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 10, minDelay: 100 });
    assert.equal(limiter.maxTokens, 5);
    assert.equal(limiter.refillRate, 10);
    assert.equal(limiter.minDelay, 100);
  });

  it('should acquire tokens without delay when available', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 100, minDelay: 0 });
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `Should be fast, took ${elapsed}ms`);
  });

  it('should enforce minimum delay between requests', async () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 100, minDelay: 50 });
    await limiter.acquire();
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 40, `Should enforce minDelay, took ${elapsed}ms`);
  });

  it('should refill tokens over time', async () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillRate: 100, minDelay: 0 });
    // Drain all tokens
    await limiter.acquire();
    await limiter.acquire();
    // Wait for refill
    await sleep(50);
    // Should be able to acquire again
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `After refill should be fast, took ${elapsed}ms`);
  });
});

describe('sleep', () => {
  it('should sleep for approximately the specified duration', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45, `Should sleep at least 45ms, slept ${elapsed}ms`);
    assert.ok(elapsed < 200, `Should not oversleep, slept ${elapsed}ms`);
  });
});

describe('jitter', () => {
  it('should return a value between 0 and maxMs', () => {
    for (let i = 0; i < 100; i++) {
      const val = jitter(100);
      assert.ok(val >= 0, `Jitter should be >= 0: ${val}`);
      assert.ok(val < 100, `Jitter should be < 100: ${val}`);
    }
  });

  it('should return 0 for maxMs=0', () => {
    for (let i = 0; i < 10; i++) {
      assert.equal(jitter(0), 0);
    }
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return 'ok';
    }, { maxRetries: 3, baseDelay: 10 });
    assert.equal(result, 'ok');
    assert.equal(calls, 1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 3) throw new Error('not yet');
      return 'ok';
    }, { maxRetries: 5, baseDelay: 10 });
    assert.equal(result, 'ok');
    assert.equal(calls, 3);
  });

  it('should throw after max retries exceeded', async () => {
    let calls = 0;
    await assert.rejects(
      () => withRetry(async () => {
        calls++;
        throw new Error('always fails');
      }, { maxRetries: 2, baseDelay: 10, label: 'test-op' }),
      (err) => {
        assert.ok(err.message.includes('test-op'));
        assert.ok(err.message.includes('3 attempts'));
        return true;
      }
    );
    assert.equal(calls, 3); // initial + 2 retries
  });

  it('should apply exponential backoff', async () => {
    let calls = 0;
    const timestamps = [];
    await assert.rejects(
      () => withRetry(async () => {
        calls++;
        timestamps.push(Date.now());
        throw new Error('fail');
      }, { maxRetries: 2, baseDelay: 20 }),
    );
    assert.equal(timestamps.length, 3);
    // Second delay should be longer than first
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];
    assert.ok(delay2 > delay1, `Delay2 (${delay2}ms) should be > delay1 (${delay1}ms)`);
  });
});
