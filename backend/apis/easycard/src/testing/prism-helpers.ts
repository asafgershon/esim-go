import { spawn, type ChildProcess } from 'child_process';
import axios from 'axios';

export interface PrismServerOptions {
  port?: number;
  specPath?: string;
  dynamic?: boolean;
  verbose?: boolean;
}

export class PrismServer {
  private process: ChildProcess | null = null;
  private port: number;
  private specPath: string;
  private dynamic: boolean;
  private verbose: boolean;

  constructor(options: PrismServerOptions = {}) {
    this.port = options.port || 4012;
    this.specPath = options.specPath || './easycard-spec.yaml';
    this.dynamic = options.dynamic !== false;
    this.verbose = options.verbose || false;
  }

  async start(): Promise<void> {
    if (this.process) {
      console.warn('EasyCard Prism server is already running');
      return;
    }

    // Check if spec file exists
    const fs = require('fs');
    if (!fs.existsSync(this.specPath)) {
      throw new Error(`EasyCard OpenAPI spec not found at: ${this.specPath}`);
    }

    const args = [
      'mock',
      this.specPath,
      '-p',
      this.port.toString(),
      '-h',
      '127.0.0.1',
    ];

    if (this.dynamic) {
      args.push('--dynamic');
    }

    if (this.verbose) {
      args.push('--verbose');
    }

    console.log(`Starting EasyCard Prism server on port ${this.port}...`);
    console.log(`Using OpenAPI spec: ${this.specPath}`);
    
    this.process = spawn('npx', ['@stoplight/prism-cli', ...args], {
      stdio: this.verbose ? 'inherit' : ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: process.cwd(),
    });

    // Capture stderr for debugging
    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.includes('listen EADDRINUSE')) {
          console.error(`Port ${this.port} is already in use`);
        } else if (this.verbose) {
          console.error('EasyCard Prism stderr:', message);
        }
      });
    }

    this.process.on('error', (error) => {
      console.error('Failed to start EasyCard Prism server:', error);
      throw error;
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`EasyCard Prism server exited with code ${code}`);
      }
      this.process = null;
    });

    await this.waitForServer();
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      this.process.on('exit', () => {
        this.process = null;
        resolve();
      });

      this.process.kill('SIGTERM');

      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  private async waitForServer(maxAttempts = 30): Promise<void> {
    // Test with a known endpoint
    const testUrl = `http://127.0.0.1:${this.port}/connect/token`;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await axios.post(testUrl, 'grant_type=client_credentials', {
          timeout: 1000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        return;
      } catch (error: any) {
        // Any response (even 400/401) means the server is running
        if (error.response) {
          return;
        }
        
        if (attempt === maxAttempts) {
          console.error(`Last error: ${error.message}`);
          throw new Error(`EasyCard Prism server failed to start after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  isRunning(): boolean {
    return this.process !== null;
  }
}

let globalPrismServer: PrismServer | null = null;

export async function getGlobalPrismServer(options?: PrismServerOptions): Promise<PrismServer> {
  if (!globalPrismServer) {
    globalPrismServer = new PrismServer(options);
    await globalPrismServer.start();
  }
  return globalPrismServer;
}

export async function stopGlobalPrismServer(): Promise<void> {
  if (globalPrismServer) {
    await globalPrismServer.stop();
    globalPrismServer = null;
  }
}