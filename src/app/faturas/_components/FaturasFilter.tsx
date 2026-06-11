"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Cartao = { id: number; nome: string; ultimos4: string };

export function FaturasFilter({ cartoes }: { cartoes: Cartao[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const cartao = sp.get("cartao") ?? "";
  const mes = sp.get("mes") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/faturas?${params.toString()}`);
    },
    [router, sp]
  );

  const hasFilters = cartao || mes;

  const selectClass =
    "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="flex flex-wrap gap-2 items-center mb-6">
      <select
        value={cartao}
        onChange={(e) => update("cartao", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os cartões</option>
        {cartoes.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.nome} •••{c.ultimos4}
          </option>
        ))}
      </select>

      <input
        type="month"
        value={mes}
        onChange={(e) => update("mes", e.target.value)}
        className={selectClass}
      />

      {hasFilters && (
        <a
          href="/faturas"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          Limpar filtros
        </a>
      )}
    </div>
  );
}
