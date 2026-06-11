"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteCartao } from "@/actions/cartoes";

type Cartao = {
  id: number;
  nome: string;
  ultimos4: string;
  _count: { cardUsages: number; invoices: number };
};

export function CartoesList({ cartoes }: { cartoes: Cartao[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = cartoes.filter((c) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return c.nome.toLowerCase().includes(q) || c.ultimos4.includes(q);
  });

  return (
    <div className="mb-8">
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar por nome ou final do cartão..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-600">
          {busca ? "Nenhum cartão encontrado." : "Nenhum cartão cadastrado ainda."}
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Final</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Usos</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Faturas</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.nome}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums font-mono text-xs">
                      •••• {c.ultimos4}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c._count.cardUsages}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c._count.invoices}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 justify-end">
                        <Link
                          href={`/cartoes/${c.id}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                          Editar
                        </Link>
                        {c._count.cardUsages + c._count.invoices === 0 ? (
                          <form action={deleteCartao}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                            >
                              Excluir
                            </button>
                          </form>
                        ) : (
                          <span
                            title="Possui registros vinculados"
                            className="text-xs text-gray-300 dark:text-gray-700 cursor-not-allowed"
                          >
                            Excluir
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
