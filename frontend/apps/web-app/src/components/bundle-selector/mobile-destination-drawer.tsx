"use client";

import React, { useState, useEffect, useRef } from "react";
import { useScrollSmootherLock } from "@workspace/ui";
import { Drawer } from "vaul";
import { Input, Button, ComboboxOption } from "@workspace/ui";
import { Search, X } from "lucide-react";
import Image from "next/image";
import {
  SEARCH_DESTINATION_PLACEHOLDER,
  NO_RESULTS_MESSAGE,
  SELECT_DESTINATION_TITLE,
} from "./destination-selector.constants";

type MobileDestinationDrawerProps = {
  options: ComboboxOption[];
  initialValue?: string;
  onValueChangeAction: (value: string) => void;
  onCloseAction?: () => void;
  isOpen: boolean;
};

export default function MobileDestinationDrawer({
  options,
  initialValue,
  onValueChangeAction,
  onCloseAction,
  isOpen,
}: MobileDestinationDrawerProps) {
  const [search, setSearch] = useState("");
  const [shouldFocusInput, setShouldFocusInput] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ נועל רקע אבל שומר גלילה פנימית
  useScrollSmootherLock({
    autoLock: isOpen,
    preserveScrollPosition: true,
    preventTouchMove: false,
  });

  // ✅ בכל פתיחה — מאפס חיפוש, מגלול לערך הנבחר אם יש
useEffect(() => {
  if (isOpen) {
    // מנקה חיפוש (אם אתה רוצה)
    setSearch("");

    // תמיד מבטל פוקוס
    if (inputRef.current) {
      inputRef.current.blur();
    }

    // מגלול לעמדה הנכונה
    setTimeout(() => {
      const list = document.querySelector("#destination-list");
      if (!list) return;
      const selected = list.querySelector(`[data-value="${initialValue}"]`);

      if (selected) {
        selected.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        list.scrollTo({ top: 0 });
      }
    }, 50);
  }
}, [isOpen, initialValue]);


  const filtered = search.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          (opt.keywords &&
            opt.keywords.some((k) =>
              k.toLowerCase().includes(search.toLowerCase())
            ))
      )
    : options;

  const handleClose = () => {
    if (onCloseAction) onCloseAction();
  };

  const handleSelect = (selectedValue: string) => {
    onValueChangeAction(selectedValue);
    handleClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-card text-card-foreground flex flex-col rounded-t-[10px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
          <div className="p-4 bg-card rounded-t-[10px] flex-1 flex flex-col min-h-0">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />

            <div className="flex items-center justify-between mb-4">
              <Drawer.Title className="text-lg font-semibold">
                {SELECT_DESTINATION_TITLE}
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

            {/* שדה חיפוש */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              dir="rtl"
              style={{ fontSize: 16 }}   // מונע זום
              className="w-full pl-10 pr-4 border-border bg-background text-foreground placeholder:text-muted-foreground text-right text-base"
              placeholder={SEARCH_DESTINATION_PLACEHOLDER}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            </div>

            {/* רשימת יעדים */}
            <div
              id="destination-list"
              className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
              dir="rtl"
            >
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {NO_RESULTS_MESSAGE}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((opt) => (
                    <Button
                      key={opt.value}
                      data-value={opt.value}
                      variant="ghost"
                      className={`w-full flex items-center gap-3 p-4 rounded-lg text-right justify-start min-h-[3rem] ${
                        initialValue === opt.value ? "bg-muted font-bold" : ""
                      }`}
                      onClick={() => handleSelect(opt.value)}
                      type="button"
                    >
                      {opt.icon && (
                        <Image
                          src={opt.icon}
                          alt={`דגל ${opt.label}`}
                          width={24}
                          height={18}
                          className="object-contain flex-shrink-0 rounded-sm"
                        />
                      )}
                      <span className="flex-1 text-right">{opt.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 flex-shrink-0" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
