"use client";

type Pessoa = { id: number; nome: string };

function getLastMonths(n: number): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return months;
}

export function UsosFilter({
  pessoas,
  currentMes,
  currentPessoaId,
}: {
  pessoas: Pessoa[];
  currentMes?: string;
  currentPessoaId?: string;
}) {
  const months = getLastMonths(12);
  const hasFilter = currentMes || currentPessoaId;

  return (
    <form method="GET" className="flex flex-wrap gap-3 items-end mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mês</label>
        <select
          name="mes"
          defaultValue={currentMes ?? ""}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="">Todos</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Pessoa</label>
        <select
          name="pessoaId"
          defaultValue={currentPessoaId ?? ""}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="">Todas</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
      >
        Filtrar
      </button>

      {hasFilter && (
        <a
          href="/usos"
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Limpar
        </a>
      )}
    </form>
  );
}
