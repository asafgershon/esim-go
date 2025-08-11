# Pricing Simulator Test Instructions

## Overview
This document provides comprehensive testing instructions for the Pricing Simulator implementation in the eSIM Go dashboard, including automated Puppeteer tests and manual verification steps.

## Prerequisites

1. **Dashboard Running**: Ensure the dashboard is running locally
   ```bash
   cd /Users/yarinsa/Code/esim-go/client/apps/dashboard
   bun run dev
   ```
   The dashboard should be accessible at `http://localhost:5173`

2. **Backend Services**: Ensure the GraphQL backend is running with pricing simulation endpoints

## Automated Testing

### Option 1: Quick Setup with Installation Script
```bash
# Make the script executable (if not already)
chmod +x run-test.sh

# Run the test (this will install Puppeteer if needed)
./run-test.sh
```

### Option 2: Manual Setup
```bash
# Install Puppeteer
bun add puppeteer --dev

# Run the test
node pricing-simulator-test.js
```

## What the Automated Test Checks

### ✅ Core Functionality Tests

1. **Page Navigation**: Navigates to `/pricing/simulator`
2. **UI Elements Verification**:
   - Country selector dropdown
   - Days input field 
   - Payment method selector
   - Run Simulation button

3. **Interaction Testing**:
   - Selects a country (US or IL)
   - Sets days to 7
   - Selects a payment method
   - Clicks "Run Simulation"

4. **Results Verification**:
   - Checks for simulation results display
   - Verifies tabs interface (Summary, Breakdown, Steps)
   - Tests Steps tab functionality
   - Verifies steps panel scrollability

5. **Real-time Features**:
   - Checks for WebSocket connection indicators
   - Verifies streaming/real-time updates
   - Monitors step-by-step calculation updates

6. **Error Monitoring**:
   - Captures console errors/warnings
   - Tracks network request failures
   - Reports JavaScript errors

### 📸 Screenshots Generated

The test creates a `test-screenshots` directory with:
- `01-initial-page.png` - Initial page state
- `02-before-simulation.png` - Form filled, ready to simulate
- `03-after-simulation.png` - Results displayed
- `error-screenshot.png` - If errors occur
- `test-report.json` - Detailed test results

## Manual Testing Checklist

### 🎯 Core Features to Verify

#### Top Bar Controls
- [ ] **Country Selector**: 
  - Dropdown opens and shows countries with flags
  - Can select US, IL, or other countries
  - Selection persists in the UI

- [ ] **Days Input**:
  - Accepts numeric input (1-365)
  - Validates input range
  - Updates pricing calculations

- [ ] **Payment Method Selector**:
  - Shows available payment methods with fees
  - Israeli Card (1.4%), Foreign Card (3.9%), Bit (0.7%), etc.
  - Selection affects final pricing

- [ ] **Run Simulation Button**:
  - Enabled when form is valid
  - Shows loading state during calculation
  - Triggers pricing simulation

#### Results Display
- [ ] **Tabs Interface**:
  - Summary tab shows key metrics
  - Breakdown tab shows detailed calculations  
  - Steps tab shows calculation progression

- [ ] **Summary Tab Content**:
  - Bundle information (name, duration, data)
  - Customer price with daily breakdown
  - Net profit calculation
  - Profit margin percentage
  - Processing fee inclusion

- [ ] **Breakdown Tab Content**:
  - Base cost → markup → discounts → processing → final price
  - Revenue breakdown after processing fees
  - Applied rules with impact amounts

- [ ] **Steps Tab Content**:
  - Step-by-step pricing calculation
  - Customer-friendly discount explanations
  - Scrollable when many steps
  - Real-time updates during calculation
  - Timing and performance metrics

#### Real-time Features  
- [ ] **WebSocket Connection**:
  - Connection status indicator
  - Real-time step updates during calculation
  - Smooth streaming of pricing steps

- [ ] **Visual Feedback**:
  - Loading spinners during calculation
  - Progress indicators
  - Smooth transitions between states
  - Animation of price changes

### 🔍 Edge Cases to Test

1. **Invalid Inputs**:
   - Empty country selection
   - Days < 1 or > 365
   - No payment method selected

