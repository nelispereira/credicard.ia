"use client";

import { useState, useRef, useEffect } from "react";

type Option = { id: number; nome: string };

export function SearchableSelect({
  name,
  options,
  placeholder,
  disabled,
}: {
  name: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.nome.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(option: Option) {
    setSelectedId(option.id);
    setQuery(option.nome);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelectedId(null);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => !disabled && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        className="border border-orange-300 dark:border-orange-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 transition-colors w-44"
      />
      <input type="hidden" name={name} value={selectedId ?? ""} />

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 mt-1 w-44 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg text-xs">
          {filtered.map((o) => (
            <li
              key={o.id}
              onMouseDown={() => select(o)}
              className="px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-gray-900 dark:text-gray-100"
            >
              {o.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
