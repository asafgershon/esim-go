"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type GroupingState,
  type ExpandedState,
  type ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table"
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Columns3
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { type TablePlugin } from "./table-plugins"
import { ColumnContextMenu } from "./column-context-menu"

interface AdvancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  
  // Plugin system
  plugins?: TablePlugin<TData>[]
  
  // Core table options
  searchKey?: string
  searchPlaceholder?: string
  enableSorting?: boolean
  enableFiltering?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  
  // Pagination options
  initialPageSize?: number
  pageSizeOptions?: number[]
  
  // Event handlers
  onRowClick?: (row: Row<TData>) => void
  onRowSelectionChange?: (selectedRows: TData[]) => void
  
  // Styling
  className?: string
  tableClassName?: string
  emptyMessage?: string
  
  // Enhanced features
  showSelectedCount?: boolean
  stickyHeader?: boolean
  
  // Grouping support
  grouping?: string[]
  autoExpandOnSearch?: boolean
  
  // Table meta data for passing state to cell renderers
  meta?: any
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  plugins = [],
  searchKey,
  searchPlaceholder = "Search...",
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  enableRowSelection = false,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onRowClick,
  onRowSelectionChange,
  className,
  tableClassName,
  emptyMessage = "No results.",
  showSelectedCount = true,
  stickyHeader = false,
  grouping = [],
  autoExpandOnSearch = true,
  meta,
}: AdvancedDataTableProps<TData, TValue>) {
  // Core table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [groupingState, setGroupingState] = React.useState<GroupingState>(grouping || [])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [savedExpandedState, setSavedExpandedState] = React.useState<ExpandedState>({})
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() => {
    // Initialize with plugin state if available
    const initialState = plugins.reduce((acc, plugin) => {
      if (plugin.tableOptions?.initialState?.columnPinning) {
        return { ...acc, ...plugin.tableOptions.initialState.columnPinning }
      }
      return acc
    }, {})
    return initialState
  })

  // Enhanced columns with selection column if enabled
  const enhancedColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
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
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  // Merge plugin options and state
  const pluginOptions = React.useMemo(() => {
    return plugins.reduce((acc, plugin) => {
      return { ...acc, ...plugin.tableOptions }
    }, {})
  }, [plugins])

  const pluginState = React.useMemo(() => {
    return plugins.reduce((acc, plugin) => {
      return { ...acc, ...plugin.tableState }
    }, {})
  }, [plugins])

  // State to track if table is scrolled horizontally
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [containerBgColor, setContainerBgColor] = React.useState<string>('inherit')
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Monitor horizontal scroll to show/hide box shadows and get background color
  React.useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    // Get the container's background color
    const computedStyle = window.getComputedStyle(container)
    let bgColor = computedStyle.backgroundColor
    
    // If container has transparent background, traverse up to find a solid background
    let parent = container.parentElement
    while (parent && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
      const parentStyle = window.getComputedStyle(parent)
      bgColor = parentStyle.backgroundColor
      parent = parent.parentElement
    }
    
    // Fallback to white if no background found
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      bgColor = 'rgb(255, 255, 255)'
    }
    
    setContainerBgColor(bgColor)

    const handleScroll = () => {
      setIsScrolled(container.scrollLeft > 0)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Helper function for column pinning styles (enhanced with scroll-aware shadows)
  const getCommonPinningStyles = (column: any): React.CSSProperties => {
    const isPinned = column.getIsPinned()
    const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
    const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")

    return {
      // Only show box shadows when table is scrolled
      boxShadow: isScrolled && isLastLeftPinnedColumn
        ? "4px 0 4px -2px rgba(0, 0, 0, 0.1)"
        : isScrolled && isFirstRightPinnedColumn
        ? "-4px 0 4px -2px rgba(0, 0, 0, 0.1)"
        : undefined,
      left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
      right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
      position: isPinned ? ("sticky" as const) : ("relative" as const),
      width: column.getSize(),
      zIndex: isPinned ? 1 : 0,
    }
  }

  // Initialize table
  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getRowId: (row, index) => {
      if (typeof row !== 'object' || row === null) {
        return String(row);
      }
      if ('id' in row && row.id) {
        return String(row.id);
      }
      if ('countryId' in row && 'duration' in row && row.countryId && row.duration !== undefined) {
        return row.duration === 0 ? `summary-${row.countryId}` : `bundle-${row.countryId}-${row.duration}`
      }
      return String(index);
    },
    state: {
      sorting: enableSorting ? sorting : [],
      columnFilters: enableFiltering ? columnFilters : [],
      columnVisibility: enableColumnVisibility ? columnVisibility : {},
      rowSelection: enableRowSelection ? rowSelection : {},
      pagination: enablePagination ? pagination : undefined,
      grouping: groupingState,
      expanded: expanded,
      columnPinning: columnPinning,
      ...pluginState,
    },
    meta, // Pass the meta data to the table - this is the key!
    autoResetPageIndex: false,
    
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    onGroupingChange: setGroupingState,
    onExpandedChange: setExpanded,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection,
    enableGrouping: false,
    enableExpanding: false,
    enableColumnPinning: true, // Enable column pinning
    ...pluginOptions,
  })

  // Handle search and grouping interaction
  React.useEffect(() => {
    if (!searchKey || !enableFiltering || !autoExpandOnSearch) return

    const searchColumn = table.getColumn(searchKey)
    if (!searchColumn) return
    
    const searchValue = searchColumn.getFilterValue() as string
    
    if (searchValue && searchValue.trim()) {
      // Save current expanded state before auto-expanding
      setSavedExpandedState(expanded)
      
      // Auto-expand groups that contain search results
      const rowModel = table.getRowModel()
      const newExpanded: ExpandedState = {}
      
      rowModel.rows.forEach(row => {
        if (row.getIsGrouped()) {
          // Check if this group or its children match the search
          const hasMatchingChild = row.subRows?.some(subRow => {
            const cellValue = subRow.getValue(searchKey)
            return cellValue && 
              String(cellValue).toLowerCase().includes(searchValue.toLowerCase())
          })
          
          if (hasMatchingChild) {
            newExpanded[row.id] = true
          }
        }
      })
      
      setExpanded(newExpanded)
    } else {
      // Restore saved expanded state when search is cleared
      setExpanded(savedExpandedState)
    }
  }, [searchKey, enableFiltering, autoExpandOnSearch, table])

  // Handle row selection callback
  React.useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, table])

  // Plugin lifecycle effects
  React.useEffect(() => {
    plugins.forEach(plugin => {
      plugin.onMount?.(table)
    })
    return () => {
      plugins.forEach(plugin => {
        plugin.onUnmount?.(table)
      })
    }
  }, [plugins, table])

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length
  const totalRowCount = table.getFilteredRowModel().rows.length

  // Get plugin header components
  const pluginHeaders = plugins.filter(plugin => plugin.headerComponent)
  
  // Get plugin wrapper component (for drag-drop context)
  const WrapperComponent = plugins.find(plugin => plugin.component)?.component

  // Helper to render cell with plugin modifications
  const renderCell = (cell: any) => {
    let content = flexRender(cell.column.columnDef.cell, cell.getContext())
    
    // Apply plugin cell components in order
    plugins.forEach(plugin => {
      if (plugin.cellComponent) {
        const CellComponent = plugin.cellComponent
        content = <CellComponent cell={cell}>{content}</CellComponent>
      }
    })
    
    return content
  }

  // Helper to render row with plugin modifications
  const renderRow = (row: any, children: React.ReactNode) => {
    let content = children
    
    // Apply plugin row components in order
    plugins.forEach(plugin => {
      if (plugin.rowComponent) {
        const RowComponent = plugin.rowComponent
        content = <RowComponent row={row}>{content}</RowComponent>
      }
    })
    
    return content
  }

  const tableContent = (
    <div className={className}>
      {/* Plugin Headers */}
      {pluginHeaders.map((plugin) => {
        const HeaderComponent = plugin.headerComponent!
        return (
          <div key={plugin.id} className="py-2">
            <HeaderComponent table={table} />
          </div>
        )
      })}

      {/* Enhanced Header with better controls */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          {searchKey && enableFiltering && (
            <div className="relative">
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="w-80"
              />
            </div>
          )}
          
          {/* Column visibility - moved inline with search */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden lg:inline">Columns</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Selected count */}
          {enableRowSelection && showSelectedCount && selectedRowCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedRowCount} of {totalRowCount} row(s) selected
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Empty space for future controls */}
        </div>
      </div>

      {/* Enhanced Table */}
      <div ref={tableContainerRef} className="overflow-auto rounded-lg border">
        <Table className={tableClassName} style={{ borderCollapse: 'separate' }}>
          <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-background" : ""}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    colSpan={header.colSpan}
                    className="font-medium"
                    style={getCommonPinningStyles(header.column)}
                  >
                    <ColumnContextMenu column={header.column}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </ColumnContextMenu>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const defaultRow = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="py-4"
                        style={getCommonPinningStyles(cell.column)}
                      >
                        {renderCell(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
                
                return renderRow(row, defaultRow)
              })
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={enhancedColumns.length} 
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {enableRowSelection && showSelectedCount ? (
              <>
                {selectedRowCount} of {totalRowCount} row(s) selected.
              </>
            ) : (
              <>
                Showing {table.getRowModel().rows.length} of {totalRowCount} entries
              </>
            )}
          </div>
          
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Wrap with plugin component if available (e.g., DragDropProvider)
  return WrapperComponent ? (
    <WrapperComponent table={table} data={data}>
      {tableContent}
    </WrapperComponent>
  ) : (
    tableContent
  )
}