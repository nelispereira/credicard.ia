"use client";

import { atribuirTransacao } from "@/actions/faturas";

type Pessoa = { id: number; nome: string };

export function AtribuirForm({
  transactionId,
  invoiceId,
  pessoas,
}: {
  transactionId: number;
  invoiceId: number;
  pessoas: Pessoa[];
}) {
  return (
    <form action={atribuirTransacao} className="flex gap-2 items-center">
      <input type="hidden" name="transactionId" value={transactionId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <select
        name="personId"
        required
        defaultValue=""
        className="border border-orange-300 dark:border-orange-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
      >
        <option value="" disabled>
          Atribuir a…
        </option>
        {pessoas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
      >
        OK
      </button>
    </form>
  );
}
