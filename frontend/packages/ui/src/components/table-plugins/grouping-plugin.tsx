"use client"

import * as React from "react"
import { type Row, getGroupedRowModel, getExpandedRowModel } from "@tanstack/react-table"
import { ChevronDown, ChevronRight, Users, Layers } from "lucide-react"
import { Button } from "@/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/popover"
import { Badge } from "@/components/badge"
// Plugin interface for extending table functionality
export interface TablePlugin<TData = any> {
  id: string
  component?: React.ComponentType<{ table: any; data: TData[] }>
  headerComponent?: React.ComponentType<{ table: any }>
  rowComponent?: React.ComponentType<{ row: any; children: React.ReactNode }>
  cellComponent?: React.ComponentType<{ cell: any; children: React.ReactNode }>
  tableOptions?: any
  tableState?: any
  onMount?: (table: any) => void
  onUnmount?: (table: any) => void
}

interface GroupingPluginProps<TData = any> {
  groupableColumns?: string[]
  onGroupClick?: (groupValue: string, groupData: TData[]) => void
  enableGroupingControls?: boolean
  enableGroupCollapse?: boolean
  groupingLabels?: Record<string, string>
  customGroupRenderer?: (row: Row<TData>) => React.ReactNode
}

// Grouping controls component
function GroupingControls({ 
  table, 
  groupableColumns, 
  groupingLabels = {} 
}: { 
  table: any
  groupableColumns: string[]
  groupingLabels?: Record<string, string>
}) {
  const grouping = table.getState().grouping
  const [selectedColumn, setSelectedColumn] = React.useState<string>("")

  const addGrouping = () => {
    if (selectedColumn && !grouping.includes(selectedColumn)) {
      table.setGrouping([...grouping, selectedColumn])
      setSelectedColumn("")
    }
  }

  const removeGrouping = (columnId: string) => {
    table.setGrouping(grouping.filter((id: string) => id !== columnId))
  }

  const clearAllGrouping = () => {
    table.setGrouping([])
  }

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4" />
            Group by
            {grouping.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {grouping.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Group by columns</h4>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select column to group by" />
                </SelectTrigger>
                <SelectContent>
                  {groupableColumns
                    .filter(col => !grouping.includes(col))
                    .map((column) => (
                      <SelectItem key={column} value={column}>
                        {groupingLabels[column] || column}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addGrouping} disabled={!selectedColumn}>
                Add
              </Button>
            </div>

            {grouping.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active grouping:</span>
                  <Button variant="ghost" size="sm" onClick={clearAllGrouping}>
                    Clear all
                  </Button>
                </div>
                {grouping.map((columnId: string, index: number) => (
                  <div key={columnId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Level {index + 1}:
                      </span>
                      <span className="text-sm font-medium">
                        {groupingLabels[columnId] || columnId}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGrouping(columnId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Group expand/collapse all controls
function GroupExpandControls({ table }: { table: any }) {
  const expanded = table.getState().expanded
  const hasGroups = table.getGroupedRowModel().rows.length > 0

  if (!hasGroups) return null

  const expandAll = () => {
    table.toggleAllRowsExpanded(true)
  }

  const collapseAll = () => {
    table.toggleAllRowsExpanded(false)
  }

  const allExpanded = Object.keys(expanded).length > 0
  const someExpanded = Object.keys(expanded).some(key => expanded[key])

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={expandAll}
        disabled={allExpanded}
      >
        Expand All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={collapseAll}
        disabled={!someExpanded}
      >
        Collapse All
      </Button>
    </div>
  )
}

// Custom group row renderer
function GroupRow<TData>({ 
  row, 
  onGroupClick, 
  customGroupRenderer 
}: { 
  row: Row<TData>
  onGroupClick?: (groupValue: string, groupData: TData[]) => void
  customGroupRenderer?: (row: Row<TData>) => React.ReactNode
}) {
  if (customGroupRenderer) {
    return <>{customGroupRenderer(row)}</>
  }

  const groupingColumn = row.getGroupingValue(row.groupingColumnId || "")
  const groupData = row.subRows.map(subRow => subRow.original)

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
      onClick={() => {
        row.getToggleExpandedHandler()()
        onGroupClick?.(String(groupingColumn), groupData)
      }}
    >
      {row.getIsExpanded() ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      <Users className="h-4 w-4" />
      <span className="font-medium">{String(groupingColumn)}</span>
      <Badge variant="secondary" className="ml-auto">
        {row.subRows.length} items
      </Badge>
    </div>
  )
}

export function createGroupingPlugin<TData = any>({
  groupableColumns = [],
  onGroupClick,
  enableGroupingControls = true,
  enableGroupCollapse = true,
  groupingLabels = {},
  customGroupRenderer,
}: GroupingPluginProps<TData> = {}): TablePlugin<TData> {
  return {
    id: "grouping",
    headerComponent: function GroupingHeader({ table }) {
      const grouping = table.getState().grouping
      const hasGrouping = grouping.length > 0

      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {enableGroupingControls && (
              <GroupingControls
                table={table}
                groupableColumns={groupableColumns}
                groupingLabels={groupingLabels}
              />
            )}
            
            {enableGroupingControls && hasGrouping && enableGroupCollapse && (
              <GroupExpandControls table={table} />
            )}
          </div>
        </div>
      )
    },
    tableOptions: {
      enableGrouping: true,
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      enableExpanding: true,
    },
    rowComponent: function GroupingRow({ row, children }) {
      if (row.getIsGrouped()) {
        return (
          <tr className="bg-muted/50 hover:bg-muted">
            <td colSpan={row.getAllCells().length} className="p-0">
              <GroupRow
                row={row}
                onGroupClick={onGroupClick}
                customGroupRenderer={customGroupRenderer}
              />
            </td>
          </tr>
        )
      }
      return children
    },
    cellComponent: function GroupingCell({ cell, children }) {
      const row = cell.row
      
      // Handle grouped rows
      if (row.getIsGrouped()) {
        // Only render the group content in the first cell
        if (cell.column.id === row.getAllCells()[0].column.id) {
          return (
            <GroupRow
              row={row}
              onGroupClick={onGroupClick}
              customGroupRenderer={customGroupRenderer}
            />
          )
        }
        return null
      }
      
      // Handle sub-rows (rows within groups)
      if (row.getParentRow()?.getIsGrouped()) {
        // Add some indentation for grouped sub-rows
        if (cell.column.id === row.getAllCells()[0].column.id) {
          return (
            <div className="ml-6">
              {children}
            </div>
          )
        }
      }
      
      return children
    },
  }
}

// Helper function to enable grouping on specific columns
export function enableColumnGrouping<TData>(columns: any[], groupableColumns: string[]): any[] {
  return columns.map(column => {
    if (groupableColumns.includes(column.id || column.accessorKey)) {
      return {
        ...column,
        enableGrouping: true,
      }
    }
    return column
  })
}