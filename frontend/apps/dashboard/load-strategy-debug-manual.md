# Load Strategy Button - Manual Debug Steps

## Prerequisites
1. Ensure the development server is running on port 5173
2. Have valid authentication credentials

## Testing Steps

1. **Access the Dashboard**
   - Navigate to `http://localhost:5173`
   - Complete Google OAuth authentication

2. **Navigate to Strategy Page**
   - Go to `http://localhost:5173/pricing/strategy`
   - You should see the strategy builder interface

3. **Test Load Strategy Button**
   - Look for the "Load Strategy" button (with FolderOpen icon) in the top-right area
   - Click the button
   - A modal should open titled "Load Pricing Strategy"

4. **Expected Behavior in Modal**
   - Shows list of available strategies
   - Search functionality works
   - Strategy selection highlights the item
   - "Load Strategy" button in modal becomes enabled when strategy is selected
   - Clicking "Load Strategy" in modal should:
     - Close modal
     - Load strategy blocks into the builder
     - Show success notification
     - Update strategy name and metadata

## Debugging If Button Doesn't Work

### Check Console Logs
1. Open browser DevTools (F12)
2. Look for error messages
3. Check Network tab for failed GraphQL requests

### Common Issues:
1. **Authentication expired** - Re-login required
2. **No strategies available** - Create strategies first or check database
3. **GraphQL server not running** - Ensure backend server is running
4. **Permission issues** - User must have ADMIN role for pricing access

### Button Location in Code:
- File: `src/pages/pricing/components/strategy/StrategyHeader.tsx`
- Line 87-94: Button definition
- Line 146-151: Modal integration

### Hook Dependencies:
- `useStrategies` - Fetches available strategies
- `useLoadStrategy` - Loads selected strategy details
- GraphQL queries in `src/graphql/queries/strategies.ts`