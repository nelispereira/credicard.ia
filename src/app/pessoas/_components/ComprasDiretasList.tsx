"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { criarCompraDireta, excluirCompraDireta } from "@/actions/comprasDiretas";
import { CompraDiretaForm } from "./CompraDiretaForm";

type CompraDireta = {
  id: number;
  descricao: string;
  valorTotal: number;
  numeroParcelas: number;
  dataInicio: Date;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function compraInfo(compra: CompraDireta) {
  if (compra.numeroParcelas <= 1) {
    return `${formatDate(compra.dataInicio)} · ${formatBRL(compra.valorTotal)} à vista`;
  }
  const mensal = compra.valorTotal / compra.numeroParcelas;
  const inicio = new Date(compra.dataInicio);
  const fimDate = new Date(inicio);
  fimDate.setUTCMonth(fimDate.getUTCMonth() + compra.numeroParcelas - 1);
  return `${formatDate(compra.dataInicio)} → ${formatDate(fimDate)} · ${compra.numeroParcelas}x de ${formatBRL(mensal)}`;
}

export function ComprasDiretasList({ personId, compras }: { personId: number; compras: CompraDireta[] }) {
  const sp = useSearchParams();
  const [showForm, setShowForm] = useState(sp.get("nova") === "1");

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova compra direta
        </button>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Nova compra direta</h3>
          <CompraDiretaForm
            personId={personId}
            action={criarCompraDireta}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {compras.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 dark:text-gray-600 py-4">
          Nenhuma compra direta cadastrada ainda.
        </p>
      )}

      {compras.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {compras.map((compra) => (
              <div
                key={compra.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {compra.descricao}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{compraInfo(compra)}</p>
                </div>

                <div className="shrink-0">
                  <form action={excluirCompraDireta}>
                    <input type="hidden" name="id" value={compra.id} />
                    <button
                      type="submit"
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={(e) => {
                        if (!confirm(`Excluir "${compra.descricao}"?`)) e.preventDefault();
                      }}
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
