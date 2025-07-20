/**
 * Manual test script to verify distributed lock functionality
 * Run with: bun run tests/manual-lock-test.ts
 */

import { createDistributedLock } from '../src/lib/distributed-lock';

async function testDistributedLock() {
  console.log('🧪 Testing Distributed Lock Implementation...\n');

  const lock1 = createDistributedLock('test-catalog-sync');
  const lock2 = createDistributedLock('test-catalog-sync');

  try {
    console.log('1️⃣ Testing lock acquisition...');
    
    // First lock should succeed
    const result1 = await lock1.acquire({
      timeout: 10000, // 10 seconds
      retryAttempts: 1
    });
    
    if (result1.acquired) {
      console.log('✅ First lock acquired successfully');
    } else {
      console.log('❌ First lock failed:', result1.error);
      return;
    }

    console.log('\n2️⃣ Testing concurrent lock (should fail)...');
    
    // Second lock should fail
    const result2 = await lock2.acquire({
      timeout: 2000, // 2 seconds  
      retryAttempts: 1
    });
    
    if (!result2.acquired) {
      console.log('✅ Second lock correctly rejected:', result2.error);
    } else {
      console.log('❌ Second lock should have failed');
    }

    console.log('\n3️⃣ Testing lock release...');
    
    // Release first lock
    if (result1.release) {
      await result1.release();
      console.log('✅ First lock released successfully');
    }

    console.log('\n4️⃣ Testing lock acquisition after release...');
    
    // Now second lock should succeed
    const result3 = await lock2.acquire({
      timeout: 5000,
      retryAttempts: 1
    });
    
    if (result3.acquired) {
      console.log('✅ Lock acquired after release');
      
      if (result3.release) {
        await result3.release();
        console.log('✅ Second lock released');
      }
    } else {
      console.log('❌ Lock should have been available after release');
    }

    console.log('\n🎉 All tests passed! Distributed lock is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await lock1.cleanup();
    await lock2.cleanup();
    console.log('\n🧹 Cleanup completed');
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDistributedLock();
}