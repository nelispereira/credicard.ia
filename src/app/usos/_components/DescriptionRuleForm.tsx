"use client";

import { useActionState } from "react";
import { createDescriptionRule } from "@/actions/usos";

type Pessoa = { id: number; nome: string };
type Cartao = { id: number; nome: string; ultimos4: string };

const selectClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export function DescriptionRuleForm({
  pessoas,
  cartoes,
}: {
  pessoas: Pessoa[];
  cartoes: Cartao[];
}) {
  const [state, formAction, pending] = useActionState(createDescriptionRule, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>
            Pessoa <span className="text-red-500">*</span>
          </label>
          <select name="personId" required className={selectClass}>
            <option value="">Selecione…</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Cartão <span className="text-red-500">*</span>
          </label>
          <select name="creditCardId" required className={selectClass}>
            <option value="">Selecione…</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} •••{c.ultimos4}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Palavra-chave <span className="text-red-500">*</span>
          </label>
          <input
            name="palavra"
            placeholder="Ex: APPLE, DL*GOOGLE, iFood"
            required
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {pending ? "Salvando…" : "Adicionar regra"}
      </button>
    </form>
  );
}
