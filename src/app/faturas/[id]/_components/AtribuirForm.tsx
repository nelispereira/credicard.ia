"use client";

import { useFormStatus } from "react-dom";
import { atribuirTransacao } from "@/actions/faturas";
import { SearchableSelect } from "./SearchableSelect";

type Pessoa = { id: number; nome: string };

function FormFields({ pessoas }: { pessoas: Pessoa[] }) {
  const { pending } = useFormStatus();
  return (
    <>
      <SearchableSelect name="personId" options={pessoas} placeholder="Atribuir a…" disabled={pending} />
      <button
        type="submit"
        disabled={pending}
        className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "OK"}
      </button>
    </>
  );
}

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
      <FormFields pessoas={pessoas} />
    </form>
  );
}
