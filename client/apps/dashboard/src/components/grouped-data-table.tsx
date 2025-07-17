import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  GroupingState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

interface GroupedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  grouping?: string[];
  onGroupClick?: (groupValue: string, groupData: TData[]) => void;
}

export function GroupedDataTable<TData, TValue>({
  columns,
  data,
  grouping = [],
  onGroupClick,
}: GroupedDataTableProps<TData, TValue>) {
  const [groupingState, setGroupingState] = useState<GroupingState>(grouping);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Update grouping when prop changes
  React.useEffect(() => {
    setGroupingState(grouping);
  }, [grouping]);

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping: groupingState,
      expanded,
      sorting,
    },
    onGroupingChange: setGroupingState,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableGrouping: true,
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                // Grouped row with expand/collapse functionality
                return (
                  <React.Fragment key={row.id}>
                    <TableRow 
                      className="bg-gray-50 font-medium hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Expand/collapse the group
                        row.getToggleExpandedHandler()();
                        
                        // Also trigger group click if handler provided
                        if (onGroupClick) {
                          const groupValue = row.getGroupingValue(groupingState[0]);
                          const groupData = row.subRows.map(subRow => subRow.original);
                          onGroupClick(String(groupValue), groupData);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          <div className="flex items-center gap-2">
                            {row.getIsExpanded() ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            <span className="ml-2 text-sm text-gray-500">
                              ({row.subRows.length})
                            </span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && row.subRows.map((subRow) => (
                      <TableRow
                        key={subRow.id}
                        className="hover:bg-gray-50"
                      >
                        {subRow.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.getIsAggregated() ? (
                              flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
                            ) : cell.getIsPlaceholder() ? null : (
                              flexRender(cell.column.columnDef.cell, cell.getContext())
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              } else {
                // Regular row (when no grouping is applied)
                return (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              }
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}