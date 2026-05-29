"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface AvatarModalProps {
  src: string;
  alt: string;
  name: string;
}

export function AvatarModal({ src, alt, name }: AvatarModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`Ver foto de ${name}`}
      >
        <Image
          src={src}
          alt={alt}
          width={40}
          height={40}
          className="rounded-full"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Image
              src={src}
              alt={alt}
              width={200}
              height={200}
              className="rounded-full"
            />

            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
          </div>
        </div>
      )}
    </>
  );
}
