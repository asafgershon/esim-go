# StrategyLoadModal Component

A comprehensive modal component for loading pricing strategies into the strategy builder. This component provides a user-friendly interface for browsing, searching, and loading existing pricing strategies.

## Features

### 🔍 **Strategy Discovery**
- Display all available pricing strategies
- Real-time search by name or description
- Filter archived/active strategies
- Sort by default status and creation date

### 📊 **Strategy Information**
- Strategy name, code, and version
- Description and block count
- Creation date and usage statistics
- Visual indicators for default and archived strategies

### ⚡ **Smart Loading**
- Confirmation dialog for unsaved changes
- Preview of selected strategy details
- Loading states with skeletons
- Error handling with user-friendly messages

### 🎨 **UI/UX Excellence**
- Responsive grid layout
- Keyboard navigation support
- Visual feedback for selections
- Consistent with existing design system

## Usage

### Basic Integration

```typescript
import React, { useState } from "react";
import StrategyLoadModal from "./components/modals/StrategyLoadModal";
import { Block } from "./types";

const MyStrategyBuilder: React.FC = () => {
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [strategySteps, setStrategySteps] = useState<Block[]>([]);

  const handleStrategyLoad = (blocks: Block[]) => {
    setStrategySteps(blocks);
    console.log("Loaded strategy with blocks:", blocks);
  };

  return (
    <>
      <Button onClick={() => setIsLoadModalOpen(true)}>
        Load Strategy
      </Button>
      
      <StrategyLoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onStrategyLoad={handleStrategyLoad}
        currentStrategySteps={strategySteps}
      />
    </>
  );
};
```

### Props Interface

```typescript
interface StrategyLoadModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Called when modal should be closed */
  onClose: () => void;
  
  /** Called when a strategy is selected for loading */
  onStrategyLoad: (strategyBlocks: Block[]) => void;
  
  /** Current strategy steps (for unsaved changes warning) */
  currentStrategySteps: Block[];
}
```

## Component Architecture

### Dependencies

- **Hooks**: `useStrategies`, `useSearchStrategies`, `useLoadStrategy`
- **GraphQL**: Fetches strategy data from backend
- **UI Components**: Dialog, Button, Input, Card, Badge, Alert
- **Icons**: Lucide React icon set

### Data Flow

1. **Strategy Fetching**: Uses GraphQL hooks to fetch strategies
2. **Search & Filter**: Real-time filtering and search capabilities
3. **Selection**: User selects a strategy from the list
4. **Preview**: Shows detailed information about selected strategy
5. **Confirmation**: Warns about unsaved changes before loading
6. **Loading**: Converts database format to UI builder format

### State Management

```typescript
// Search and filtering
const [searchTerm, setSearchTerm] = useState("");
const [showArchived, setShowArchived] = useState(false);

// Selection and confirmation
const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
```

## Features In Detail

### 🔍 Search Functionality

- **Real-time search**: Searches as you type
- **Clear search**: X button to clear search terms
- **Search scope**: Searches both name and description fields

```typescript
const { strategies, loading, error } = useSearchStrategies(searchTerm);
```

### 📊 Strategy Cards

Each strategy is displayed in a card format showing:

- **Header**: Name, default badge, archived badge
- **Metadata**: Code, version number
- **Description**: Full strategy description (truncated)
- **Statistics**: Block count, usage count, creation date
- **Last Used**: When the strategy was last activated

### ⚠️ Unsaved Changes Protection

When users have unsaved changes, the modal shows a confirmation dialog:

```typescript
const hasUnsavedChanges = currentStrategySteps.length > 0;

if (hasUnsavedChanges) {
  setShowConfirmDialog(true);
} else {
  loadSelectedStrategy();
}
```

### 🎨 Visual States

- **Loading**: Animated skeleton cards
- **Empty**: Helpful message when no strategies found
- **Error**: Clear error messages with retry options
- **Selected**: Visual highlighting of selected strategy

## Backend Integration

### GraphQL Queries Used

```typescript
// Fetch all strategies
const { strategies } = useStrategies({ archived: showArchived });

// Search strategies
const { strategies } = useSearchStrategies(searchTerm);

// Load specific strategy with blocks
const { strategy, loadStrategyIntoBuilder } = useLoadStrategy(strategyId);
```

### Data Transformation

The component automatically transforms database strategy formats to UI builder formats:

```typescript
const strategyBlocks = loadStrategyIntoBuilder(); // Returns Block[]
onStrategyLoad(strategyBlocks);
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: Meets WCAG guidelines

## Testing

Comprehensive test suite covering:

- ✅ Modal rendering and visibility
- ✅ Strategy list display and interaction
- ✅ Search functionality
- ✅ Filter toggles (archived/active)
- ✅ Strategy selection and preview
- ✅ Confirmation dialog flow
- ✅ Loading and error states
- ✅ Accessibility features

Run tests with:
```bash
bun run test StrategyLoadModal.test.tsx
```

## Performance Considerations

### Optimizations

- **Memoized Filtering**: Uses `useMemo` for expensive filtering operations
- **Conditional Queries**: Skips queries when not needed
- **Cache Strategy**: Uses `cache-and-network` for optimal UX
- **Skeleton Loading**: Shows placeholders during data fetching

### Bundle Size

The component uses selective imports to minimize bundle size:

```typescript
// Selective Lucide icon imports
import { Search, Star, Clock, Building, Filter } from "lucide-react";
```

## Customization Options

### Styling

The component uses Tailwind CSS classes and can be customized by:

1. **Override Classes**: Pass custom className props
2. **Theme Variables**: Modify CSS custom properties
3. **Component Variants**: Create styled variants

### Behavior

Customize behavior through props:

```typescript
// Example: Custom confirmation message
const handleStrategyLoad = (blocks: Block[]) => {
  if (window.confirm("Custom confirmation message")) {
    setStrategySteps(blocks);
  }
};
```

## Troubleshooting

### Common Issues

1. **Strategies not loading**: Check GraphQL queries and network
2. **Search not working**: Verify search hook implementation
3. **Modal not closing**: Ensure `onClose` handler is provided
4. **Confirmation not showing**: Check `currentStrategySteps` prop

### Debug Mode

Enable debug logging:

```typescript
console.log("Strategies loaded:", strategies);
console.log("Selected strategy:", selectedStrategy);
console.log("Current steps:", currentStrategySteps);
```

## Future Enhancements

### Planned Features

- 🔄 **Strategy Comparison**: Side-by-side strategy comparison
- 📊 **Usage Analytics**: More detailed usage statistics
- 🏷️ **Tagging System**: Category-based organization
- 💾 **Recent Strategies**: Quick access to recently used strategies
- 🔗 **Strategy Dependencies**: Show related strategies

### Performance Improvements

- ⚡ **Virtual Scrolling**: For large strategy lists
- 🗂️ **Pagination**: Server-side pagination support
- 💾 **Advanced Caching**: More sophisticated caching strategies

## Related Components

- `StepConfigurationModal`: Modal for configuring individual steps
- `AvailableBlocksSidebar`: Sidebar showing available pricing blocks
- `StrategyHeader`: Header component for strategy metadata
- `StrategyFlowBuilder`: Main drag-and-drop strategy builder

---

This component is part of the eSIM Go pricing strategy system and integrates seamlessly with the existing strategy builder architecture.