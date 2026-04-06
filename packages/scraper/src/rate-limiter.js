/**
 * Token bucket rate limiter with jitter.
 */
export class RateLimiter {
  constructor({ maxTokens = 2, refillRate = 2, minDelay = 500 } = {}) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate; // tokens per second
    this.minDelay = minDelay;
    this.lastRefill = Date.now();
    this.lastRequest = 0;
  }

  async acquire() {
    this._refill();
    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / this.refillRate) * 1000;
      await sleep(waitMs + jitter(100));
      this._refill();
    }
    const sinceLast = Date.now() - this.lastRequest;
    if (sinceLast < this.minDelay) {
      await sleep(this.minDelay - sinceLast + jitter(50));
    }
    this.tokens -= 1;
    this.lastRequest = Date.now();
  }

  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function jitter(maxMs) {
  return Math.random() * maxMs;
}

/**
 * Retry with exponential backoff.
 */
export async function withRetry(fn, { maxRetries = 5, baseDelay = 1000, label = 'operation' } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`${label} failed after ${maxRetries + 1} attempts: ${err.message}`);
      }
      const delay = baseDelay * Math.pow(2, attempt) * (1 + Math.random() * 0.25);
      console.warn(`  [retry] ${label} attempt ${attempt + 1} failed: ${err.message}. Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
}
