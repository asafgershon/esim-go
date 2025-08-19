import React from 'react';
import { useESIMDetection } from './use-esim-detection';

/**
 * Example component demonstrating how to use the useESIMDetection hook
 */
export function ESIMDetectionExample() {
  // Basic usage
  const { isSupported, confidence, loading, error, methods } = useESIMDetection();

  // Advanced usage with configuration
  const advancedDetection = useESIMDetection({
    enablePerformanceTest: true,
    enableCanvasFingerprint: true,
    enableWebGLDetection: true,
    confidenceThreshold: 0.7, // Require 70% confidence
    cacheDuration: 3600000 // Cache for 1 hour
  });

  if (loading) {
    return <div>Checking eSIM compatibility...</div>;
  }

  if (error) {
    return <div>Error detecting eSIM support: {error.message}</div>;
  }

  return (
    <div>
      <h3>eSIM Device Detection Results</h3>
      
      <div>
        <strong>eSIM Support:</strong> {isSupported ? '✅ Supported' : '❌ Not Supported'}
      </div>
      
      <div>
        <strong>Confidence Level:</strong> {(confidence * 100).toFixed(1)}%
      </div>

      <h4>Detection Methods Used:</h4>
      <ul>
        {methods.map((method, index) => (
          <li key={index}>
            <strong>{method.name}:</strong> {method.result ? 'Positive' : 'Negative'} 
            (Confidence: {(method.confidence * 100).toFixed(1)}%)
          </li>
        ))}
      </ul>

      {isSupported && confidence > 0.8 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9' }}>
          <strong>✨ Great news!</strong> Your device has high confidence eSIM support. 
          You can activate eSIMs directly from your browser!
        </div>
      )}

      {isSupported && confidence <= 0.8 && confidence > 0.6 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3e0' }}>
          <strong>⚠️ Possible eSIM support:</strong> Your device might support eSIM, 
          but we're not entirely certain. You can try our eSIM activation, 
          or use the QR code method as a fallback.
        </div>
      )}

      {!isSupported && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffebee' }}>
          <strong>ℹ️ Traditional SIM required:</strong> Your device doesn't appear to support eSIM. 
          You'll need to use a physical SIM card or upgrade to an eSIM-compatible device.
        </div>
      )}
    </div>
  );
}

/**
 * Example of conditional rendering based on eSIM support
 */
export function ConditionalESIMContent() {
  const { isSupported, confidence, loading } = useESIMDetection({
    confidenceThreshold: 0.7
  });

  if (loading) return null;

  return (
    <div>
      {isSupported && confidence > 0.8 ? (
        <button>Activate eSIM Instantly</button>
      ) : isSupported && confidence > 0.6 ? (
        <>
          <button>Try eSIM Activation</button>
          <button>Download QR Code</button>
        </>
      ) : (
        <button>View Physical SIM Options</button>
      )}
    </div>
  );
}

/**
 * Example of using the hook with user override
 */
export function ESIMDetectionWithOverride() {
  const detection = useESIMDetection();
  const [userOverride, setUserOverride] = React.useState<boolean | null>(null);

  // Use user override if provided, otherwise use detection result
  const hasESIMSupport = userOverride !== null ? userOverride : detection.isSupported;

  return (
    <div>
      <div>
        Detected eSIM Support: {detection.isSupported ? 'Yes' : 'No'} 
        ({(detection.confidence * 100).toFixed(0)}% confidence)
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={hasESIMSupport}
            onChange={(e) => setUserOverride(e.target.checked)}
          />
          My device supports eSIM (override detection)
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>Final eSIM Status:</strong> {hasESIMSupport ? 'Enabled' : 'Disabled'}
        {userOverride !== null && ' (user override)'}
      </div>
    </div>
  );
}