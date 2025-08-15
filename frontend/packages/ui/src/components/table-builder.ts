// table-builder.ts - Functional Programming with Fluent Interface
// After 4 startups, this is the table architecture that finally works
import { type ColumnDef } from "@tanstack/react-table"
import { 
  createDragDropPlugin, 
  createSelectionPlugin, 
  createFilteringPlugin, 
  createGroupingPlugin,
  createColumnPinningPlugin,
  addDragHandleColumn,
  addSelectionColumn,
  enableColumnGrouping,
  addColumnPinningControls,
  columnPinningPresets,
  type TablePlugin
} from "./table-plugins"

interface TableConfig<TData> {
  columns: ColumnDef<TData>[]
  plugins: TablePlugin<TData>[]
}

// This is where the magic happens - pure transformation functions
// Each function takes a config and returns a new config with added functionality
type TableTransform<TData> = (config: TableConfig<TData>) => TableConfig<TData>

// Selection plugin transformer - adds checkbox column + bulk actions
const withSelection = <TData>(config: {
  enableBulkActions?: boolean
  bulkActions?: React.ComponentType<{ selectedRows: TData[]; table: any }>
  enableSelectAll?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
} = {}): TableTransform<TData> => 
  ({ columns, plugins }) => ({
    columns: addSelectionColumn(columns, config.enableSelectAll), // Inject checkbox column
    plugins: [...plugins, createSelectionPlugin(config)] // Add selection behavior
  })

// Drag & drop transformer - adds grip handle + reorder functionality  
const withDragDrop = <TData>(config: {
  onReorder?: (data: TData[]) => void
  getRowId?: (row: TData) => string | number
}): TableTransform<TData> => 
  ({ columns, plugins }) => ({
    columns: addDragHandleColumn(columns), // Inject drag handle column
    plugins: [...plugins, createDragDropPlugin(config)] // Add drag behavior
  })

// Filtering transformer - no column changes, just adds search/filter behavior
const withFiltering = <TData>(config: {
  globalSearch?: boolean
  globalSearchPlaceholder?: string
  columnFilters?: Record<string, any>
  enableQuickFilters?: boolean
  quickFilters?: { label: string; value: string; filter: (row: TData) => boolean }[]
} = {}): TableTransform<TData> => 
  ({ columns, plugins }) => ({
    columns, // No column changes needed
    plugins: [...plugins, createFilteringPlugin(config)]
  })

// Grouping transformer - marks columns as groupable + adds grouping behavior
const withGrouping = <TData>(config: {
  groupableColumns: string[]
  groupingLabels?: Record<string, string>
  onGroupClick?: (groupValue: string, groupData: TData[]) => void
  enableGroupingControls?: boolean
}): TableTransform<TData> => 
  ({ columns, plugins }) => ({
    columns: enableColumnGrouping(columns, config.groupableColumns), // Mark columns as groupable
    plugins: [...plugins, createGroupingPlugin(config)]
  })

// Column pinning transformer - adds sticky columns + pinning controls
const withColumnPinning = <TData>(config: {
  initialPinnedColumns?: { left?: string[]; right?: string[] }
  enablePinningUI?: boolean
  pinnedColumnStyles?: {
    backgroundColor?: string
    borderColor?: string
    zIndex?: number
  }
  onPinningChange?: (pinning: { left?: string[]; right?: string[] }) => void
  // Control which columns can be pinned
  pinnableColumns?: string[]
  excludeColumns?: string[]
  // Use presets
  preset?: "firstColumn" | "actionsColumn" | "standard"
} = {}): TableTransform<TData> => 
  ({ columns, plugins }) => {
    // Apply preset if specified
    let pinnedColumnsConfig = config.initialPinnedColumns
    if (config.preset) {
      switch (config.preset) {
        case "firstColumn":
          pinnedColumnsConfig = columnPinningPresets.firstColumn(columns).initialPinnedColumns
          break
        case "actionsColumn":
          pinnedColumnsConfig = columnPinningPresets.actionsColumn().initialPinnedColumns
          break
        case "standard":
          pinnedColumnsConfig = columnPinningPresets.standard(columns).initialPinnedColumns
          break
      }
    }

    // Add pinning controls to columns if UI is enabled
    const enhancedColumns = config.enablePinningUI 
      ? addColumnPinningControls(columns, {
          pinnableColumns: config.pinnableColumns,
          excludeColumns: config.excludeColumns
        })
      : columns

    return {
      columns: enhancedColumns,
      plugins: [...plugins, createColumnPinningPlugin({
        ...config,
        initialPinnedColumns: pinnedColumnsConfig
      })]
    }
  }

// Classic functional composition - this is what makes it all work together
const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value)

// The fluent interface that developers actually use
// Internally collects pure transformations, applies them all at once in build()
class TableBuilder<TData> {
  private transforms: TableTransform<TData>[] = []

  constructor(private initialColumns: ColumnDef<TData>[]) {}

  // Each method just collects the transformation, doesn't execute immediately
  addSelection(config: Parameters<typeof withSelection<TData>>[0] = {}) {
    this.transforms.push(withSelection(config))
    return this // Fluent interface
  }

  addDragDrop(config: Parameters<typeof withDragDrop<TData>>[0]) {
    this.transforms.push(withDragDrop(config))
    return this
  }

  addFiltering(config: Parameters<typeof withFiltering<TData>>[0] = {}) {
    this.transforms.push(withFiltering(config))
    return this
  }

  addGrouping(config: Parameters<typeof withGrouping<TData>>[0]) {
    this.transforms.push(withGrouping(config))
    return this
  }

  addColumnPinning(config: Parameters<typeof withColumnPinning<TData>>[0] = {}) {
    this.transforms.push(withColumnPinning(config))
    return this
  }

  // This is where all transformations get applied via functional composition
  build(): TableConfig<TData> {
    return pipe(...this.transforms)({
      columns: this.initialColumns,
      plugins: []
    })
  }
}

// Simple factory function - keeps the interface clean
export const createTableBuilder = <TData>(columns: ColumnDef<TData>[]) => 
  new TableBuilder(columns)

// Usage Examples - How I actually use this in production:

// The API that finally makes sense - clean, readable, and composable
// const { columns, plugins } = createTableBuilder(baseColumns)
//   .addSelection({ enableBulkActions: true })
//   .addDragDrop({ onReorder: setData })
//   .addFiltering({ globalSearch: true })
//   .addGrouping({ groupableColumns: ["role"] })
//   .build()

// Conditional features work beautifully - no more prop drilling hell
// const builder = createTableBuilder(baseColumns)
//   .addSelection({ enableBulkActions: true })
//   .addFiltering({ globalSearch: true })

// Only add drag & drop if user has permissions
// if (userCanReorder) {
//   builder.addDragDrop({ onReorder: setData })
// }

// const { columns, plugins } = builder.build()

// Drop it into the table component - that's it!
// <AdvancedDataTable columns={columns} data={data} plugins={plugins} />

// Pro tip: You can even create reusable builder configurations
export const createAdminTable = <TData>(baseColumns: ColumnDef<TData>[]) => 
  createTableBuilder(baseColumns)
    .addSelection({ enableBulkActions: true })
    .addFiltering({ globalSearch: true })

export const createReadOnlyTable = <TData>(baseColumns: ColumnDef<TData>[]) =>
  createTableBuilder(baseColumns)
    .addFiltering({ globalSearch: true })

// Export types for consumers
export type { TableConfig, TablePlugin }