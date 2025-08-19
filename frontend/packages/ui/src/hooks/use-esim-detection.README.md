# useESIMDetection Hook

A React hook for detecting eSIM compatibility in web browsers. This hook uses multiple detection methods to determine if a device supports eSIM functionality with varying degrees of confidence.

## Installation

The hook is part of the `@workspace/ui` package. Import it from the UI library:

```typescript
import { useESIMDetection } from '@workspace/ui';
```

## Basic Usage

```typescript
function MyComponent() {
  const { isSupported, confidence, loading, error, methods } = useESIMDetection();

  if (loading) return <div>Checking eSIM compatibility...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      eSIM Supported: {isSupported ? 'Yes' : 'No'} 
      (Confidence: {(confidence * 100).toFixed(0)}%)
    </div>
  );
}
```

## API

### `useESIMDetection(config?: DetectionConfig): ESIMDetectionResult`

#### Parameters

- `config` (optional): Configuration object with the following properties:
  - `enablePerformanceTest?: boolean` - Enable CPU performance testing (default: `false`)
  - `enableCanvasFingerprint?: boolean` - Enable canvas fingerprinting (default: `false`)
  - `enableWebGLDetection?: boolean` - Enable WebGL GPU detection (default: `false`)
  - `confidenceThreshold?: number` - Minimum confidence level for positive detection (default: `0.6`)
  - `cacheDuration?: number` - Cache duration in milliseconds (default: no caching)

#### Return Value

- `isSupported: boolean` - Whether the device supports eSIM
- `confidence: number` - Confidence level of the detection (0-1)
- `methods: DetectionMethod[]` - Array of detection methods used and their results
- `loading: boolean` - Whether detection is in progress
- `error: Error | null` - Any error that occurred during detection

## Detection Methods

The hook uses multiple detection methods to determine eSIM support:

1. **Screen Pattern Detection**: Matches device screen dimensions against known eSIM devices
2. **Platform Behavior**: Checks iOS version for web eSIM installation support
3. **Canvas Fingerprinting**: Analyzes GPU information for high-end device detection
4. **WebGL Detection**: Uses WebGL to identify device GPU patterns
5. **Performance Testing**: Measures JavaScript execution speed to identify high-end devices

## Examples

### Advanced Configuration

```typescript
const detection = useESIMDetection({
  enablePerformanceTest: true,
  enableCanvasFingerprint: true,
  enableWebGLDetection: true,
  confidenceThreshold: 0.7
});
```

### Conditional Rendering

```typescript
function CheckoutFlow() {
  const { isSupported, confidence } = useESIMDetection();

  if (isSupported && confidence > 0.8) {
    return <DirectESIMActivation />;
  } else if (isSupported && confidence > 0.6) {
    return <ESIMWithFallback />;
  } else {
    return <TraditionalSIMOptions />;
  }
}
```

### With User Override

```typescript
function ESIMToggle() {
  const detection = useESIMDetection();
  const [userOverride, setUserOverride] = useState(null);
  
  const hasESIM = userOverride ?? detection.isSupported;

  return (
    <label>
      <input
        type="checkbox"
        checked={hasESIM}
        onChange={(e) => setUserOverride(e.target.checked)}
      />
      My device supports eSIM
    </label>
  );
}
```

## Accuracy and Limitations

- **False Positives**: 15-30% when device supports eSIM but it's carrier-disabled
- **False Negatives**: 10-25% due to unknown devices or user agent spoofing
- **Regional Variations**: Same device model may have different eSIM support by region
- **No Guaranteed Accuracy**: Always provide user override options

## Best Practices

1. **Use confidence scores**: Provide different UI experiences based on confidence levels
2. **Implement progressive enhancement**: Design for eSIM-first with graceful degradation
3. **Combine multiple signals**: No single method is reliable enough
4. **Cache aggressively**: Reduce performance impact of detection
5. **Provide user overrides**: Let users manually indicate eSIM capability
6. **Handle uncertainty transparently**: Acknowledge detection limitations to users

## Performance Considerations

- Initial detection typically takes 50-200ms
- Canvas/WebGL operations may be expensive on low-end devices
- Consider disabling expensive tests on known low-end devices
- Results can be cached to avoid repeated detection

## Testing

The hook includes comprehensive unit tests using Vitest and React Testing Library. Run tests with:

```bash
npm test use-esim-detection.test.ts
```

## Browser Support

- Chrome/Edge: Full support including Network Information API
- Safari/iOS: Limited to user agent and screen detection
- Firefox: WebGL and performance-based detection only
- Android WebView: Varies by implementation

## Future Improvements

- Enhanced Client Hints support when available
- Permission-based APIs for telephony information
- Industry collaboration on detection standards
- Machine learning-based device classification