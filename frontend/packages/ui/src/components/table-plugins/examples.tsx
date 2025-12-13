"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { AdvancedDataTable } from "../advanced-data-table"
import { createTableBuilder, createAdminTable, createReadOnlyTable } from "../table-builder"
import {
  createDragDropPlugin,
  createSelectionPlugin,
  createFilteringPlugin,
  createGroupingPlugin,
  addDragHandleColumn,
  addSelectionColumn,
  enableColumnGrouping,
  filterConfigs,
  BasicBulkActions,
} from "./index"

// Example data types
interface User {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  department: string
  joinDate: string
}

interface Order {
  id: number
  customer: string
  amount: number
  status: "pending" | "completed" | "cancelled"
  date: string
  product: string
}

// Sample data
const sampleUsers: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "active", department: "IT", joinDate: "2023-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "active", department: "Sales", joinDate: "2023-02-20" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Manager", status: "inactive", department: "IT", joinDate: "2023-03-10" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User", status: "active", department: "Marketing", joinDate: "2023-04-05" },
]

const sampleOrders: Order[] = [
  { id: 1, customer: "John Doe", amount: 299.99, status: "completed", date: "2023-10-01", product: "Laptop" },
  { id: 2, customer: "Jane Smith", amount: 89.99, status: "pending", date: "2023-10-02", product: "Mouse" },
  { id: 3, customer: "Bob Johnson", amount: 1299.99, status: "completed", date: "2023-10-03", product: "Workstation" },
  { id: 4, customer: "Alice Brown", amount: 59.99, status: "cancelled", date: "2023-10-04", product: "Keyboard" },
]

// Example 1: Basic table with filtering and sorting
export function BasicTableExample() {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
    },
  ]

  const filteringPlugin = createFilteringPlugin({
    globalSearch: true,
    globalSearchPlaceholder: "Search users...",
    columnFilters: {
      role: filterConfigs.select([
        { label: "Admin", value: "Admin" },
        { label: "Manager", value: "Manager" },
        { label: "User", value: "User" },
      ]),
      status: filterConfigs.select([
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ]),
      department: filterConfigs.select([
        { label: "IT", value: "IT" },
        { label: "Sales", value: "Sales" },
        { label: "Marketing", value: "Marketing" },
      ]),
    },
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Table with Filtering</h3>
      <AdvancedDataTable
        columns={columns}
        data={sampleUsers}
        plugins={[filteringPlugin]}
        searchKey="name"
      />
    </div>
  )
}

