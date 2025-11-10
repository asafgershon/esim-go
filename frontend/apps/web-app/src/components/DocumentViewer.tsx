"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DocumentViewerProps {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

export default function DocumentViewer({ title, content, onClose }: DocumentViewerProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-10 text-right">
        {/* כפתור סגירה */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-600 hover:text-black transition"
        >
          <X size={24} />
        </button>

        <h1 className="text-3xl font-bold text-brand-green mb-8">{title}</h1>

        <div className="text-gray-800 leading-8 text-lg space-y-4">{content}</div>
      </div>
    </div>
  );
}
