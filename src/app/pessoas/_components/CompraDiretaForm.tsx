"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { CompraDiretaActionState } from "@/actions/comprasDiretas";

type Props = {
  personId: number;
  action: (state: CompraDiretaActionState, data: FormData) => Promise<CompraDiretaActionState>;
  onSuccess?: () => void;
};

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CompraDiretaForm({ personId, action, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [valorTotal, setValorTotal] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const wasSubmitting = useRef(false);

  if (pending) wasSubmitting.current = true;

  useEffect(() => {
    if (wasSubmitting.current && !pending && state === null) {
      wasSubmitting.current = false;
      onSuccess?.();
    }
  }, [pending, state, onSuccess]);

  const valorNum = parseFloat(valorTotal.replace(",", ".")) || 0;
  const parcelasNum = parseInt(numeroParcelas) || 1;
  const valorMensal = parcelasNum >= 2 ? valorNum / parcelasNum : valorNum;

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="personId" value={personId} />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição <span className="text-red-500">*</span></label>
          <input
            name="descricao"
            required
            placeholder="Ex: Compra direta, Empréstimo…"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Valor total <span className="text-red-500">*</span></label>
          <input
            name="valorTotal"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
          {parcelasNum >= 2 && valorNum > 0 && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {formatBRL(valorMensal)} por parcela
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Nº de parcelas <span className="text-red-500">*</span></label>
          <input
            name="numeroParcelas"
            type="number"
            min="1"
            step="1"
            required
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Data da 1ª parcela <span className="text-red-500">*</span></label>
          <input
            name="dataInicio"
            type="date"
            required
            defaultValue={today}
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
          {pending ? "Salvando…" : "Adicionar compra"}
        </button>
        {onSuccess && (
          <button
            type="button"
            onClick={onSuccess}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
