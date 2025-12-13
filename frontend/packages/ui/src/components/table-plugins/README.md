# Advanced Data Table

A powerful, extensible table component built on top of TanStack Table with a plugin architecture that allows you to easily add features like drag & drop, filtering, grouping, and selection.

## Features

- **Plugin Architecture**: Extensible design with composable plugins
- **Drag & Drop**: Reorder rows with drag handles
- **Selection**: Single and multi-row selection with bulk actions
- **Filtering**: Global search and column-specific filters
- **Grouping**: Group rows by columns with expand/collapse
- **Sorting**: Built-in sorting for all columns
- **Pagination**: Configurable pagination with page size options
- **Column Visibility**: Show/hide columns dynamically
- **Responsive**: Works on desktop and mobile
- **TypeScript**: Full type safety with generics

## Installation

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

## Basic Usage

```tsx
import { AdvancedDataTable } from "@/components/advanced-data-table"

interface User {
  id: number
  name: string
  email: string
  role: string
}

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
]

const data: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  // ... more data
]

function MyTable() {
  return (
    <AdvancedDataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search users..."
    />
  )
}
```

## Plugins

### Filtering Plugin

Adds global search and column-specific filters:

```tsx
import { createFilteringPlugin, filterConfigs } from "@/components/table-plugins"

const filteringPlugin = createFilteringPlugin({
  globalSearch: true,
  globalSearchPlaceholder: "Search all columns...",
  columnFilters: {
    role: filterConfigs.select([
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ]),
    status: filterConfigs.select([
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ]),
  },
})

<AdvancedDataTable
  columns={columns}
  data={data}
  plugins={[filteringPlugin]}
/>
```

### Selection Plugin

Enables row selection with bulk actions:

```tsx
import { createSelectionPlugin, addSelectionColumn, BasicBulkActions } from "@/components/table-plugins"

const BulkActionsComponent = ({ selectedRows }: { selectedRows: User[] }) => (
  <BasicBulkActions
    selectedRows={selectedRows}
    onDelete={(rows) => console.log("Delete", rows)}
    onExport={(rows) => console.log("Export", rows)}
  />
)

const selectionPlugin = createSelectionPlugin({
  enableBulkActions: true,
  bulkActions: BulkActionsComponent,
})

// Add selection column to your columns
const columnsWithSelection = addSelectionColumn(columns)

<AdvancedDataTable
  columns={columnsWithSelection}
  data={data}
  plugins={[selectionPlugin]}
  enableRowSelection={true}
/>
```

### Grouping Plugin

Group rows by columns with expand/collapse:

```tsx
import { createGroupingPlugin, enableColumnGrouping } from "@/components/table-plugins"

const groupingPlugin = createGroupingPlugin({
  groupableColumns: ["department", "role"],
  groupingLabels: {
    department: "Department",
    role: "Role",
  },
  onGroupClick: (groupValue, groupData) => {
    console.log("Group clicked:", groupValue, groupData)
  },
})

// Enable grouping on specific columns
const columnsWithGrouping = enableColumnGrouping(columns, ["department", "role"])

<AdvancedDataTable
  columns={columnsWithGrouping}
  data={data}
  plugins={[groupingPlugin]}
  grouping={["department"]} // Initial grouping
/>
```

### Drag & Drop Plugin

Enable row reordering with drag handles:

```tsx
import { createDragDropPlugin, addDragHandleColumn } from "@/components/table-plugins"

const [data, setData] = useState(initialData)

const dragDropPlugin = createDragDropPlugin({
  onReorder: (newData) => setData(newData),
  getRowId: (row) => row.id,
})

// Add drag handle column
const columnsWithDragHandle = addDragHandleColumn(columns)

<AdvancedDataTable
  columns={columnsWithDragHandle}
  data={data}
  plugins={[dragDropPlugin]}
/>
```

## Combining Multiple Plugins