// Example 2: Table with selection and bulk actions
export function SelectionTableExample() {
  const [users, setUsers] = React.useState(sampleUsers)

  const columns: ColumnDef<User>[] = addSelectionColumn([
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
  ])

  const handleDelete = (selectedUsers: User[]) => {
    setUsers(prev => prev.filter(user => !selectedUsers.find(selected => selected.id === user.id)))
  }

  const handleExport = (selectedUsers: User[]) => {
    console.log("Exporting users:", selectedUsers)
  }

  const BulkActionsComponent = ({ selectedRows }: { selectedRows: User[]; table: any }) => (
    <BasicBulkActions
      selectedRows={selectedRows}
      table={undefined}
      onDelete={handleDelete}
      onExport={handleExport}
    />
  )

  const selectionPlugin = createSelectionPlugin({
    enableBulkActions: true,
    bulkActions: BulkActionsComponent,
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Table with Selection and Bulk Actions</h3>
      <AdvancedDataTable
        columns={columns}
        data={users}
        plugins={[selectionPlugin]}
        enableRowSelection={true}
      />
    </div>
  )
}

// Example 3: Table with grouping
export function GroupingTableExample() {
  const columns: ColumnDef<User>[] = enableColumnGrouping([
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
    },
  ], ["department", "role", "status"])

  const groupingPlugin = createGroupingPlugin({
    groupableColumns: ["department", "role", "status"],
    groupingLabels: {
      department: "Department",
      role: "Role",
      status: "Status",
    },
    onGroupClick: (groupValue, groupData) => {
      console.log("Group clicked:", groupValue, groupData)
    },
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Table with Grouping</h3>
      <AdvancedDataTable
        columns={columns}
        data={sampleUsers}
        plugins={[groupingPlugin]}
        grouping={["department"]}
      />
    </div>
  )
}

// Example 4: Table with drag and drop
export function DragDropTableExample() {
  const [users, setUsers] = React.useState(sampleUsers)

  const columns: ColumnDef<User>[] = addDragHandleColumn([
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
  ])

  const dragDropPlugin = createDragDropPlugin({
    onReorder: (newData) => {
      setUsers(newData)
    },
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Table with Drag and Drop</h3>
      <AdvancedDataTable
        columns={columns}
        data={users}
        plugins={[dragDropPlugin]}
      />
    </div>
  )
}

// Example 5: Full-featured table with all plugins
export function FullFeaturedTableExample() {
  const [users, setUsers] = React.useState(sampleUsers)

  const columns: ColumnDef<User>[] = addSelectionColumn(
    addDragHandleColumn(
      enableColumnGrouping([
        {
          accessorKey: "name",
          header: "Name",
        },
        {
          accessorKey: "email",
          header: "Email",
        },
        {
          accessorKey: "role",
          header: "Role",
          cell: ({ row }: { row: any }) => (
            <Badge variant="outline">{row.original.role}</Badge>
          ),
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }: { row: any }) => (
            <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
              {row.original.status}
            </Badge>
          ),
        },
        {
          accessorKey: "department",
          header: "Department",
        },
      ], ["department", "role", "status"])
    )
  )

  const handleDelete = (selectedUsers: User[]) => {
    setUsers(prev => prev.filter(user => !selectedUsers.find(selected => selected.id === user.id)))
  }

  const BulkActionsComponent = ({ selectedRows }: { selectedRows: User[]; table: any }) => (
    <BasicBulkActions
      selectedRows={selectedRows}
      table={undefined}
      onDelete={handleDelete}
    />
  )

  const plugins = [
    createDragDropPlugin({
      onReorder: setUsers,
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
          { label: "Admin", value: "Admin" },
          { label: "Manager", value: "Manager" },
          { label: "User", value: "User" },
        ]),
        status: filterConfigs.select([
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]),
      },
    }),
    createGroupingPlugin({
      groupableColumns: ["department", "role", "status"],
      groupingLabels: {
        department: "Department",
        role: "Role",
        status: "Status",
      },
    }),
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Full-Featured Table (All Plugins)</h3>
      <AdvancedDataTable
        columns={columns}
        data={users}
        plugins={plugins}
        enableRowSelection={true}
      />
    </div>
  )
}

// Example 6: Using TableBuilder Pattern (Recommended!)
export function TableBuilderExample() {
  const [users, setUsers] = React.useState(sampleUsers)

  const baseColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
    },
  ]

  // The magic happens here - clean, readable configuration
  const { columns, plugins } = createTableBuilder(baseColumns)
    .addSelection({ 
      enableBulkActions: true,
      bulkActions: ({ selectedRows }: { selectedRows: User[]; table: any }) => (
        <BasicBulkActions
          selectedRows={selectedRows}
          table={undefined}
          onDelete={(rows) => setUsers(prev => prev.filter(user => !rows.find(selected => selected.id === user.id)))}
          onExport={(rows) => console.log("Exporting:", rows)}
        />
      ),
    })
    .addDragDrop({ 
      onReorder: setUsers,
      getRowId: (user) => user.id 
    })
    .addFiltering({ 
      globalSearch: true,
      globalSearchPlaceholder: "Search users...",
      columnFilters: {
        role: filterConfigs.select([
          { label: "Admin", value: "Admin" },
          { label: "Manager", value: "Manager" },
          { label: "User", value: "User" },
        ]),
        status: filterConfigs.select([
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]),
        department: filterConfigs.select([
          { label: "IT", value: "IT" },
          { label: "Sales", value: "Sales" },
          { label: "Marketing", value: "Marketing" },
        ]),
      },
    })
    .addGrouping({ 
      groupableColumns: ["role", "status", "department"],
      groupingLabels: {
        role: "User Role",
        status: "Account Status",
        department: "Department",
      },
    })
    .build()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">TableBuilder Pattern (Clean & Readable!)</h3>
      <AdvancedDataTable
        columns={columns}
        data={users}
        plugins={plugins}
        searchKey="name"
        className="w-full"
      />
    </div>
  )
}

