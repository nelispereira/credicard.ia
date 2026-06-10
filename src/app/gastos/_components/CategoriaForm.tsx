"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarCategoria, type CategoriaActionState } from "@/actions/gastos";

const CORES = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4", "#64748b", "#78716c",
];

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export function CategoriaForm() {
  const [state, formAction, pending] = useActionState(criarCategoria, null);
  const formRef = useRef<HTMLFormElement>(null);
  const wasSubmitting = useRef(false);

  if (pending) wasSubmitting.current = true;

  useEffect(() => {
    if (wasSubmitting.current && !pending && state === null) {
      wasSubmitting.current = false;
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3 items-end">
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex-1 min-w-40">
        <label className={labelClass}>Nome <span className="text-red-500">*</span></label>
        <input name="nome" required placeholder="Ex: Moradia" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Cor</label>
        <div className="flex gap-1.5 flex-wrap">
          {CORES.map((cor) => (
            <label key={cor} className="cursor-pointer">
              <input type="radio" name="cor" value={cor} defaultChecked={cor === CORES[0]} className="sr-only peer" />
              <span
                className="block w-6 h-6 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-gray-400 dark:peer-checked:ring-gray-500 transition-all"
                style={{ backgroundColor: cor }}
              />
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {pending ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}
