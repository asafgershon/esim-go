"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SimpleOption = {
  value: string;
  label: string;
  icon?: string;
  keywords?: string[];
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function SimpleSearchCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "חיפוש...",
  emptyMessage = "אין תוצאות",
  className = "",
}: {
  options: SimpleOption[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 0,
  });

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;

    return options.filter((o) => {
      const hay = [o.label, ...(o.keywords || [])]
        .filter(Boolean)
        .map(normalize)
        .join(" ");
      return hay.includes(q);
    });
  }, [options, query]);

  const updatePos = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 6, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const a = anchorRef.current;
      const panel = document.getElementById("simple-combobox-panel");
      const t = e.target as Node;
      if (a && a.contains(t)) return;
      if (panel && panel.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery("");
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={className}
      >
        <span className="flex items-center gap-2">
          {selected?.icon && (
            <img src={selected.icon} alt="" className="w-5 h-5 rounded-sm" />
          )}
          <span className={selected ? "" : "opacity-50"}>
            {selected?.label || placeholder}
          </span>
        </span>
        <span className="opacity-40">▾</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="simple-combobox-panel"
            role="listbox"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: pos.width,
              zIndex: 99999,
            }}
            className="rounded-xl border border-black/10 bg-white shadow-lg"
          >
            <div className="p-2 border-b border-black/10">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-10 px-3 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>

            <div className="max-h-[320px] overflow-auto p-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm opacity-70">{emptyMessage}</div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => {
                      onValueChange(o.value);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-right"
                  >
                    {o.icon && (
                      <img src={o.icon} alt="" className="w-5 h-5 rounded-sm" />
                    )}
                    <span className="flex-1">{o.label}</span>
                    {o.value === value && <span className="opacity-60">✓</span>}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
