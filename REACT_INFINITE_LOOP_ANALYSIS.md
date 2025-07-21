# React Infinite Loop Analysis: CountryPricingTableGrouped Component

## Problem Summary

The `CountryPricingTableGrouped` component was experiencing severe infinite re-render loops when interacting with drawer components, specifically when:
1. Expanding/collapsing country rows
2. Clicking on bundle rows to open drawers
3. Any state changes that triggered table re-renders

**Error Message:**
```
Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

## Root Cause Analysis

### 1. **Circular State Dependencies in Column Definitions**

**Problem:**
```typescript
// PROBLEMATIC: Column definitions dependent on changing state
const columns = useMemo(() => [...], [bundlesByCountry, expandedCountries, loadingCountries, handleToggleCountry])

const handleToggleCountry = useCallback(async (countryId: string) => {
  // Updates expandedCountries and loadingCountries
}, [bundlesByCountry, onExpandCountry])
```

**Why it caused loops:**
- Column definitions recreated on every state change
- Column recreation triggered table recreation
- Table recreation triggered state updates
- State updates triggered column recreation → **infinite cycle**

### 2. **Data Transformation Recreation**

**Problem:**
```typescript
// PROBLEMATIC: Entire data array recreated frequently
const tableData = useMemo(
  () => transformDataForTable(bundlesByCountry, expandedCountries),
  [bundlesByCountry, expandedCountries]
)
```

**Why it caused loops:**
- Large data transformations on every state change
- TanStack Table reprocessed entire dataset
- Triggered internal state management updates

### 3. **Table Builder Plugin Dependencies**

**Problem:**
```typescript
// PROBLEMATIC: Table builder recreated with column dependencies
const { columns: enhancedColumns, plugins } = useMemo(() =>
  createTableBuilder(columns)
    .addColumnPinning({...})
    .addGrouping({...})
    .build(),
  [columns] // This dependency caused recreation cycles
)
```

### 4. **Double Grouping Conflict**

**Problem:**
- Custom summary rows (duration === 0) created in `transformDataForTable`
- TanStack Table's built-in grouping also enabled
- Two competing grouping systems created conflicts and duplicate rows

### 5. **setState During Render Cycles**

**Problem:**
```typescript
// PROBLEMATIC: Async operations during render
const handleToggleCountry = async (countryId: string) => {
  // This could be called during render, triggering setState during render
  onExpandCountry(countryId) // Apollo query → setState → infinite loop
}
```

### 6. **Drawer Component Ref Management**

**Problem:**
- Drawer component had `useCallback` placed after conditional returns
- Violated Rules of Hooks
- `onOpenChange` handler recreated infinitely
- Ref management in drawer causing setState loops

## Implemented Solutions

### 1. **Static Column Definitions with Table Meta Pattern**

**Solution:**
```typescript
// ✅ FIXED: Completely static columns
const columns = useMemo(() => createCountryPricingColumns(), [])

// ✅ Dynamic state accessed via table.options.meta
cell: ({ row, table }) => {
  const meta = table.options.meta || {};
  const isExpanded = meta.expandedCountries?.has(data.countryId);
  const handleToggleCountry = meta.handleToggleCountry;
}
```

### 2. **Separated Column Definitions**

**Solution:**
- Created `country-pricing-table-columns.tsx` with pure static column definitions
- No dependencies on changing state
- All dynamic logic accesses current state via `table.options.meta`

### 3. **Stable Callback Management**

**Solution:**
```typescript
// ✅ FIXED: Stable callbacks with proper dependencies
const handleToggleCountry = useCallback((countryId: string) => {
  // Synchronous state updates only
  // Async operations moved to setTimeout to break render cycle
}, [bundlesByCountry, onExpandCountry])
```

### 4. **Lifted State Management**

**Solution:**
```typescript
// ✅ FIXED: Parent component manages all drawer state
const handleBundleClick = useCallback((bundle: CountryBundle) => {
  React.startTransition(() => {
    setSelectedRow(bundle);
    setIsDrawerOpen(true);
  });
}, []);
```

### 5. **Removed Double Grouping**

**Solution:**
- Removed TanStack Table's built-in grouping entirely
- Used only custom summary rows created by `transformDataForTable`
- Eliminated competing grouping systems

### 6. **Fixed Rules of Hooks Violations**

**Solution:**
```typescript
// ✅ FIXED: useCallback at top level before any early returns
const handleOpenChange = useCallback((open: boolean) => {
  if (!open) {
    onClose();
  }
}, [onClose]);