You can combine multiple plugins for maximum functionality:

```tsx
import {
  AdvancedDataTable,
  createDragDropPlugin,
  createSelectionPlugin,
  createFilteringPlugin,
  createGroupingPlugin,
  addDragHandleColumn,
  addSelectionColumn,
  enableColumnGrouping,
} from "@/components/table-plugins"

const plugins = [
  createDragDropPlugin({
    onReorder: setData,
    getRowId: (row) => row.id,
  }),
  createSelectionPlugin({
    enableBulkActions: true,
    bulkActions: BulkActionsComponent,
  }),
  createFilteringPlugin({
    globalSearch: true,
    columnFilters: {
      role: filterConfigs.select([
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ]),
    },
  }),
  createGroupingPlugin({
    groupableColumns: ["department", "role"],
  }),
]

const fullColumns = addSelectionColumn(
  addDragHandleColumn(
    enableColumnGrouping(columns, ["department", "role"])
  )
)

<AdvancedDataTable
  columns={fullColumns}
  data={data}
  plugins={plugins}
  enableRowSelection={true}
/>
```

## API Reference

### AdvancedDataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | - | Table column definitions |
| `data` | `TData[]` | - | Table data |
| `plugins` | `TablePlugin<TData>[]` | `[]` | Array of plugins to enable |
| `searchKey` | `string` | - | Column key for search input |
| `searchPlaceholder` | `string` | `"Search..."` | Placeholder for search input |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enableFiltering` | `boolean` | `true` | Enable column filtering |
| `enableColumnVisibility` | `boolean` | `true` | Enable column visibility toggle |
| `enablePagination` | `boolean` | `true` | Enable pagination |
| `enableRowSelection` | `boolean` | `false` | Enable row selection |
| `initialPageSize` | `number` | `10` | Initial page size |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 40, 50]` | Available page sizes |
| `onRowClick` | `(row: Row<TData>) => void` | - | Callback for row clicks |
| `onRowSelectionChange` | `(selectedRows: TData[]) => void` | - | Callback for selection changes |
| `grouping` | `string[]` | `[]` | Initial grouping columns |
| `onGroupClick` | `(groupValue: string, groupData: TData[]) => void` | - | Callback for group clicks |
| `className` | `string` | - | CSS class for table container |
| `emptyMessage` | `string` | `"No results."` | Message when no data |

### Plugin Interface

```typescript
interface TablePlugin<TData = any> {
  id: string
  component?: React.ComponentType<{ table: any; data: TData[] }>
  headerComponent?: React.ComponentType<{ table: any }>
  rowComponent?: React.ComponentType<{ row: Row<TData>; children: React.ReactNode }>
  cellComponent?: React.ComponentType<{ cell: any; children: React.ReactNode }>
  tableOptions?: any
  tableState?: any
  onMount?: (table: any) => void
  onUnmount?: (table: any) => void
}
```

## Migration Guide

### From GroupedDataTable

```tsx
// Old
<GroupedDataTable
  columns={columns}
  data={data}
  grouping={["department"]}
  onGroupClick={handleGroupClick}
/>

// New
<AdvancedDataTable
  columns={columns}
  data={data}
  plugins={[createGroupingPlugin({ groupableColumns: ["department"] })]}
  grouping={["department"]}
  onGroupClick={handleGroupClick}
/>
```

### From DataTable

```tsx
// Old
<DataTable
  columns={columns}
  data={data}
  searchKey="name"
  searchPlaceholder="Search users..."
/>

// New
<AdvancedDataTable
  columns={columns}
  data={data}
  searchKey="name"
  searchPlaceholder="Search users..."
/>
```

## Examples

See the `examples.tsx` file for complete working examples of all features.

## Contributing

When creating new plugins:

1. Follow the `TablePlugin` interface
2. Use the existing plugins as reference
3. Add proper TypeScript types
4. Include usage examples
5. Update this README

## License

MIT