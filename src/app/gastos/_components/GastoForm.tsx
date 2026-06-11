"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { GastoActionState } from "@/actions/gastos";

type Categoria = { id: number; nome: string; cor: string | null };
type TipoGasto = "UNICO" | "RECORRENTE" | "PARCELADO";

type DefaultValues = {
  id?: number;
  categoriaId?: number;
  descricao?: string;
  valorTotal?: number;
  tipo?: TipoGasto;
  dataInicio?: Date;
  dataFim?: Date | null;
  numeroParcelas?: number | null;
};

type Action = (state: GastoActionState, data: FormData) => Promise<GastoActionState>;

type Props = {
  action: Action;
  categorias: Categoria[];
  defaultValues?: DefaultValues;
  onSuccess?: () => void;
};

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const selectClass =
  "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPOS: { value: TipoGasto; label: string }[] = [
  { value: "UNICO", label: "Único" },
  { value: "RECORRENTE", label: "Recorrente" },
  { value: "PARCELADO", label: "Parcelado" },
];

export function GastoForm({ action, categorias, defaultValues, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [tipo, setTipo] = useState<TipoGasto>(defaultValues?.tipo ?? "UNICO");
  const [valorTotal, setValorTotal] = useState(defaultValues?.valorTotal?.toString() ?? "");
  const [numeroParcelas, setNumeroParcelas] = useState(defaultValues?.numeroParcelas?.toString() ?? "");
  const wasSubmitting = useRef(false);

  if (pending) wasSubmitting.current = true;

  useEffect(() => {
    if (wasSubmitting.current && !pending && state === null) {
      wasSubmitting.current = false;
      onSuccess?.();
    }
  }, [pending, state, onSuccess]);

  const valorNum = parseFloat(valorTotal.replace(",", ".")) || 0;
  const parcelasNum = parseInt(numeroParcelas) || 0;
  const valorMensal = tipo === "PARCELADO" && parcelasNum >= 2 ? valorNum / parcelasNum : valorNum;

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Tipo */}
      <div>
        <label className={labelClass}>Tipo <span className="text-red-500">*</span></label>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden w-fit">
          {TIPOS.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="tipo"
                value={t.value}
                checked={tipo === t.value}
                onChange={() => setTipo(t.value)}
                className="sr-only"
              />
              <span
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  tipo === t.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Descrição */}
        <div>
          <label className={labelClass}>Descrição <span className="text-red-500">*</span></label>
          <input
            name="descricao"
            required
            defaultValue={defaultValues?.descricao}
            placeholder="Ex: Aluguel, Streaming, Academia…"
            className={inputClass}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className={labelClass}>Categoria <span className="text-red-500">*</span></label>
          <select name="categoriaId" required defaultValue={defaultValues?.categoriaId ?? ""} className={selectClass}>
            <option value="">Selecione…</option>
            {[...categorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Valor Total */}
        <div>
          <label className={labelClass}>
            {tipo === "PARCELADO" ? "Valor total" : "Valor mensal"}{" "}
            <span className="text-red-500">*</span>
          </label>
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
          {tipo === "PARCELADO" && parcelasNum >= 2 && valorNum > 0 && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {formatBRL(valorMensal)} por parcela
            </p>
          )}
        </div>

        {/* Data Início */}
        <div>
          <label className={labelClass}>Data início <span className="text-red-500">*</span></label>
          <input
            name="dataInicio"
            type="date"
            required
            defaultValue={toDateInput(defaultValues?.dataInicio) || today}
            className={inputClass}
          />
        </div>

        {/* Campo RECORRENTE: Data Fim */}
        {tipo === "RECORRENTE" && (
          <div>
            <label className={labelClass}>Data fim</label>
            <input
              name="dataFim"
              type="date"
              defaultValue={toDateInput(defaultValues?.dataFim)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Deixe em branco para repetir indefinidamente.
            </p>
          </div>
        )}

        {/* Campo PARCELADO: Nº Parcelas */}
        {tipo === "PARCELADO" && (
          <div>
            <label className={labelClass}>Nº de parcelas <span className="text-red-500">*</span></label>
            <input
              name="numeroParcelas"
              type="number"
              min="2"
              step="1"
              required
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(e.target.value)}
              placeholder="Ex: 12"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {pending ? "Salvando…" : defaultValues?.id ? "Atualizar" : "Adicionar gasto"}
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
