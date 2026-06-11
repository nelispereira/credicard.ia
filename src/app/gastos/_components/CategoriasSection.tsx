"use client";

import { useActionState, useTransition } from "react";
import { excluirCategoria, type CategoriaDeleteState } from "@/actions/gastos";
import { CategoriaForm } from "./CategoriaForm";

type Categoria = { id: number; nome: string; cor: string | null };

function CategoriaChip({ categoria }: { categoria: Categoria }) {
  const [state, formAction, pending] = useActionState<CategoriaDeleteState, FormData>(
    excluirCategoria,
    null
  );

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-full text-sm transition-opacity ${
          state?.error
            ? "border-red-300 dark:border-red-700"
            : "border-gray-200 dark:border-gray-800"
        } ${pending ? "opacity-50" : ""}`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: categoria.cor ?? "#6366f1" }}
        />
        <span className="text-gray-800 dark:text-gray-200">{categoria.nome}</span>
        <form action={formAction}>
          <input type="hidden" name="id" value={categoria.id} />
          <button
            type="submit"
            disabled={pending}
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-1 leading-none transition-colors disabled:cursor-not-allowed"
            title="Remover categoria"
          >
            {pending ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              "×"
            )}
          </button>
        </form>
      </div>
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400 px-1 max-w-xs">{state.error}</p>
      )}
    </div>
  );
}

export function CategoriasSection({ categorias }: { categorias: Categoria[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Categorias
      </h2>

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categorias.map((cat) => (
            <CategoriaChip key={cat.id} categoria={cat} />
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Nova categoria
        </p>
        <CategoriaForm />
      </div>
    </section>
  );
}
