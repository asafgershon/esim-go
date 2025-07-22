import React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Badge } from '@workspace/ui';
import { cn } from '@workspace/ui';

interface FilterDropdownProps {
  title: string;
  options: string[] | { label: string; value: string }[];
  selected: Set<string>;
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title,
  options,
  selected,
  onSelectionChange,
  placeholder,
  className
}) => {
  // Normalize options to always have label/value structure
  const normalizedOptions = options.map(option => 
    typeof option === 'string' 
      ? { label: option, value: option }
      : option
  );

  const selectedCount = selected.size;
  const hasSelection = selectedCount > 0;

  const handleToggle = (value: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    onSelectionChange(Array.from(newSelected));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange([]);
  };

  const handleSelectAll = () => {
    onSelectionChange(normalizedOptions.map(opt => opt.value));
  };

  const getDisplayText = () => {
    if (selectedCount === 0) {
      return placeholder || title;
    }
    if (selectedCount === 1) {
      const selectedValue = Array.from(selected)[0];
      const selectedOption = normalizedOptions.find(opt => opt.value === selectedValue);
      return selectedOption?.label || selectedValue;
    }
    return `${selectedCount} selected`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-between min-w-[120px] max-w-[200px]",
            hasSelection && "border-primary bg-primary/5",
            className
          )}
        >
          <div className="flex items-center gap-1 truncate">
            <span className="truncate">{getDisplayText()}</span>
            {hasSelection && (
              <Badge 
                variant="secondary" 
                className="h-4 min-w-[16px] text-xs px-1"
                onClick={handleClear}
              >
                {selectedCount}
                <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 max-h-64 overflow-y-auto" 
        align="start"
      >
        <div className="flex items-center justify-between px-2 py-1.5 text-sm font-medium">
          <span>{title}</span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All
            </button>
            {hasSelection && (
              <button
                onClick={() => onSelectionChange([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        {normalizedOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
            className="cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded border",
                selected.has(option.value)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-input"
              )}>
                {selected.has(option.value) && (
                  <Check className="h-3 w-3" />
                )}
              </div>
              <span className="truncate">{option.label}</span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};