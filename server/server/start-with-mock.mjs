import { getGlobalPrismServer } from '../packages/easycard-client/src/testing/prism-helpers.js';
import { spawn } from 'child_process';

async function startWithMock() {
  console.log('🚀 Starting EasyCard mock server...');
  
  try {
    // Start the Prism mock server
    const prismServer = await getGlobalPrismServer({
      port: 4012,
      specPath: '../packages/easycard-client/easycard-spec.yaml',
      verbose: true,
    });
    
    console.log('✅ EasyCard mock server started at:', prismServer.getBaseUrl());
    
    // Start the main server
    console.log('🚀 Starting main server...');
    const serverProcess = spawn('bun', ['run', 'dev'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        EASYCARD_ENVIRONMENT: 'mock',
        EASYCARD_MOCK_BASE_URL: 'http://localhost:4012'
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⏹️ Shutting down servers...');
      serverProcess.kill('SIGINT');
      await prismServer.stop();
      process.exit(0);
    });
    
    serverProcess.on('exit', async (code) => {
      console.log(`Main server exited with code ${code}`);
      await prismServer.stop();
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Failed to start mock server:', error.message);
    process.exit(1);
  }
}

startWithMock();