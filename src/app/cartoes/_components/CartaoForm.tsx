"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/cartoes";

type Action = (state: ActionState, data: FormData) => Promise<ActionState>;

type Props = {
  action: Action;
  defaultValues?: { id?: number; nome?: string; ultimos4?: string };
};

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export function CartaoForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Nome do cartão <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            defaultValue={defaultValues?.nome}
            placeholder="Ex: Visa Empresa"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Últimos 4 dígitos <span className="text-red-500">*</span>
          </label>
          <input
            name="ultimos4"
            defaultValue={defaultValues?.ultimos4}
            placeholder="Ex: 1234"
            maxLength={4}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {pending ? "Salvando…" : defaultValues?.id ? "Atualizar" : "Cadastrar"}
        </button>
        {defaultValues?.id && (
          <a
            href="/cartoes"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </a>
        )}
      </div>
    </form>
  );
}