// Example 7: Conditional features with TableBuilder
export function ConditionalBuilderExample() {
  const [users, setUsers] = React.useState(sampleUsers)
  const [userCanEdit, setUserCanEdit] = React.useState(false)
  const [userCanReorder, setUserCanReorder] = React.useState(false)

  const baseColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  // Conditional builder pattern - no more prop drilling hell!
  const builder = createTableBuilder(baseColumns)
    .addFiltering({ globalSearch: true, globalSearchPlaceholder: "Search users..." })

  // Only add features if user has permissions
  if (userCanEdit) {
    builder.addSelection({ enableBulkActions: true })
  }

  if (userCanReorder) {
    builder.addDragDrop({ 
      onReorder: setUsers,
      getRowId: (user) => user.id 
    })
  }

  const { columns, plugins } = builder.build()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Conditional Features with TableBuilder</h3>
      
      {/* Permission Controls */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={userCanEdit} 
            onChange={(e) => setUserCanEdit(e.target.checked)}
          />
          Can Edit (adds selection + bulk actions)
        </label>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={userCanReorder} 
            onChange={(e) => setUserCanReorder(e.target.checked)}
          />
          Can Reorder (adds drag & drop)
        </label>
      </div>

      <AdvancedDataTable
        columns={columns}
        data={users}
        plugins={plugins}
        searchKey="name"
        className="w-full"
      />
    </div>
  )
}

// Example 8: Using preset configurations
export function PresetConfigurationsExample() {
  const baseColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email", 
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
  ]

  // Using preset configurations for consistency across app
  const adminConfig = createAdminTable(baseColumns).build()
  const readOnlyConfig = createReadOnlyTable(baseColumns).build()

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Preset Configurations</h3>
      
      <div>
        <h4 className="text-md font-medium mb-2">Admin Table (Full Features)</h4>
        <AdvancedDataTable
          columns={adminConfig.columns}
          data={sampleUsers}
          plugins={adminConfig.plugins}
          className="w-full"
        />
      </div>

      <div>
        <h4 className="text-md font-medium mb-2">Read-Only Table</h4>
        <AdvancedDataTable
          columns={readOnlyConfig.columns}
          data={sampleUsers}
          plugins={readOnlyConfig.plugins}
          className="w-full"
        />
      </div>
    </div>
  )
}

// Example component that shows all examples
export function TableExamples() {
  const [activeExample, setActiveExample] = React.useState("builder")

  const examples = [
    { id: "builder", label: "TableBuilder Pattern", component: TableBuilderExample },
    { id: "conditional", label: "Conditional Builder", component: ConditionalBuilderExample },
    { id: "presets", label: "Preset Configs", component: PresetConfigurationsExample },
    { id: "basic", label: "Basic Filtering", component: BasicTableExample },
    { id: "selection", label: "Selection & Bulk Actions", component: SelectionTableExample },
    { id: "grouping", label: "Grouping", component: GroupingTableExample },
    { id: "dragdrop", label: "Drag & Drop", component: DragDropTableExample },
    { id: "full", label: "Full Featured", component: FullFeaturedTableExample },
  ]

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || TableBuilderExample

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example.id}
            variant={activeExample === example.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveExample(example.id)}
          >
            {example.label}
          </Button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  )
}