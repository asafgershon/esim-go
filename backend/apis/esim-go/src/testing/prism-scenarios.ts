import type { AxiosRequestConfig } from 'axios';

export type PrismScenario = 'success' | 'rate-limit' | 'auth-error' | 'server-error' | 'not-found';

export class PrismScenarios {
  static getHeaders(scenario: PrismScenario): Record<string, string> {
    switch (scenario) {
      case 'success':
        return {
          'Prefer': 'code=200',
        };
      case 'rate-limit':
        return {
          'Prefer': 'code=429',
        };
      case 'auth-error':
        return {
          'Prefer': 'code=401',
        };
      case 'server-error':
        return {
          'Prefer': 'code=500',
        };
      case 'not-found':
        return {
          'Prefer': 'code=404',
        };
      default:
        return {};
    }
  }

  static applyScenario(config: AxiosRequestConfig, scenario: PrismScenario): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        ...config.headers,
        ...this.getHeaders(scenario),
      },
    };
  }

  static getDynamicHeaders(): Record<string, string> {
    return {
      'Prefer': 'dynamic=true',
    };
  }

  static getExampleHeaders(exampleName: string): Record<string, string> {
    return {
      'Prefer': `example=${exampleName}`,
    };
  }

  static getValidationHeaders(enabled = true): Record<string, string> {
    return {
      'X-Prism-Validation': enabled ? 'true' : 'false',
    };
  }
}