if (!isOpen) {
  return null;
}
```

## Recommended Refactor Strategy

### Phase 1: Architecture Separation
1. **Separate concerns completely:**
   - Static column definitions in separate files
   - Dynamic state management in parent components
   - UI components should be pure and stateless where possible

### Phase 2: State Management Patterns
1. **Use table meta pattern for all dynamic cell content:**
   ```typescript
   // Pass state through meta prop
   <AdvancedDataTable
     meta={{
       expandedCountries,
       loadingCountries,
       handlers: { handleToggleCountry },
     }}
   />
   ```

2. **Implement stable callback patterns:**
   ```typescript
   // All callbacks should use useCallback with minimal dependencies
   const stableHandler = useCallback((data) => {
     // Implementation
   }, [minimumDependencies])
   ```

### Phase 3: Table Plugin Architecture
1. **Create plugin system that doesn't depend on changing state:**
   ```typescript
   // Plugins should be completely static
   const { columns, plugins } = useMemo(() =>
     createTableBuilder(staticColumns)
       .addFeatures()
       .build(),
     [] // No dependencies
   )
   ```

### Phase 4: Drawer/Modal Management
1. **Lift all modal state to parent components:**
   ```typescript
   // Parent manages all UI state
   const [drawerState, setDrawerState] = useState({
     isOpen: false,
     selectedData: null,
   });
   ```

2. **Use React.startTransition for batched updates:**
   ```typescript
   const handleStateChange = useCallback(() => {
     React.startTransition(() => {
       // Batch multiple state updates
       setMultipleStates();
     });
   }, []);
   ```

### Phase 5: Performance Optimizations
1. **Memoize expensive computations:**
   ```typescript
   const expensiveData = useMemo(() => 
     computeExpensiveTransformation(rawData),
     [rawData] // Only when raw data actually changes
   );
   ```

2. **Use refs for values that don't need to trigger re-renders:**
   ```typescript
   const stableRef = useRef(changingValue);
   stableRef.current = changingValue; // Update without re-render
   ```

## Best Practices for Future Development

### 1. **Table Component Guidelines**
- Keep column definitions static and dependency-free
- Use table meta for all dynamic state access
- Avoid state dependencies in useMemo/useCallback where possible
- Test expand/collapse and modal interactions thoroughly

### 2. **State Management Guidelines**
- Lift modal/drawer state to parent components
- Use React.startTransition for related state updates
- Avoid setState during render cycles
- Use refs for values that don't need re-renders

### 3. **Hook Usage Guidelines**
- Always place hooks at component top level
- No hooks after conditional returns
- Minimize dependencies in useCallback/useMemo
- Use stable patterns for event handlers

### 4. **Performance Guidelines**
- Separate static configuration from dynamic state
- Use memoization strategically, not everywhere
- Test with React DevTools Profiler
- Monitor for "Maximum update depth" warnings

## Tools and Debugging

### React DevTools Profiler
- Use to identify which components are re-rendering
- Look for components that render hundreds of times
- Identify props that change unnecessarily

### Console Warnings
- Monitor for "Maximum update depth exceeded"
- Watch for "Rules of Hooks" violations
- Check for "Can't perform state update on unmounted component"

### Development Techniques
- Add console.logs to track render cycles
- Use React.StrictMode to catch issues early
- Test interactions that combine state changes (expand + modal)

## Conclusion

The infinite loop issue was caused by a combination of circular dependencies, competing systems (double grouping), and improper state management. The solution involved:

1. **Architectural separation** of static vs dynamic concerns
2. **Table meta pattern** for accessing current state in cells
3. **Lifted state management** for modals/drawers
4. **Stable callback patterns** with minimal dependencies
5. **Proper hook ordering** following Rules of Hooks

This refactor pattern should be applied to similar complex table components to prevent infinite loop issues while maintaining full functionality.