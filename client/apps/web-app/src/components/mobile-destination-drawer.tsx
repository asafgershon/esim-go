'use client'

import React, { useState } from "react";
import { Drawer } from "vaul";
import { Input, Button } from "@workspace/ui";
import { Search, X } from "lucide-react";

// Option type
type Option = {
  value: string;
  label: string;
  icon?: string;
  keywords?: string[];
};

type MobileDestinationDrawerProps = {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  onClose?: () => void;
  isOpen: boolean;
};

export default function MobileDestinationDrawer({ 
  options, 
  value, 
  onValueChange, 
  onClose, 
  isOpen 
}: MobileDestinationDrawerProps) {
  const [search, setSearch] = useState("");

  // Filter options by search
  const filtered = search.trim()
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.keywords && opt.keywords.some(k => k.toLowerCase().includes(search.toLowerCase())))
      )
    : options;

  function handleClose() {
    if (onClose) onClose();
  }

  function handleSelect(selectedValue: string) {
    onValueChange(selectedValue);
    handleClose();
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-card text-card-foreground flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-card rounded-t-[10px] flex-1 flex flex-col">
            {/* Drag Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Drawer.Title className="text-lg font-semibold">
                בחר יעד
              </Drawer.Title>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-full pl-10 pr-4 border-border bg-background text-foreground placeholder:text-muted-foreground text-right"
                placeholder="חפש יעד..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto" dir="rtl">
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  לא נמצאו תוצאות
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={value === opt.value ? "secondary" : "ghost"}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg text-right justify-start min-h-[3rem] ${
                        value === opt.value 
                          ? "bg-primary/10 font-bold border border-primary text-primary" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelect(opt.value)}
                      type="button"
                    >
                      {opt.icon && (
                        <span className="text-xl flex-shrink-0">{opt.icon}</span>
                      )}
                      <span className="flex-1 text-right">{opt.label}</span>
                      {value === opt.value && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom spacing for safe area */}
            <div className="h-4 flex-shrink-0" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}