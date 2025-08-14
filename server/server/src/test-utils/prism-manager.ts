import { spawn, type ChildProcess } from 'child_process';
import axios from 'axios';
import path from 'path';

export interface PrismManagerOptions {
  port?: number;
  specPath?: string;
  dynamic?: boolean;
  verbose?: boolean;
}

export class PrismManager {
  private static instance: PrismManager | null = null;
  private process: ChildProcess | null = null;
  private port: number;
  private specPath: string;
  private isRunning = false;

  constructor(options: PrismManagerOptions = {}) {
    this.port = options.port || 4011; // Use 4011 to avoid conflicts
    // Use the spec from esim-go-client package - using absolute path
    this.specPath = options.specPath || path.resolve(
      process.cwd(),
      '../packages/esim-go-client/openapi-spec.yaml'
    );
  }

  static async getInstance(options?: PrismManagerOptions): Promise<PrismManager> {
    if (!PrismManager.instance) {
      PrismManager.instance = new PrismManager(options);
      await PrismManager.instance.start();
    }
    return PrismManager.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Prism server is already running');
      return;
    }

    // Check if spec file exists
    const fs = require('fs');
    if (!fs.existsSync(this.specPath)) {
      throw new Error(`OpenAPI spec not found at: ${this.specPath}`);
    }

    const args = [
      'mock',
      this.specPath,
      '-p',
      this.port.toString(),
      '-h',
      '127.0.0.1',
      '--dynamic',
    ];

    console.log(`Starting Prism server on port ${this.port}...`);
    console.log(`Using OpenAPI spec: ${this.specPath}`);
    
    this.process = spawn('npx', ['@stoplight/prism-cli', ...args], {
      stdio: process.env.PRISM_VERBOSE === 'true' ? 'inherit' : ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: process.cwd(),
    });

    // Capture stderr for debugging
    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.includes('listen EADDRINUSE')) {
          console.error(`Port ${this.port} is already in use`);
        } else if (process.env.PRISM_VERBOSE === 'true') {
          console.error('Prism stderr:', message);
        }
      });
    }

    this.process.on('error', (error) => {
      console.error('Failed to start Prism server:', error);
      this.isRunning = false;
      throw error;
    });

    this.process.on('exit', (code) => {
      this.isRunning = false;
      if (code !== 0 && code !== null) {
        console.error(`Prism server exited with code ${code}`);
      }
    });

    await this.waitForServer();
    this.isRunning = true;
    console.log(`Prism server started successfully on port ${this.port}`);
  }

  async stop(): Promise<void> {
    if (!this.process || !this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      this.process.on('exit', () => {
        this.isRunning = false;
        this.process = null;
        resolve();
      });

      this.process.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  private async waitForServer(maxAttempts = 30): Promise<void> {
    // Prism doesn't have a /health endpoint, so we'll check a known API path
    const testUrl = `http://127.0.0.1:${this.port}/catalogue`;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Try to make a request to the mock server
        await axios.get(testUrl, { 
          timeout: 1000,
          headers: {
            'X-API-KEY': 'test-key'
          }
        });
        return;
      } catch (error: any) {
        // Even a 401 or any other response means the server is running
        if (error.response) {
          return;
        }
        
        if (attempt === maxAttempts) {
          console.error(`Last error: ${error.message}`);
          throw new Error(`Prism server failed to start after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  getPort(): number {
    return this.port;
  }

  static async cleanup(): Promise<void> {
    if (PrismManager.instance) {
      await PrismManager.instance.stop();
      PrismManager.instance = null;
    }
  }
}