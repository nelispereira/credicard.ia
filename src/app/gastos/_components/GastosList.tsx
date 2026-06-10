"use client";

import { useState } from "react";
import { excluirGasto, criarGasto, editarGasto } from "@/actions/gastos";
import { GastoForm } from "./GastoForm";

type Categoria = { id: number; nome: string; cor: string | null };

type Gasto = {
  id: number;
  descricao: string;
  valorTotal: number;
  tipo: "UNICO" | "RECORRENTE" | "PARCELADO";
  dataInicio: Date;
  dataFim: Date | null;
  numeroParcelas: number | null;
  categoria: Categoria;
};

const TIPO_LABELS: Record<Gasto["tipo"], string> = {
  UNICO: "Único",
  RECORRENTE: "Recorrente",
  PARCELADO: "Parcelado",
};

const TIPO_COLORS: Record<Gasto["tipo"], string> = {
  UNICO: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  RECORRENTE: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  PARCELADO: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function gastoInfo(gasto: Gasto) {
  if (gasto.tipo === "UNICO") {
    return `${formatDate(gasto.dataInicio)} · ${formatBRL(gasto.valorTotal)}`;
  }
  if (gasto.tipo === "RECORRENTE") {
    const desde = formatDate(gasto.dataInicio);
    const ate = gasto.dataFim ? `até ${formatDate(gasto.dataFim)}` : "indefinido";
    return `A partir de ${desde} · ${ate} · ${formatBRL(gasto.valorTotal)}/mês`;
  }
  // PARCELADO
  const mensal = gasto.valorTotal / (gasto.numeroParcelas ?? 1);
  const inicio = new Date(gasto.dataInicio);
  const fimDate = new Date(inicio);
  fimDate.setUTCMonth(fimDate.getUTCMonth() + (gasto.numeroParcelas ?? 1) - 1);
  return `${formatDate(gasto.dataInicio)} → ${formatDate(fimDate)} · ${gasto.numeroParcelas}x de ${formatBRL(mensal)}`;
}

export function GastosList({
  gastos,
  categorias,
}: {
  gastos: Gasto[];
  categorias: Categoria[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Botão novo gasto */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo gasto
        </button>
      )}

      {/* Formulário de novo gasto */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Novo gasto</h3>
          <GastoForm
            action={criarGasto}
            categorias={categorias}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Lista de gastos */}
      {gastos.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 dark:text-gray-600 py-4">
          Nenhum gasto cadastrado ainda.
        </p>
      )}

      {gastos.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {gastos.map((gasto) => (
              <GastoRow key={gasto.id} gasto={gasto} categorias={categorias} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GastoRow({ gasto, categorias }: { gasto: Gasto; categorias: Categoria[] }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="p-4">
        <GastoForm
          action={editarGasto}
          categorias={categorias}
          defaultValues={{
            id: gasto.id,
            categoriaId: gasto.categoria.id,
            descricao: gasto.descricao,
            valorTotal: gasto.valorTotal,
            tipo: gasto.tipo,
            dataInicio: gasto.dataInicio,
            dataFim: gasto.dataFim,
            numeroParcelas: gasto.numeroParcelas,
          }}
          onSuccess={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Bolinha da categoria */}
      <div
        className="mt-1 shrink-0 w-3 h-3 rounded-full"
        style={{ backgroundColor: gasto.categoria.cor ?? "#6366f1" }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {gasto.descricao}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[gasto.tipo]}`}
          >
            {TIPO_LABELS[gasto.tipo]}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{gasto.categoria.nome}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{gastoInfo(gasto)}</p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Editar
        </button>
        <form action={excluirGasto}>
          <input type="hidden" name="id" value={gasto.id} />
          <button
            type="submit"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={(e) => {
              if (!confirm(`Excluir "${gasto.descricao}"?`)) e.preventDefault();
            }}
          >
            Excluir
          </button>
        </form>
      </div>
    </div>
  );
}
