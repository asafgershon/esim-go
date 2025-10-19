"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface DocumentPageProps {
  title: string;
  content: string | React.ReactNode;
}

export default function DocumentPage({ title, content }: DocumentPageProps) {
  const router = useRouter();

  return (
    <main className="flex justify-center bg-[#f9f9f9] min-h-screen py-20 px-4">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-10 text-right leading-8">
        <h1 className="text-3xl font-bold text-brand-green mb-8">{title}</h1>

        <div className="text-gray-800 text-lg whitespace-pre-line">
          {typeof content === "string" ? content : content}
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-full bg-brand-green text-white hover:bg-brand-green/80 transition"
          >
            חזרה
          </button>
        </div>
      </div>
    </main>
  );
}
