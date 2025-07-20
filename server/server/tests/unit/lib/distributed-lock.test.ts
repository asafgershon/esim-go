import { describe, it, expect } from 'bun:test';
import { createDistributedLock } from '../../../src/lib/distributed-lock';

describe('DistributedLock Interface', () => {
  it('should create a DistributedLock instance', () => {
    const lock = createDistributedLock('test-lock');
    expect(lock).toBeDefined();
    expect(typeof lock.acquire).toBe('function');
    expect(typeof lock.cleanup).toBe('function');
  });

  it('should have acquire method that returns a promise', () => {
    const lock = createDistributedLock('test-lock');
    const result = lock.acquire({ timeout: 1000, retryAttempts: 1 });
    expect(result).toBeInstanceOf(Promise);
  });

  it('should have cleanup method that returns a promise', () => {
    const lock = createDistributedLock('test-lock');
    const result = lock.cleanup();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should handle connection errors gracefully', async () => {
    // Test with invalid Redis config to simulate connection failure
    process.env.REDIS_HOST = 'invalid-host';
    process.env.REDIS_PORT = '99999';
    
    const lock = createDistributedLock('test-connection-error');
    
    try {
      const result = await lock.acquire({
        timeout: 1000,
        retryAttempts: 1
      });
      
      // Should fail gracefully rather than throw
      expect(result.acquired).toBe(false);
      expect(result.error).toBeDefined();
    } catch (error) {
      // If it throws, that's also acceptable for connection errors
      expect(error).toBeDefined();
    }
    
    // Reset env vars
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
  });
});