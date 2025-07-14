"use client"

import { cn } from "@workspace/ui/lib/utils"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import Fuse from 'fuse.js'

import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

interface ComboboxOption {
  value: string
  label: string
  icon?: string
  keywords?: string[]
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Configure Fuse.js for fuzzy search
  const fuse = React.useMemo(() => {
    // Prepare data for Fuse.js with all searchable text
    const fuseData = options.map(option => ({
      ...option,
      searchableText: [option.label, ...(option.keywords || [])].join(' ')
    }))

    return new Fuse(fuseData, {
      keys: [
        { name: 'label', weight: 0.7 },
        { name: 'keywords', weight: 0.3 },
        { name: 'searchableText', weight: 0.5 }
      ],
      threshold: 0.4, // Allow some fuzziness (0 = exact, 1 = match anything)
      distance: 100, // How far from the match location to search
      includeScore: true,
      ignoreLocation: true, // Don't care about position of match
      findAllMatches: true,
      minMatchCharLength: 1,
    })
  }, [options])

  // Get filtered options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) {
      return options
    }

    const results = fuse.search(searchValue.trim())
    return results.map(result => result.item)
  }, [fuse, searchValue, options])

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-right",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon && (
                <span className="text-lg">{selectedOption.icon}</span>
              )}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`חפש...`} 
            className="text-right" 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      const selectedValue = currentValue === value ? "" : currentValue
                      onValueChange?.(selectedValue)
                      setOpen(false)
                      setSearchValue("") // Clear search when selecting
                    }}
                    className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && (
                        <span className="text-lg">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
