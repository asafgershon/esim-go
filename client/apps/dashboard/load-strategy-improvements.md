# Load Strategy Button - Suggested Improvements

## Current Issues & Improvements

### 1. Better Error Feedback
**Issue**: Users might not understand why nothing happens when not authenticated
**Solution**: Add loading states and error handling

### 2. Loading State Indicators
**Issue**: No visual feedback while strategies are loading
**Solution**: Add loading spinners and skeleton states

### 3. Empty State Handling
**Issue**: If no strategies exist, modal shows empty list without explanation
**Solution**: Add helpful empty state with "Create Strategy" call-to-action

### 4. Authentication State Awareness
**Issue**: Button appears even when user isn't authenticated
**Solution**: Hide or disable button with tooltip when not authenticated

## Code Improvements

### Add Loading State to Button
```typescript
// In StrategyHeader.tsx
<button
  onClick={() => setShowLoadModal(true)}
  disabled={!user || strategiesLoading}
  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <FolderOpen className="h-4 w-4" />
  {strategiesLoading ? 'Loading...' : 'Load Strategy'}
</button>
```

### Add User Context Check
```typescript
import { useAuth } from '../../../contexts/auth-context';

const StrategyHeader: React.FC<StrategyHeaderProps> = ({ ... }) => {
  const { user } = useAuth();
  // ... rest of component
};
```

### Improve Error Handling in useLoadStrategy
```typescript
// Add retry mechanism and better error messages
const { strategy, loading, error, refetch } = useLoadStrategy(selectedStrategyId);

// Show user-friendly error message
if (error) {
  return (
    <Alert className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Failed to load strategy: {error.message}
        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

## Test Improvements

### Fix Unit Test Issues
The failing tests need data structure updates to match actual GraphQL responses:

```typescript
// Fix missing 'code' field in mock data
const mockPricingBlock = {
  id: "block-123",
  code: "MARKUP_BLOCK", // This was missing
  name: "Markup Block",
  // ... rest of fields
};
```

### Add Integration Tests
Create tests that verify the full authentication + strategy loading flow.