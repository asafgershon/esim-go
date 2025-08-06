import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useESIMDetection } from './use-esim-detection';
import '@testing-library/jest-dom';

// Test component that uses the hook
function TestComponent({ config = {} }: { config?: Parameters<typeof useESIMDetection>[0] }) {
  const { isSupported, confidence, loading, error, methods } = useESIMDetection(config);

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (error) {
    return <div data-testid="error">{error.message}</div>;
  }

  return (
    <div>
      <div data-testid="supported">{isSupported ? 'true' : 'false'}</div>
      <div data-testid="confidence">{confidence.toFixed(2)}</div>
      <div data-testid="methods">{methods.length}</div>
      {methods.map((method, idx) => (
        <div key={idx} data-testid={`method-${method.name}`}>
          {method.name}: {method.result ? 'true' : 'false'} ({method.confidence})
        </div>
      ))}
    </div>
  );
}

describe('useESIMDetection Integration Tests', () => {
  beforeEach(() => {
    // Mock iPhone 14 environment
    Object.defineProperty(window, 'screen', {
      value: { width: 390, height: 844 },
      writable: true
    });
    
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3,
      writable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
      writable: true
    });

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    // Mock canvas WebGL context
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') {
        return {
          getExtension: vi.fn((name) => {
            if (name === 'WEBGL_debug_renderer_info') {
              return { UNMASKED_RENDERER_WEBGL: 37446 };
            }
            return null;
          }),
          getParameter: vi.fn((param) => {
            if (param === 37446) {
              return 'Apple GPU';
            }
            return null;
          })
        } as any;
      }
      return null;
    }) as any;
  });

  it('should render loading state initially', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should detect eSIM support after loading', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('supported')).toHaveTextContent('true');
    expect(parseFloat(screen.getByTestId('confidence').textContent!)).toBeGreaterThan(0.6);
  });

  it('should show all detection methods when enabled', async () => {
    render(
      <TestComponent 
        config={{
          enablePerformanceTest: true,
          enableCanvasFingerprint: true,
          enableWebGLDetection: true
        }}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('methods')).toHaveTextContent('5');
    expect(screen.getByTestId('method-screenPattern')).toBeInTheDocument();
    expect(screen.getByTestId('method-platformBehavior')).toBeInTheDocument();
    expect(screen.getByTestId('method-canvasFingerprint')).toBeInTheDocument();
    expect(screen.getByTestId('method-webglFingerprint')).toBeInTheDocument();
    expect(screen.getByTestId('method-performanceProfile')).toBeInTheDocument();
  });

  it('should respect confidence threshold', async () => {
    // Mock a low-confidence scenario
    Object.defineProperty(window, 'screen', {
      value: { width: 375, height: 667 }, // Older iPhone
      writable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    });

    render(<TestComponent config={{ confidenceThreshold: 0.8 }} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('supported')).toHaveTextContent('false');
  });

  it('should handle WebGL context failure gracefully', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

    render(
      <TestComponent 
        config={{
          enableWebGLDetection: true,
          enableCanvasFingerprint: true
        }}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Should still work without WebGL
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    const webglMethod = screen.queryByTestId('method-webglFingerprint');
    if (webglMethod) {
      expect(webglMethod).toHaveTextContent('false');
    }
  });

  it('should update when config changes', async () => {
    const { rerender } = render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const initialMethods = screen.getByTestId('methods').textContent;

    // Re-render with new config
    rerender(
      <TestComponent 
        config={{
          enablePerformanceTest: true,
          enableWebGLDetection: true
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('methods').textContent).not.toBe(initialMethods);
    });
  });

  it('should detect Android eSIM devices', async () => {
    // Mock Pixel 7 environment
    Object.defineProperty(window, 'screen', {
      value: { width: 393, height: 851 },
      writable: true
    });
    
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2.75,
      writable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      writable: true
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('supported')).toHaveTextContent('true');
    expect(screen.getByTestId('method-screenPattern')).toHaveTextContent('true');
  });
});