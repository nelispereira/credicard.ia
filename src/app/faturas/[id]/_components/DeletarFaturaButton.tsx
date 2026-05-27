"use client";

import { deletarFatura } from "@/actions/faturas";

export function DeletarFaturaButton({ invoiceId }: { invoiceId: number }) {
  async function handleClick() {
    if (!confirm("Deletar esta fatura e todas as suas transações? Essa ação não pode ser desfeita.")) return;
    await deletarFatura(invoiceId);
  }

  return (
    <button
      onClick={handleClick}
      className="no-print px-4 py-2 border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
    >
      Deletar fatura
    </button>
  );
}
