'use client'

import React, { useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Input, Button } from "@workspace/ui";

// Option type
 type Option = {
  value: string;
  label: string;
  icon?: string;
  keywords?: string[];
};

type MobileDestinationSheetProps = {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  onClose?: () => void;
};

export default function MobileDestinationSheet({ options, value, onValueChange, onClose }: MobileDestinationSheetProps) {
  const [isOpen, setOpen] = useState(true);
  const [search, setSearch] = useState("");

  // Filter options by search
  const filtered = search.trim()
    ? options.filter(opt =>
        opt.label.includes(search) ||
        (opt.keywords && opt.keywords.some(k => k.includes(search)))
      )
    : options;

  function handleClose() {
    setOpen(false);
    if (onClose) onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={handleClose}>
      <Sheet.Container>
        <Sheet.Header>
          <div className="p-4 text-center font-bold bg-card text-card-foreground border-b border-border">בחר יעד</div>
        </Sheet.Header>
        <Sheet.Content>
          <div className="p-4 bg-card text-card-foreground">
            <Input
              className="w-full mb-4 border-border bg-background text-card-foreground placeholder:text-muted-foreground text-right"
              placeholder="...חפש"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-72 overflow-y-auto" dir="rtl">
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground">לא נמצאו תוצאות</div>
              )}
              {filtered.map(opt => (
                <Button
                  key={opt.value}
                  variant={value === opt.value ? "secondary" : "ghost"}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-right justify-start ${value === opt.value ? "bg-primary/10 font-bold border border-primary" : "hover:bg-muted"}`}
                  onClick={() => {
                    onValueChange(opt.value);
                    handleClose();
                  }}
                  type="button"
                >
                  {opt.icon && <span className="text-xl">{opt.icon}</span>}
                  <span>{opt.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
} 