2. **Network Issues**:
   - Backend unavailable
   - WebSocket connection failure
   - Slow response times

3. **Large Calculations**:
   - Many rules applied
   - Complex discount scenarios
   - Long-duration trips (>30 days)

4. **Responsive Design**:
   - Mobile viewport (375px width)
   - Tablet viewport (768px width)
   - Desktop viewport (1920px width)

## Expected Behavior

### ✅ Successful Simulation Flow

1. **Form Interaction**:
   ```
   Select Country → Enter Days → Choose Payment → Click Run
   ```

2. **Loading State**:
   - Button shows "Running..." with spinner
   - Form controls remain disabled
   - Real-time progress updates appear

3. **Results Display**:
   - Summary shows final pricing and profit
   - Breakdown shows detailed cost calculation
   - Steps show progression with timestamps
   - All tabs are interactive and scrollable

4. **Real-time Updates**:
   - Steps appear progressively during calculation
   - WebSocket connection status is visible
   - Price updates animate smoothly

### ⚠️ Common Issues to Watch For

1. **Missing Variables** (especially in web app):
   - `isCalculating` undefined
   - `calculationProgress` undefined
   - `displayPricing` undefined
   - `showDiscountAnimation` undefined
   - `realtimePricing` undefined

2. **UI/UX Issues**:
   - Dropdowns not opening
   - Buttons not responding to clicks
   - Loading states not showing
   - Results not displaying

3. **Performance Issues**:
   - Slow simulation responses (>5 seconds)
   - Memory leaks with WebSocket connections
   - Unresponsive UI during calculations

4. **Data Issues**:
   - Incorrect pricing calculations
   - Missing discount applications
   - Wrong currency formatting
   - Processing fees not applied

## Web App Bundle Selector Testing

For the web app at `/components/bundle-selector/pricing.tsx`:

```bash
# Run the web app test
node web-app-pricing-test.js
```

**Key Areas to Check**:
- Real-time pricing updates with customer discounts
- Count-up animations for price changes  
- Discount display with savings amounts
- Responsive layout on mobile devices

## Troubleshooting

### Test Script Issues

1. **Puppeteer Installation Failed**:
   ```bash
   # Try manual installation
   npm install puppeteer
   # or
   yarn add puppeteer
   ```

2. **Port Issues**:
   - Update the `baseUrl` in test scripts if dashboard runs on different port
   - Check if port 5173 is available

3. **Timeout Errors**:
   - Increase timeout values in test scripts
   - Check network connection speed
   - Verify backend services are running

### Application Issues

1. **GraphQL Errors**:
   - Verify backend server is running
   - Check GraphQL endpoint configuration
   - Review network tab for failed requests

2. **WebSocket Issues**:
   - Check WebSocket endpoint configuration
   - Verify CORS settings for WebSocket connections
   - Monitor browser developer tools for connection errors

3. **Styling Issues**:
   - Verify Tailwind CSS compilation
   - Check for missing UI component imports
   - Ensure responsive breakpoints are working

## Success Criteria

### ✅ All Tests Pass When:

1. **Automated Test Results**:
   - All UI elements found and functional
   - Simulation completes successfully
   - Steps tab shows progressive updates
   - No JavaScript console errors
   - Screenshots show expected UI states

2. **Manual Testing Results**:
   - Smooth user interaction flow
   - Accurate pricing calculations
   - Real-time updates work correctly
   - Responsive design functions properly
   - Error handling works gracefully

3. **Performance Metrics**:
   - Simulation completes within 5 seconds
   - UI remains responsive during calculation
   - Memory usage stays within acceptable limits
   - WebSocket connection remains stable

## Reporting Issues

When reporting issues, please include:

1. **Screenshots** from the test-screenshots directory
2. **Console errors** from browser developer tools
3. **Test report JSON** with specific failure details
4. **Steps to reproduce** the issue manually
5. **Environment details** (browser, OS, Node.js version)

## Files Generated

After running tests, you'll find:
- `test-screenshots/` - Visual evidence of test execution
- `web-app-test-screenshots/` - Web app specific screenshots  
- `test-report.json` - Detailed automated test results
- `web-app-test-report.json` - Web app test analysis

Review these files to understand the current state of the pricing simulator implementation and identify any areas needing attention.