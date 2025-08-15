import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TablePlugin } from "./selection-plugin"
import { Pin, PinOff } from "lucide-react"
import { Button } from "../button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu"

export interface ColumnPinningOptions {
  // Initial columns to pin on left/right
  initialPinnedColumns?: {
    left?: string[]
    right?: string[]
  }
  // Enable column pinning UI in headers
  enablePinningUI?: boolean
  // Custom styles for pinned columns
  pinnedColumnStyles?: {
    backgroundColor?: string
    borderColor?: string
    zIndex?: number
  }
  // Callback when pinning state changes
  onPinningChange?: (pinning: { left?: string[]; right?: string[] }) => void
}

// Helper function to get common pinning styles (following TanStack Table official example)
const getCommonPinningStyles = (column: any, pinnedColumnStyles: any) => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")

  return {
    boxShadow: isLastLeftPinnedColumn
      ? `-4px 0 4px -4px ${pinnedColumnStyles.borderColor} inset`
      : isFirstRightPinnedColumn
      ? `4px 0 4px -4px ${pinnedColumnStyles.borderColor} inset`
      : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    backgroundColor: isPinned ? pinnedColumnStyles.backgroundColor : undefined,
    width: column.getSize(),
    zIndex: isPinned ? pinnedColumnStyles.zIndex : 0,
  }
}

export function createColumnPinningPlugin(
  options: ColumnPinningOptions = {}
): TablePlugin {
  const {
    initialPinnedColumns = {},
    enablePinningUI = true,
    pinnedColumnStyles = {
      backgroundColor: "rgb(249 250 251)", // gray-50
      borderColor: "rgb(156 163 175)", // gray-400
      zIndex: 1,
    },
    onPinningChange,
  } = options

  return {
    id: "column-pinning",
    tableOptions: {
      enableColumnPinning: true,
      initialState: {
        columnPinning: initialPinnedColumns,
      },
      onColumnPinningChange: onPinningChange,
    },
    // Add pinning UI to column headers if enabled
    headerComponent: enablePinningUI
      ? ({ table }) => {
          const pinnedColumns = table.getState().columnPinning
          const hasPinnedColumns =
            (pinnedColumns.left && pinnedColumns.left.length > 0) ||
            (pinnedColumns.right && pinnedColumns.right.length > 0)

          if (!hasPinnedColumns) return null

          return (
            <div className="mb-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4" />
                <span>
                  Pinned columns:{" "}
                  {pinnedColumns.left?.length || 0} left,{" "}
                  {pinnedColumns.right?.length || 0} right
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.resetColumnPinning()}
                  className="ml-auto"
                >
                  <PinOff className="h-4 w-4 mr-1" />
                  Unpin all
                </Button>
              </div>
            </div>
          )
        }
      : undefined,
  }
}

// Helper function to add pinning controls to column headers
export function addColumnPinningControls<TData>(
  columns: ColumnDef<TData>[],
  options: {
    pinnableColumns?: string[] // Whitelist of pinnable columns
    excludeColumns?: string[] // Blacklist of non-pinnable columns
  } = {}
): ColumnDef<TData>[] {
  const { pinnableColumns, excludeColumns = [] } = options

  return columns.map((column) => {
    // Skip if column doesn't have an ID or is excluded
    const columnId = column.id || (column as any).accessorKey
    if (!columnId || excludeColumns.includes(columnId)) {
      return column
    }

    // Skip if pinnableColumns is defined and column is not in the list
    if (pinnableColumns && !pinnableColumns.includes(columnId)) {
      return column
    }

    // Add pinning dropdown to header
    const originalHeader = column.header
    column.header = (headerContext) => {
      const { column: tableColumn } = headerContext
      const isPinned = tableColumn.getIsPinned()

      // Render original header content
      const headerContent =
        typeof originalHeader === "function"
          ? originalHeader(headerContext)
          : originalHeader

      return (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">{headerContent}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Pin
                  className={`h-3 w-3 ${
                    isPinned ? "text-blue-600" : "text-gray-400"
                  }`}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => tableColumn.pin("left")}
                disabled={isPinned === "left"}
              >
                <Pin className="mr-2 h-4 w-4" />
                Pin to left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => tableColumn.pin("right")}
                disabled={isPinned === "right"}
              >
                <Pin className="mr-2 h-4 w-4 rotate-180" />
                Pin to right
              </DropdownMenuItem>
              {isPinned && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => tableColumn.pin(false)}>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin column
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }

    return column
  })
}

// Preset configuration for common use cases
export const columnPinningPresets = {
  // Pin first column (usually ID or name)
  firstColumn: (columns: ColumnDef<any>[]): ColumnPinningOptions => {
    const firstColumnId = columns[0]?.id || (columns[0] as any)?.accessorKey
    return {
      initialPinnedColumns: {
        left: firstColumnId ? [firstColumnId] : [],
      },
    }
  },

  // Pin actions column to the right
  actionsColumn: (actionsColumnId = "actions"): ColumnPinningOptions => ({
    initialPinnedColumns: {
      right: [actionsColumnId],
    },
  }),

  // Pin both first and actions columns
  standard: (
    columns: ColumnDef<any>[],
    actionsColumnId = "actions"
  ): ColumnPinningOptions => {
    const firstColumnId = columns[0]?.id || (columns[0] as any)?.accessorKey
    return {
      initialPinnedColumns: {
        left: firstColumnId ? [firstColumnId] : [],
        right: [actionsColumnId],
      },
    }
  },
}