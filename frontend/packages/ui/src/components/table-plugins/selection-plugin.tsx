"use client"

import * as React from "react"
import { type Row } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
// Plugin interface for extending table functionality
export interface TablePlugin<TData = any> {
  id: string
  component?: React.ComponentType<{ table: any; data: TData[]; children?: React.ReactNode }>
  headerComponent?: React.ComponentType<{ table: any }>
  rowComponent?: React.ComponentType<{ row: any; children: React.ReactNode }>
  cellComponent?: React.ComponentType<{ cell: any; children: React.ReactNode }>
  tableOptions?: any
  tableState?: any
  onMount?: (table: any) => void
  onUnmount?: (table: any) => void
}

interface SelectionPluginProps<TData = any> {
  onSelectionChange?: (selectedRows: TData[]) => void
  enableSelectAll?: boolean
  enableBulkActions?: boolean
  bulkActions?: React.ComponentType<{ selectedRows: TData[]; table: any }>
}

export function createSelectionPlugin<TData = any>({
  onSelectionChange,
  enableSelectAll = true,
  enableBulkActions = false,
  bulkActions: BulkActions,
}: SelectionPluginProps<TData> = {}): TablePlugin<TData> {
  return {
    id: "selection",
    headerComponent: function SelectionHeader({ table }) {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const hasSelection = selectedRows.length > 0

      return (
        <div className="flex items-center space-x-2">
          {hasSelection && enableBulkActions && BulkActions && (
            <BulkActions 
              selectedRows={selectedRows.map((row: Row<TData>) => row.original)} 
              table={table}
            />
          )}
          {hasSelection && (
            <div className="text-sm text-muted-foreground">
              {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          )}
        </div>
      )
    },
    tableOptions: {
      enableRowSelection: true,
    },
    cellComponent: function SelectionCell({ cell, children }) {
      // Add selection checkbox as the first cell
      if (cell.column.id === "select") {
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={cell.row.getIsSelected()}
              onCheckedChange={(value) => cell.row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        )
      }
      return children
    },
  }
}

// Helper function to add selection column
export function addSelectionColumn<TData>(columns: any[], enableSelectAll = true): any[] {
  return [
    {
      id: "select",
      header: enableSelectAll ? ({ table }: { table: any }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ) : "",
      cell: () => null, // Will be replaced by plugin
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    ...columns,
  ]
}

// Common bulk actions component
export function BasicBulkActions<TData>({ 
  selectedRows, 
  table,
  onDelete,
  onExport,
  onBulkEdit,
}: { 
  selectedRows: TData[]
  table: any
  onDelete?: (rows: TData[]) => void
  onExport?: (rows: TData[]) => void
  onBulkEdit?: (rows: TData[]) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      {onDelete && (
        <button
          onClick={() => onDelete(selectedRows)}
          className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Delete ({selectedRows.length})
        </button>
      )}
      {onExport && (
        <button
          onClick={() => onExport(selectedRows)}
          className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Export ({selectedRows.length})
        </button>
      )}
      {onBulkEdit && (
        <button
          onClick={() => onBulkEdit(selectedRows)}
          className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Edit ({selectedRows.length})
        </button>
      )}
    </div>
  )
}