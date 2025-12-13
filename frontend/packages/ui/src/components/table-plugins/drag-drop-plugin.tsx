"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { type Row } from "@tanstack/react-table"
import { Button } from "@/components/button"
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

interface DragDropPluginProps<TData = any> {
  onReorder?: (data: TData[]) => void
  getRowId?: (row: TData) => UniqueIdentifier
  enableDragHandle?: boolean
}

// Drag handle component
function DragHandle({ id, enabled = true }: { id: UniqueIdentifier; enabled?: boolean }) {
  const { attributes, listeners, setNodeRef } = useSortable({ id, disabled: !enabled })

  if (!enabled) return null

  return (
    <Button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      variant="ghost"
      size="sm"
      className="cursor-grab active:cursor-grabbing h-8 w-8 p-0"
    >
      <GripVertical className="h-4 w-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Sortable row wrapper
function SortableRow<TData>({ 
  row, 
  children, 
  id 
}: { 
  row: Row<TData>
  children: React.ReactNode
  id: UniqueIdentifier
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50" : ""}`}
      {...attributes}
    >
      {children}
    </tr>
  )
}

export function createDragDropPlugin<TData = any>({
  onReorder,
  getRowId = (row: any) => row.id,
  enableDragHandle = true,
}: DragDropPluginProps<TData> = {}): TablePlugin<TData> {
  return {
    id: "drag-drop",
    component: function DragDropProvider({ table, data }) {
      const [items, setItems] = React.useState<TData[]>(data)
      const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)
      
      const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      )

      React.useEffect(() => {
        setItems(data)
      }, [data])

      const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
      }

      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (active.id !== over?.id) {
          setItems((items) => {
            const oldIndex = items.findIndex((item) => getRowId(item) === active.id)
            const newIndex = items.findIndex((item) => getRowId(item) === over?.id)
            const newItems = arrayMove(items, oldIndex, newIndex)
            onReorder?.(newItems)
            return newItems
          })
        }
      }

      const itemIds = React.useMemo(() => items.map(getRowId), [items])

      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {/* This component wraps the entire table */}
            <div className="w-full">
              {/* The table content will be rendered as children */}
            </div>
          </SortableContext>
        </DndContext>
      )
    },
    rowComponent: function DragDropRow({ row, children }) {
      const id = getRowId(row.original)
      return (
        <SortableRow row={row} id={id}>
          {children}
        </SortableRow>
      )
    },
    cellComponent: function DragDropCell({ cell, children }) {
      // Add drag handle as the first cell
      if (enableDragHandle && cell.column.id === "drag-handle") {
        const id = getRowId(cell.row.original)
        return <DragHandle id={id} />
      }
      return children
    },
  }
}

// Helper function to add drag handle column
export function addDragHandleColumn<TData>(columns: any[]): any[] {
  return [
    {
      id: "drag-handle",
      header: "",
      cell: () => null, // Will be replaced by plugin
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    ...columns,
  ]
}