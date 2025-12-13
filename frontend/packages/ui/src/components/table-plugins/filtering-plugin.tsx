"use client"

import * as React from "react"
import { type Column } from "@tanstack/react-table"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/input"
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

interface FilterConfig {
  type: "text" | "select" | "date" | "number" | "boolean"
  options?: { label: string; value: string }[]
  placeholder?: string
}

interface FilteringPluginProps<TData = any> {
  globalSearch?: boolean
  globalSearchPlaceholder?: string
  columnFilters?: Record<string, FilterConfig>
  enableQuickFilters?: boolean
  quickFilters?: { label: string; value: string; filter: (row: TData) => boolean }[]
}

// Global search component
function GlobalSearch({ 
  table, 
  placeholder = "Search all columns..." 
}: { 
  table: any
  placeholder?: string 
}) {
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    table.setGlobalFilter(value)
  }, [value, table])

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue((e.target as HTMLInputElement).value)}
        className="pl-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-6 w-6 p-0"
          onClick={() => setValue("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

// Column filter component
function ColumnFilter({ 
  column, 
  config 
}: { 
  column: Column<any, unknown>
  config: FilterConfig 
}) {
  const filterValue = column.getFilterValue()

  if (config.type === "select") {
    return (
      <Select
        value={filterValue as string}
        onValueChange={(value) => column.setFilterValue(value === "all" ? "" : value)}
      >
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder={config.placeholder || "Filter..."} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {config.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (config.type === "text") {
    return (
      <Input
        placeholder={config.placeholder || "Filter..."}
        value={(filterValue as string) ?? ""}
        onChange={(e) => column.setFilterValue((e.target as HTMLInputElement).value)}
        className="h-8 w-[180px]"
      />
    )
  }

  if (config.type === "number") {
    return (
      <Input
        type="number"
        placeholder={config.placeholder || "Filter..."}
        value={(filterValue as string) ?? ""}
        onChange={(e) => column.setFilterValue((e.target as HTMLInputElement).value)}
        className="h-8 w-[180px]"
      />
    )
  }

  return null
}

// Quick filters component
function QuickFilters<TData>({ 
  quickFilters, 
  table 
}: { 
  quickFilters: { label: string; value: string; filter: (row: TData) => boolean }[]
  table: any
}) {
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null)

  const applyQuickFilter = (filterValue: string) => {
    const filter = quickFilters.find(f => f.value === filterValue)
    if (filter) {
      setActiveFilter(filterValue)
      // Apply custom filter logic here
      // This is a simplified example - in practice you'd want to integrate with TanStack Table's filtering
    } else {
      setActiveFilter(null)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Quick filters:</span>
      {quickFilters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => applyQuickFilter(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
      {activeFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => applyQuickFilter("")}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

// Active filters display
function ActiveFilters({ table }: { table: any }) {
  const columnFilters = table.getState().columnFilters
  const globalFilter = table.getState().globalFilter

  if (!columnFilters.length && !globalFilter) return null

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Active filters:</span>
      {globalFilter && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Global: {globalFilter}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => table.setGlobalFilter("")}
          />
        </Badge>
      )}
      {columnFilters.map((filter: any) => (
        <Badge key={filter.id} variant="secondary" className="flex items-center gap-1">
          {filter.id}: {filter.value}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => table.getColumn(filter.id)?.setFilterValue("")}
          />
        </Badge>
      ))}
    </div>
  )
}

export function createFilteringPlugin<TData = any>({
  globalSearch = true,
  globalSearchPlaceholder,
  columnFilters = {},
  enableQuickFilters = false,
  quickFilters = [],
}: FilteringPluginProps<TData> = {}): TablePlugin<TData> {
  return {
    id: "filtering",
    headerComponent: function FilteringHeader({ table }) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {globalSearch && (
                <GlobalSearch table={table} placeholder={globalSearchPlaceholder} />
              )}
              
              {Object.keys(columnFilters).length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                      Column Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Column Filters</h4>
                      {Object.entries(columnFilters).map(([columnId, config]) => {
                        const column = table.getColumn(columnId)
                        if (!column) return null
                        
                        return (
                          <div key={columnId} className="space-y-2">
                            <label className="text-sm font-medium capitalize">
                              {columnId.replace(/([A-Z])/g, ' $1')}
                            </label>
                            <ColumnFilter column={column} config={config} />
                          </div>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {enableQuickFilters && quickFilters.length > 0 && (
              <QuickFilters quickFilters={quickFilters} table={table} />
            )}
          </div>
          
          <ActiveFilters table={table} />
        </div>
      )
    },
    tableOptions: {
      enableGlobalFilter: globalSearch,
      enableColumnFilters: true,
      enableFilters: true,
    },
  }
}

// Helper function to create common filter configs
export const filterConfigs = {
  text: (placeholder?: string): FilterConfig => ({
    type: "text",
    placeholder,
  }),
  select: (options: { label: string; value: string }[], placeholder?: string): FilterConfig => ({
    type: "select",
    options,
    placeholder,
  }),
  number: (placeholder?: string): FilterConfig => ({
    type: "number",
    placeholder,
  }),
  boolean: (): FilterConfig => ({
    type: "boolean",
  }),
}