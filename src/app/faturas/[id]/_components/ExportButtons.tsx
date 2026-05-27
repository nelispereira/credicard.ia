"use client";

import { useEffect, useRef, useState } from "react";

type Pessoa = { id: number; nome: string };

export function ExportButtons({
  invoiceId,
  pessoas,
}: {
  invoiceId: number;
  pessoas: Pessoa[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function openPrint(personId?: number) {
    const url = `/faturas/${invoiceId}/imprimir${personId ? `?personId=${personId}` : ""}`;
    window.open(url, "_blank");
    setOpen(false);
  }

  return (
    <div ref={ref} className="no-print relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
      >
        Exportar PDF
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-black/40 z-20 min-w-48 py-1.5">
          <button
            onClick={() => openPrint()}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Fatura completa
          </button>

          {pessoas.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800 mx-2 my-1" />
              <p className="px-4 py-1 text-xs text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wide">
                Por pessoa
              </p>
              {pessoas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPrint(p.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {p.nome}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
