# eSIM Go Web App - Integration Tests

This directory contains Playwright integration tests for the eSIM Go web application, specifically testing the bundle selector components and their interactions with URL query parameters.

## Test Coverage

### Bundle Selector Integration Tests

The main test suite (`bundle-selector-integration.spec.ts`) covers three critical test cases:

#### Test Case 1: Destination Gallery Click Sets Country Query Param
- **Purpose**: Verify that clicking on destination cards in the gallery correctly sets URL parameters
- **Tests**:
  - Italy destination → `countryId=it`
  - USA destination → `countryId=us` 
  - Greece destination → `countryId=gr`
  - Thailand destination → `countryId=th`
  - Brazil destination → `countryId=br`
- **Key Assertion**: URL contains correct `countryId` and `activeTab=countries`

#### Test Case 2: Country Parameter Change Scrolls and Focuses Selector
- **Purpose**: Verify that URL parameter changes trigger proper scrolling and focus behavior
- **Tests**:
  - Direct navigation with country parameter scrolls to `#esim-selector`
  - Mobile viewport scroll behavior works correctly
  - Multiple parameter changes maintain scroll behavior
  - Destination selector shows selected state (not placeholder)
- **Key Assertions**: Element is in viewport, destination selector is focused/selected

#### Test Case 3: Days Slider Updates Query Parameter
- **Purpose**: Verify that the days slider correctly updates the `numOfDays` URL parameter
- **Tests**:
  - Slider changes update URL parameter in real-time
  - Values persist across navigation
  - Slider respects min (1) and max (30) bounds
  - Real-time updates work with multiple rapid changes
- **Key Assertions**: URL parameter matches slider value, bounds are enforced

### Cross-Component Integration Tests
- Complete user flow: destination click → scroll → slider change
- URL parameter persistence during page reloads
- Sequential destination clicks update parameters correctly
- Destination clicks preserve existing days values
- Rapid interactions don't cause race conditions

## Architecture

### Test Utilities (`helpers/test-utils.ts`)
The test suite uses a comprehensive utility class that provides:
- **TestUtils Class**: Encapsulates common test operations
- **Reusable Methods**: Click destinations, set slider values, check URL params
- **Constants**: Destination mappings and test configuration
- **Reliability**: Proper waits, fallbacks, and error handling

### Key Features
- **Cross-browser Testing**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Reliable Selectors**: Multiple fallback strategies for finding elements
- **Proper Waits**: Network idle, element visibility, URL updates
- **Mobile Support**: Viewport management and mobile-specific tests
- **Race Condition Prevention**: Proper timing and state management

## Running Tests

### Prerequisites
- Node.js and bun installed
- Dependencies installed: `bun install`
- Development server available at `localhost:3000`

### Commands

```bash
# Run all e2e tests
bun run test:e2e

# Run tests in UI mode for debugging
bun run test:e2e:ui

# Run tests in debug mode
bun run test:e2e:debug

# Run specific test file
bun run test:e2e tests/e2e/bundle-selector-integration.spec.ts

# Run tests in headed mode (see browser)
bunx playwright test --headed

# Run tests on specific browser
bunx playwright test --project=chromium
```

### Test Development Server
The Playwright config automatically starts the development server (`bun run dev`) before running tests. The tests will wait for `localhost:3000` to be available.

## Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Timeouts**: 30s per test, 10s for assertions
- **Retries**: 2 retries on CI, 0 locally
- **Reports**: HTML and JSON reports
- **Video/Screenshots**: On failure only

### Browser Projects
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5, iPhone 12

## Best Practices

### Writing Tests
1. **Use TestUtils**: Always use the utility class for common operations
2. **Proper Waits**: Wait for network idle, element visibility, and state changes
3. **Descriptive Names**: Test names should clearly describe the behavior being tested
4. **Independent Tests**: Each test should be able to run in isolation
5. **Clean State**: Use beforeEach to ensure clean starting state

### Debugging
1. **UI Mode**: Use `bun run test:e2e:ui` for visual debugging
2. **Debug Mode**: Use `bun run test:e2e:debug` to step through tests
3. **Screenshots**: Check `test-results/` for failure screenshots
4. **Traces**: Use Playwright trace viewer for detailed execution analysis

### Common Issues
1. **Timing Issues**: Add proper waits instead of fixed timeouts
2. **Selector Failures**: Use multiple fallback selectors in TestUtils
3. **Mobile Differences**: Account for different behavior on mobile browsers
4. **Race Conditions**: Ensure proper state synchronization

## Test Data

### Destinations
The tests use a predefined set of destinations with known country codes:
- Rome (Italy) → `it`
- USA → `us`
- Greece → `gr`
- Thailand → `th`
- Dubai (UAE) → `ae`
- Brazil → `br`
- Canada → `ca`
- China → `cn`

### Constants
- Default days: 7
- Min days: 1
- Max days: 30
- Default tab: 'countries'
- Selector ID: '#esim-selector'

## Maintenance

### Updating Tests
When the application changes:
1. Update selectors in `test-utils.ts` if element identifiers change
2. Update destination mappings if new countries are added
3. Update constants if business rules change (e.g., max days)
4. Add new test cases for new functionality

### Performance
- Tests run in parallel by default
- Use `fullyParallel: true` for maximum speed
- Tests are optimized for reliability over speed
- Network idle waits ensure all async operations complete

## Reporting

Test results are available in:
- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)

## CI/CD Integration

The tests are designed to run in CI environments:
- Automatic retry on failure (2 retries on CI)
- Deterministic behavior with proper waits
- Comprehensive error reporting
- Screenshot/video capture for debugging failures