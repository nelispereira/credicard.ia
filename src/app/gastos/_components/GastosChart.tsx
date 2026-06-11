"use client";

import type { ResumoMes } from "@/actions/gastos";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBRLShort(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

export function GastosChart({ meses }: { meses: ResumoMes[] }) {
  if (meses.length === 0) return null;

  const maxTotal = Math.max(...meses.map((m) => m.total), 1);

  const now = new Date();
  const currentMes = now.getMonth() + 1;
  const currentAno = now.getFullYear();
  const currentIdx = meses.findIndex((m) => m.mes === currentMes && m.ano === currentAno);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Histórico mensal</h2>
      </div>

      <div className="p-4">
        <div className="flex items-end gap-2 h-40">
          {meses.map((m) => {
            const pct = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0;
            const isCurrentMonth = m.mes === currentMes && m.ano === currentAno;
            const isFuture =
              m.ano > currentAno || (m.ano === currentAno && m.mes > currentMes);

            return (
              <div key={`${m.ano}-${m.mes}`} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatBRLShort(m.total)}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: "112px" }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isCurrentMonth
                        ? "bg-indigo-500 dark:bg-indigo-400"
                        : isFuture
                        ? "bg-indigo-100 dark:bg-indigo-950/60 border border-dashed border-indigo-300 dark:border-indigo-700 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/60"
                        : "bg-indigo-200 dark:bg-indigo-900/60 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-800/80"
                    }`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${m.label}: ${formatBRL(m.total)}`}
                  />
                </div>
                <span
                  className={`text-xs tabular-nums capitalize ${
                    isCurrentMonth
                      ? "font-semibold text-indigo-600 dark:text-indigo-400"
                      : isFuture
                      ? "text-indigo-400 dark:text-indigo-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Linha de total do mês atual */}
        {currentIdx >= 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {meses[currentIdx].label}
            </span>
            <span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatBRL(meses[currentIdx].total)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
