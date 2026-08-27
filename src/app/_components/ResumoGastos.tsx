"use client";

import { useState, useTransition } from "react";
import {
  calcularResumoMensal,
  listarGastosDaCategoriaNoMes,
  type ResumoMensal,
  type GastoDetalhe,
} from "@/actions/gastos";

type CarregarResumo = (mes: number, ano: number) => Promise<ResumoMensal>;
type CarregarDetalhes = (categoriaId: number, mes: number, ano: number) => Promise<GastoDetalhe[]>;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nomeMes(mes: number, ano: number) {
  const d = new Date(ano, mes - 1, 1);
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const TIPO_LABELS: Record<string, string> = {
  UNICO: "Único",
  RECORRENTE: "Recorrente",
  PARCELADO: "Parcelado",
};

function GastoDetalheLinha({ gasto }: { gasto: GastoDetalhe }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{gasto.descricao}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
          {TIPO_LABELS[gasto.tipo] ?? gasto.tipo}
        </span>
      </div>
      <span className="text-xs font-medium tabular-nums text-gray-800 dark:text-gray-200 ml-3 shrink-0">
        {formatBRL(gasto.valorMensal)}
      </span>
    </div>
  );
}

function CategoriaRow({
  cat,
  mes,
  ano,
  carregarDetalhes,
}: {
  cat: ResumoMensal["porCategoria"][number];
  mes: number;
  ano: number;
  carregarDetalhes: CarregarDetalhes;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detalhes, setDetalhes] = useState<GastoDetalhe[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detalhes === null) {
      startTransition(async () => {
        const result = await carregarDetalhes(cat.categoriaId, mes, ano);
        setDetalhes(result);
      });
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
      >
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: cat.cor ?? "#6366f1" }}
        />
        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
            {cat.nome}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
              {formatBRL(cat.total)}
            </span>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-5 pl-3 border-l-2 border-gray-100 dark:border-gray-800 mt-1 mb-1">
          {isPending && (
            <p className="text-xs text-gray-400 py-1">Carregando…</p>
          )}
          {!isPending && detalhes && detalhes.length === 0 && (
            <p className="text-xs text-gray-400 py-1">Nenhum gasto neste mês.</p>
          )}
          {!isPending && detalhes && detalhes.map((g) => (
            <GastoDetalheLinha key={g.id} gasto={g} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ResumoGastos({
  initialData,
  initialMes,
  initialAno,
  carregarResumo = calcularResumoMensal,
  carregarDetalhes = listarGastosDaCategoriaNoMes,
}: {
  initialData: ResumoMensal;
  initialMes: number;
  initialAno: number;
  carregarResumo?: CarregarResumo;
  carregarDetalhes?: CarregarDetalhes;
}) {
  const [mes, setMes] = useState(initialMes);
  const [ano, setAno] = useState(initialAno);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  function navMes(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m);
    setAno(a);
    startTransition(async () => {
      const result = await carregarResumo(m, a);
      setData(result);
    });
  }

  const total = data.totalGeral;
  const temDados = data.porCategoria.length > 0 || data.debitoCartao > 0 || data.debitoDireto > 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Cabeçalho com navegação de mês */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Resumo de gastos
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navMes(-1)}
            disabled={isPending}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Mês anterior"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 w-36 text-center transition-opacity ${isPending ? "opacity-50" : ""}`}>
            {nomeMes(mes, ano)}
          </span>
          <button
            onClick={() => navMes(1)}
            disabled={isPending}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Próximo mês"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className={`p-4 space-y-1 transition-opacity ${isPending ? "opacity-50" : ""}`}>
        {!temDados && (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-2 text-center">
            Nenhum gasto neste mês.
          </p>
        )}

        {/* Linhas por categoria (clicáveis) */}
        {data.porCategoria.map((cat) => (
          <CategoriaRow
            key={cat.categoriaId}
            cat={cat}
            mes={mes}
            ano={ano}
            carregarDetalhes={carregarDetalhes}
          />
        ))}

        {/* Linha débito cartão */}
        {data.debitoCartao > 0 && (
          <div className="flex items-center gap-3 py-1">
            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-600" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Cartão de crédito</span>
              <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                {formatBRL(data.debitoCartao)}
              </span>
            </div>
          </div>
        )}

        {/* Linha compras diretas */}
        {data.debitoDireto > 0 && (
          <div className="flex items-center gap-3 py-1">
            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-600" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Compras diretas</span>
              <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                {formatBRL(data.debitoDireto)}
              </span>
            </div>
          </div>
        )}

        {/* Barra separadora + total */}
        {temDados && (
          <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total</span>
            <span className="font-bold text-lg tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatBRL(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
