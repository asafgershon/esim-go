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
    this.port = options.port || 4010;
    this.specPath = options.specPath || './openapi-spec.yaml';
    this.dynamic = options.dynamic !== false;
    this.verbose = options.verbose || false;
  }

  async start(): Promise<void> {
    if (this.process) {
      console.warn('Prism server is already running');
      return;
    }

    const args = [
      'mock',
      this.specPath,
      '-p',
      this.port.toString(),
    ];

    if (this.dynamic) {
      args.push('--dynamic');
    }

    if (this.verbose) {
      args.push('--verbose');
    }

    this.process = spawn('prism', args, {
      stdio: this.verbose ? 'inherit' : 'pipe',
    });

    this.process.on('error', (error) => {
      console.error('Failed to start Prism server:', error);
      throw error;
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Prism server exited with code ${code}`);
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
    const healthUrl = `http://localhost:${this.port}/health`;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await axios.get(healthUrl, { timeout: 1000 });
        console.log(`Prism server is ready on port ${this.port}`);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Prism server failed to start after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}/v2.4`;
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