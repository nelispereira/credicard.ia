"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/pessoas";

type Action = (state: ActionState, data: FormData) => Promise<ActionState>;

type Props = {
  action: Action;
  defaultValues?: {
    id?: number;
    nome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  };
};

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

function formatCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

export function PessoaForm({ action, defaultValues }: Props) {
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
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            defaultValue={state?.values?.nome ?? defaultValues?.nome}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            CPF <span className="text-red-500">*</span>
          </label>
          <input
            name="cpf"
            defaultValue={formatCpf(state?.values?.cpf ?? defaultValues?.cpf ?? "")}
            placeholder="000.000.000-00"
            maxLength={14}
            required
            onInput={(e) => {
              e.currentTarget.value = formatCpf(e.currentTarget.value);
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>E-mail</label>
          <input
            name="email"
            type="email"
            defaultValue={state?.values?.email ?? defaultValues?.email}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Telefone</label>
          <input
            name="telefone"
            defaultValue={state?.values?.telefone ?? defaultValues?.telefone}
            placeholder="(11) 99999-9999"
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
            href="/pessoas"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </a>
        )}
      </div>
    </form>
  );
}
