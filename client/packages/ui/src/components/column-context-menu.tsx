import React from "react"
import type { Column } from "@tanstack/react-table"
import { Pin, PinOff, ArrowLeft, ArrowRight, EyeOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface ColumnContextMenuProps<TData> {
  column: Column<TData, unknown>
  children: React.ReactNode
}

export function ColumnContextMenu<TData>({
  column,
  children,
}: ColumnContextMenuProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const isPinned = column.getIsPinned()
  const canPin = column.getCanPin?.() !== false // Default to true if method doesn't exist

  // Debug logging
  console.log('Column context menu for:', column.id, {
    isPinned,
    canPin,
    hasPinMethod: typeof column.pin === 'function'
  })

  if (!canPin) {
    return <>{children}</>
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(true)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div onContextMenu={handleContextMenu} className="w-full">
          {children}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        {!isPinned && (
          <>
            <DropdownMenuItem
              onClick={() => {
                console.log('Pinning column to left:', column.id)
                column.pin("left")
                setIsOpen(false)
              }}
              className="flex items-center gap-2"
            >
              <Pin className="h-4 w-4" />
              Freeze column to left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Pinning column to right:', column.id)
                column.pin("right")
                setIsOpen(false)
              }}
              className="flex items-center gap-2"
            >
              <Pin className="h-4 w-4 rotate-180" />
              Freeze column to right
            </DropdownMenuItem>
          </>
        )}
        
        {isPinned && (
          <>
            <DropdownMenuItem
              onClick={() => {
                console.log('Unpinning column:', column.id)
                column.pin(false)
                setIsOpen(false)
              }}
              className="flex items-center gap-2"
            >
              <PinOff className="h-4 w-4" />
              Unfreeze column
            </DropdownMenuItem>
            
            {isPinned === "left" && (
              <DropdownMenuItem
                onClick={() => {
                  column.pin("right")
                  setIsOpen(false)
                }}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Move to right
              </DropdownMenuItem>
            )}
            
            {isPinned === "right" && (
              <DropdownMenuItem
                onClick={() => {
                  column.pin("left")
                  setIsOpen(false)
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Move to left
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            column.toggleVisibility()
            setIsOpen(false)
          }}
          className="flex items-center gap-2"
        >
          <EyeOff className="h-4 w-4" />
          Hide column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}